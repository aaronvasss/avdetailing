import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "aaronvasquez100@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const parts = timeStr.match(/(\d+):(\d+)/);
  if (!parts) return timeStr;
  const h = parseInt(parts[1]);
  const m = parts[2];
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

async function sendEmail(to: string, from: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
  } catch (err) {
    console.error("Email error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, action, manage_token } = await req.json();

    // Validate booking_id is a UUID
    if (!booking_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking_id)) {
      return new Response(JSON.stringify({ error: "Invalid booking ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require a manage_token secret (>= 32 hex chars) to prevent UUID-only access
    if (!manage_token || typeof manage_token !== "string" || manage_token.length < 32) {
      return new Response(JSON.stringify({ error: "Missing or invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch booking and verify token matches
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("id", booking_id)
      .eq("manage_token", manage_token)
      .single();

    if (fetchErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET action - return booking details
    if (action === "get") {
      return new Response(JSON.stringify({
        booking: {
          id: booking.id,
          scheduled_date: booking.scheduled_date,
          scheduled_time: booking.scheduled_time,
          service_name: (booking.services as any)?.name || "Detailing Service",
          service_address: booking.service_address,
          service_city: booking.service_city,
          service_state: booking.service_state,
          vehicle_info: [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || booking.vehicle_type || "Vehicle",
          status: booking.status,
          guest_name: booking.guest_name,
        },
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CANCEL action
    if (action === "cancel") {
      if (booking.status === "cancelled") {
        return new Response(JSON.stringify({ error: "This booking has already been cancelled" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (booking.status === "completed") {
        return new Response(JSON.stringify({ error: "This booking has already been completed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking_id);

      if (updateErr) {
        return new Response(JSON.stringify({ error: "Failed to cancel booking" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const serviceName = (booking.services as any)?.name || "Detailing Service";
      const customerName = booking.guest_name || "Customer";
      const date = formatDate(booking.scheduled_date);
      const time = formatTime(booking.scheduled_time);

      // Send cancellation confirmation to customer
      if (booking.guest_email) {
        await sendEmail(
          booking.guest_email,
          "AV Detailing <noreply@avdetailing.net>",
          `Booking Cancelled - ${serviceName}`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;">
            <div style="text-align:center;margin-bottom:30px;">
              <h1 style="color:#ef4444;margin:0;">AV DETAILING 🚗</h1>
            </div>
            <div style="background:#525252;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
              <span style="font-size:18px;font-weight:bold;">Booking Cancelled</span>
            </div>
            <p style="color:#ccc;">Hi ${customerName},</p>
            <p style="color:#ccc;">Your ${serviceName} on ${date} at ${time} has been cancelled.</p>
            <p style="color:#ccc;">We hope to see you again soon!</p>
            <div style="text-align:center;margin-top:24px;">
              <a href="https://avdetailing.net/book" style="display:inline-block;background:#ef4444;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Book Another Appointment</a>
            </div>
            <p style="color:#888;font-size:14px;margin-top:24px;">Questions? Call us at (225) 521-6264</p>
          </div>`,
        );
      }

      // Notify admin
      await sendEmail(
        ADMIN_EMAIL,
        "AV Detailing <notifications@avdetailing.net>",
        `❌ Booking Cancelled - ${customerName} — ${serviceName}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#111;color:#fff;border-radius:12px;">
          <h2 style="color:#ef4444;">Booking Cancelled ❌</h2>
          <p><strong>${customerName}</strong> cancelled their <strong>${serviceName}</strong> appointment.</p>
          <p>Was scheduled for: ${date} at ${time}</p>
          <p style="margin-top:16px;"><a href="https://avdetailing.net/admin" style="color:#ef4444;font-weight:600;">View in Admin Dashboard →</a></p>
        </div>`,
      );

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
