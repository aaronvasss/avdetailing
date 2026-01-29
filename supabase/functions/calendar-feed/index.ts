import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, addMinutes, parse } from "https://esm.sh/date-fns@3.6.0";
import { timingSafeEqual } from "https://deno.land/std@0.190.0/crypto/timing_safe_equal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Constant-time token comparison to prevent timing attacks
function secureTokenCompare(expectedToken: string | null, providedToken: string | null): boolean {
  const expected = expectedToken || '';
  const provided = providedToken || '';
  
  const encoder = new TextEncoder();
  const expectedBuffer = encoder.encode(expected);
  const providedBuffer = encoder.encode(provided);
  
  // Length check - still constant time because we always do the comparison
  if (expectedBuffer.length !== providedBuffer.length) {
    // Do a dummy comparison to maintain constant time
    const dummyBuffer = new Uint8Array(expectedBuffer.length);
    try {
      timingSafeEqual(expectedBuffer, dummyBuffer);
    } catch {
      // Ignore errors from dummy comparison
    }
    return false;
  }
  
  try {
    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

// Rate limiting check
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const rateLimitKey = `calendar_feed:${userId}`;
  const limit = rateLimitStore.get(rateLimitKey);
  
  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (limit && now < limit.resetTime) {
    if (limit.count >= 60) {
      return false; // Rate limited
    }
    limit.count++;
  } else {
    rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
  }
  
  return true; // Allowed
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const token = url.searchParams.get("token");

    if (!userId || !token) {
      return new Response("Missing user_id or token", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Rate limiting check
    if (!checkRateLimit(userId)) {
      console.log(`Calendar feed rate limited: user_id=${userId}`);
      return new Response("Too many requests", { 
        status: 429, 
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token matches the user's calendar token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("calendar_token, full_name, email")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      console.log(`Calendar feed access failed: user_id=${userId}, reason=user_not_found`);
      return new Response("User not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Use constant-time comparison to prevent timing attacks
    const tokenValid = secureTokenCompare(profile.calendar_token, token);
    
    // Log access attempt
    console.log(`Calendar feed access: user_id=${userId}, success=${tokenValid}`);
    
    if (!tokenValid) {
      return new Response("Invalid token", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Fetch user's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        service_address,
        service_city,
        service_state,
        service_zip,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        status,
        services (name)
      `)
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed", "in_progress"])
      .order("scheduled_date", { ascending: true });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return new Response("Error fetching bookings", { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Generate ICS content
    const now = formatICSDate(new Date());
    const events: string[] = [];

    for (const booking of bookings || []) {
      let startDate: Date;
      const dateStr = booking.scheduled_date;
      const timeStr = booking.scheduled_time;

      try {
        startDate = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm:ss", new Date());
        if (isNaN(startDate.getTime())) {
          startDate = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", new Date());
        }
        if (isNaN(startDate.getTime())) {
          startDate = new Date(dateStr);
        }
      } catch {
        startDate = new Date(dateStr);
      }

      const duration = booking.duration_minutes || 120;
      const endDate = addMinutes(startDate, duration);

      const location = [
        booking.service_address,
        booking.service_city,
        booking.service_state,
        booking.service_zip,
      ]
        .filter(Boolean)
        .join(", ");

      const vehicle = [
        booking.vehicle_year,
        booking.vehicle_make,
        booking.vehicle_model,
      ]
        .filter(Boolean)
        .join(" ");

      const services = booking.services as { name: string } | { name: string }[] | null;
      const serviceName = Array.isArray(services) 
        ? services[0]?.name 
        : services?.name;
      const title = `AV Detailing - ${serviceName || "Detailing Service"}`;
      const description = [
        `Service: ${serviceName || "Detailing Service"}`,
        vehicle ? `Vehicle: ${vehicle}` : null,
        `Location: ${location || "TBD"}`,
        `Status: ${booking.status}`,
        "",
        "Questions? Call (225) 521-6264",
        "https://avdetailing.lovable.app",
      ]
        .filter((line) => line !== null)
        .join("\\n");

      events.push([
        "BEGIN:VEVENT",
        `UID:${booking.id}@avdetailing.lovable.app`,
        `DTSTAMP:${now}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${escapeICSText(title)}`,
        `DESCRIPTION:${escapeICSText(description)}`,
        `LOCATION:${escapeICSText(location)}`,
        `STATUS:${booking.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        "DESCRIPTION:AV Detailing appointment tomorrow",
        "END:VALARM",
        "BEGIN:VALARM",
        "TRIGGER:-PT2H",
        "ACTION:DISPLAY",
        "DESCRIPTION:AV Detailing appointment in 2 hours",
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"));
    }

    const calendarName = profile.full_name 
      ? `AV Detailing - ${profile.full_name}` 
      : "AV Detailing Appointments";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AV Detailing//Booking System//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeICSText(calendarName)}`,
      "X-WR-CALDESC:Your AV Detailing appointments",
      "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
      "X-PUBLISHED-TTL:PT1H",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(icsContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="av-detailing.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Calendar feed error:", error);
    return new Response("Internal server error", { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
