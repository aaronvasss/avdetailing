import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PHONE = "(225) 521-6264";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function padTwo(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatICSDate(d: Date): string {
  return `${d.getFullYear()}${padTwo(d.getMonth() + 1)}${padTwo(d.getDate())}T${padTwo(d.getHours())}${padTwo(d.getMinutes())}${padTwo(d.getSeconds())}`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("id");
    const token = url.searchParams.get("token");

    if (!bookingId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)) {
      return new Response("Invalid booking ID", { status: 400 });
    }

    if (!token || token.length < 16) {
      return new Response("Missing or invalid token", { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, scheduled_date, scheduled_time, duration_minutes, service_address, service_city, service_state, service_zip, vehicle_year, vehicle_make, vehicle_model, services(name)")
      .eq("id", bookingId)
      .eq("manage_token", token)
      .single();

    if (error || !booking) {
      return new Response("Booking not found", { status: 404 });
    }

    const serviceName = (booking.services as any)?.name || "Detailing Service";
    const location = [booking.service_address, booking.service_city, booking.service_state || "LA", booking.service_zip].filter(Boolean).join(", ");
    const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ");

    // Parse start date/time
    const startDate = new Date(booking.scheduled_date);
    const timeParts = booking.scheduled_time.match(/(\d+):(\d+)/);
    if (timeParts) {
      startDate.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]), 0, 0);
    }

    const durationMin = booking.duration_minutes || 180;
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    const description = [
      `Service: ${serviceName}`,
      vehicle ? `Vehicle: ${vehicle}` : null,
      `Location: ${location || "TBD"}`,
      "",
      `Questions? Call ${PHONE}`,
      "https://avdetailing.net",
    ].filter((l) => l !== null).join("\\n");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AV Detailing//Booking System//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${booking.id}@avdetailing.net`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS("AV Detailing - " + serviceName)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `LOCATION:${escapeICS(location)}`,
      "STATUS:CONFIRMED",
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
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(icsContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="av-detailing-${booking.scheduled_date}.ics"`,
      },
    });
  } catch (err) {
    console.error("Error generating ICS:", err);
    return new Response("Internal server error", { status: 500 });
  }
});
