import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, addMinutes, parse } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response("User not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    if (profile.calendar_token !== token) {
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
