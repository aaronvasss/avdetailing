import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller is staff/admin
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "staff"]);
      if (!roleData || roleData.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { bookingId, type } = await req.json();
    // type: 'email_confirmation' | 'sms_confirmation' | 'admin_notification'

    if (!bookingId || !type) {
      return new Response(JSON.stringify({ error: "Missing bookingId or type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch booking with service info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, services(name, slug)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile if user_id exists
    let profile: any = null;
    if (booking.user_id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", booking.user_id)
        .maybeSingle();
      profile = data;
    }

    // Prioritize guest fields (actual customer) over profile (may be admin who created booking)
    const customerName = booking.guest_name || profile?.full_name || "Customer";
    const customerEmail = booking.guest_email || profile?.email;
    const customerPhone = booking.guest_phone || profile?.phone;
    const serviceName = booking.services?.name || "Detailing Service";

    // Fetch add-ons
    const { data: addOns } = await supabase
      .from("booking_add_ons")
      .select("name, price")
      .eq("booking_id", bookingId);

    // Fetch business settings for SMS sender
    const { data: settingsData } = await supabase
      .from("business_settings")
      .select("key, value")
      .in("key", ["sms_sender_phone", "public_business_phone"]);
    const settings = (settingsData || []).reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    const smsSenderPhone = settings.sms_sender_phone || "+12252284796";
    const publicPhone = settings.public_business_phone || "(225) 521-6264";

    let success = false;
    let errorMessage: string | undefined;
    let recipient = "";

    if (type === "email_confirmation") {
      if (!customerEmail) {
        return new Response(JSON.stringify({ error: "No customer email on file" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      recipient = customerEmail;

      // Call the existing send-booking-confirmation function
      const confirmPayload = {
        customerEmail,
        customerName,
        serviceName,
        scheduledDate: booking.scheduled_date,
        scheduledTime: booking.scheduled_time,
        serviceAddress: booking.service_address || "",
        serviceCity: booking.service_city || "",
        serviceState: booking.service_state || "LA",
        serviceZip: booking.service_zip || "",
        vehicleInfo: [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" "),
        vehicleType: booking.vehicle_type || "car",
        vehicleSize: booking.vehicle_size || "",
        totalPrice: booking.total_price || 0,
        bookingId: booking.id,
        basePrice: booking.subtotal || booking.total_price || 0,
        addOns: addOns || [],
        estimatedDuration: booking.duration_minutes || 180,
        customerPhone,
        depositAmount: booking.deposit_amount || 0,
        paymentMethod: booking.payment_method || "in_person",
        manageToken: booking.manage_token,
      };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-booking-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmPayload),
      });

      if (res.ok) {
        success = true;
      } else {
        const errData = await res.json().catch(() => ({}));
        errorMessage = errData.error || `HTTP ${res.status}`;
      }
    } else if (type === "sms_confirmation") {
      if (!customerPhone) {
        return new Response(JSON.stringify({ error: "No customer phone on file" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      recipient = customerPhone;

      const formattedDate = new Date(booking.scheduled_date).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });

      const smsBody = `✅ AV Detailing Confirmed!\n\n📅 ${formattedDate} at ${booking.scheduled_time}\n📍 ${booking.service_address || ""}, ${booking.service_city || ""}\n🚗 ${serviceName}\n💰 $${(booking.total_price || 0).toFixed(2)}\n\nWe'll text you 24hrs before. Reply HELP for support or call ${publicPhone}.\n\n-AV Detailing Team`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
      const formData = new URLSearchParams();
      formData.append("To", formatPhoneNumber(customerPhone));
      formData.append("From", smsSenderPhone);
      formData.append("Body", smsBody);

      const res = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (res.ok) {
        success = true;
      } else {
        const errData = await res.json().catch(() => ({}));
        errorMessage = errData.message || `HTTP ${res.status}`;
      }
    } else if (type === "admin_notification") {
      recipient = "aaronvasquez100@gmail.com";

      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "Email service not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const formattedDate = new Date(booking.scheduled_date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "AV Detailing <notifications@avdetailing.net>",
          to: [recipient],
          subject: `New Booking 🚗 ${customerName} — ${serviceName} on ${new Date(booking.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #111; color: #fff; border-radius: 12px;">
              <h2 style="color: #ef4444;">New Booking Alert 🚗</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #999;">Customer</td><td style="padding: 8px 0; font-weight: bold;">${customerName}</td></tr>
                ${customerPhone ? `<tr><td style="padding: 8px 0; color: #999;">Phone</td><td style="padding: 8px 0;"><a href="tel:${customerPhone}" style="color: #ef4444;">${customerPhone}</a></td></tr>` : ""}
                ${customerEmail ? `<tr><td style="padding: 8px 0; color: #999;">Email</td><td style="padding: 8px 0;"><a href="mailto:${customerEmail}" style="color: #ef4444;">${customerEmail}</a></td></tr>` : ""}
                <tr><td style="padding: 8px 0; color: #999;">Service</td><td style="padding: 8px 0;">${serviceName}</td></tr>
                <tr><td style="padding: 8px 0; color: #999;">Vehicle</td><td style="padding: 8px 0;">${[booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || "N/A"}</td></tr>
                <tr><td style="padding: 8px 0; color: #999;">Date & Time</td><td style="padding: 8px 0;">${formattedDate} at ${booking.scheduled_time}</td></tr>
                <tr><td style="padding: 8px 0; color: #999;">Address</td><td style="padding: 8px 0;">${booking.service_address || ""}, ${booking.service_city || ""}</td></tr>
                <tr><td style="padding: 8px 0; color: #999;">Total</td><td style="padding: 8px 0; font-weight: bold; color: #22c55e;">$${(booking.total_price || 0).toFixed(2)}</td></tr>
                <tr><td style="padding: 8px 0; color: #999;">Payment</td><td style="padding: 8px 0;">${(booking.payment_method || "in_person").replace("_", " ")} — ${booking.payment_status || "unpaid"}</td></tr>
              </table>
            </div>
          `,
        }),
      });

      if (emailRes.ok) {
        success = true;
      } else {
        const errData = await emailRes.json().catch(() => ({}));
        errorMessage = errData.message || `HTTP ${emailRes.status}`;
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the notification
    await supabase.from("booking_notification_log").insert({
      booking_id: bookingId,
      notification_type: type,
      recipient,
      status: success ? "sent" : "failed",
      error_message: errorMessage || null,
    });

    return new Response(
      JSON.stringify({ success, error: errorMessage }),
      {
        status: success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Resend notification error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
