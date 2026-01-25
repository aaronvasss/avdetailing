import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const BUSINESS_PHONES = ["+12255216264"];
const BUSINESS_EMAILS = ["aaronvasquez100@gmail.com", "aaronvasquez@avdetailingg.com"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageBookingRequest {
  token: string;
  action: "get" | "reschedule" | "cancel";
  newDate?: string;
  newTime?: string;
  reason?: string;
}

// Format phone number to E.164
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

// Format date for display
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Format time for display
function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(":");
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// Send SMS via Twilio
async function sendTwilioSms(to: string, body: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log("Twilio not configured, skipping SMS");
    return;
  }
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const formData = new URLSearchParams();
  formData.append("To", formatPhoneNumber(to));
  formData.append("From", TWILIO_PHONE_NUMBER);
  formData.append("Body", body);

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

// Send email via Resend
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log("Resend not configured, skipping email");
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AV Detailing <noreply@avdetailing.net>",
        to: [to],
        cc: BUSINESS_EMAILS,
        subject,
        html,
      }),
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ManageBookingRequest = await req.json();
    const { token, action, newDate, newTime, reason } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS for token-based access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find booking by token
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        *,
        services (name, slug),
        booking_add_ons (name, price)
      `)
      .eq("manage_token", token)
      .single();

    if (fetchError || !booking) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if booking is already cancelled or completed
    if (booking.status === "cancelled" || booking.status === "completed") {
      return new Response(
        JSON.stringify({ error: `This booking has already been ${booking.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET action - return booking details
    if (action === "get") {
      return new Response(
        JSON.stringify({
          booking: {
            id: booking.id,
            scheduledDate: booking.scheduled_date,
            scheduledTime: booking.scheduled_time,
            serviceName: booking.services?.name || "Detailing Service",
            serviceAddress: booking.service_address,
            serviceCity: booking.service_city,
            serviceState: booking.service_state,
            serviceZip: booking.service_zip,
            vehicleInfo: `${booking.vehicle_year || ""} ${booking.vehicle_make || ""} ${booking.vehicle_model || ""}`.trim() || booking.vehicle_type,
            vehicleType: booking.vehicle_type,
            totalPrice: booking.total_price,
            subtotal: booking.subtotal,
            addOnsTotal: booking.add_ons_total,
            status: booking.status,
            customerName: booking.guest_name,
            customerEmail: booking.guest_email,
            customerPhone: booking.guest_phone,
            addOns: booking.booking_add_ons || [],
            durationMinutes: booking.duration_minutes,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RESCHEDULE action
    if (action === "reschedule") {
      if (!newDate || !newTime) {
        return new Response(
          JSON.stringify({ error: "Missing new date or time" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const oldDate = formatDate(booking.scheduled_date);
      const oldTime = formatTime(booking.scheduled_time);

      // Update the booking
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          status: "pending",
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to reschedule booking" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newFormattedDate = formatDate(newDate);
      const newFormattedTime = formatTime(newTime);
      const customerName = booking.guest_name || "Valued Customer";
      const serviceName = booking.services?.name || "Detailing Service";

      // Send confirmation SMS to customer
      const customerPhone = booking.guest_phone;
      if (customerPhone) {
        const smsMessage = `✅ AV Detailing - Rescheduled!

Your ${serviceName} has been moved to:
📅 ${newFormattedDate}
🕐 ${newFormattedTime}

Questions? Call (225) 521-6264`;
        await sendTwilioSms(customerPhone, smsMessage);
      }

      // Notify business
      for (const phone of BUSINESS_PHONES) {
        await sendTwilioSms(phone, `📅 RESCHEDULED: ${customerName}\n${oldDate} → ${newFormattedDate}\n${oldTime} → ${newFormattedTime}\nService: ${serviceName}`);
      }

      // Send confirmation email
      const customerEmail = booking.guest_email;
      if (customerEmail) {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ef4444; margin: 0;">AV DETAILING 🚗</h1>
              <p style="color: #888; margin-top: 8px;">Appointment Rescheduled</p>
            </div>
            <div style="background: #16a34a; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px;">✓</span>
              <span style="font-size: 18px; font-weight: bold; margin-left: 8px;">Successfully Rescheduled</span>
            </div>
            <p style="color: #ccc;">Hi ${customerName},</p>
            <p style="color: #ccc;">Your appointment has been rescheduled:</p>
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px; color: #888;">Previous:</p>
              <p style="margin: 0 0 16px; color: #888; text-decoration: line-through;">${oldDate} at ${oldTime}</p>
              <p style="margin: 0 0 8px; color: #888;">New Date & Time:</p>
              <p style="margin: 0; color: #ef4444; font-size: 20px; font-weight: bold;">${newFormattedDate}</p>
              <p style="margin: 0; color: #fff; font-size: 18px;">${newFormattedTime}</p>
            </div>
            <p style="color: #888; font-size: 14px;">Questions? Call us at (225) 521-6264</p>
          </div>
        `;
        await sendEmail(customerEmail, `✅ Appointment Rescheduled - ${serviceName}`, emailHtml);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking rescheduled successfully",
          newDate: newFormattedDate,
          newTime: newFormattedTime,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CANCEL action
    if (action === "cancel") {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          internal_notes: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer via manage link",
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error("Error cancelling booking:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to cancel booking" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const customerName = booking.guest_name || "Valued Customer";
      const serviceName = booking.services?.name || "Detailing Service";
      const scheduledDate = formatDate(booking.scheduled_date);
      const scheduledTime = formatTime(booking.scheduled_time);

      // Send confirmation SMS to customer
      const customerPhone = booking.guest_phone;
      if (customerPhone) {
        const smsMessage = `❌ AV Detailing - Booking Cancelled

Your ${serviceName} on ${scheduledDate} has been cancelled.

Need to rebook? Visit avdetailing.net/book or call (225) 521-6264`;
        await sendTwilioSms(customerPhone, smsMessage);
      }

      // Notify business
      for (const phone of BUSINESS_PHONES) {
        await sendTwilioSms(phone, `❌ CANCELLED: ${customerName}\n📅 ${scheduledDate} at ${scheduledTime}\nService: ${serviceName}${reason ? `\nReason: ${reason}` : ""}`);
      }

      // Send confirmation email
      const customerEmail = booking.guest_email;
      if (customerEmail) {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ef4444; margin: 0;">AV DETAILING 🚗</h1>
              <p style="color: #888; margin-top: 8px;">Booking Cancelled</p>
            </div>
            <div style="background: #525252; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 18px; font-weight: bold;">Booking Cancelled</span>
            </div>
            <p style="color: #ccc;">Hi ${customerName},</p>
            <p style="color: #ccc;">Your appointment has been cancelled:</p>
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px; color: #888;">Service:</p>
              <p style="margin: 0 0 16px; color: #fff;">${serviceName}</p>
              <p style="margin: 0 0 8px; color: #888;">Was scheduled for:</p>
              <p style="margin: 0; color: #888; text-decoration: line-through;">${scheduledDate} at ${scheduledTime}</p>
            </div>
            <p style="color: #ccc;">We hope to see you again soon!</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://avdetailing.net/book" style="display: inline-block; background: #ef4444; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Book Another Appointment</a>
            </div>
            <p style="color: #888; font-size: 14px; margin-top: 24px;">Questions? Call us at (225) 521-6264</p>
          </div>
        `;
        await sendEmail(customerEmail, `Booking Cancelled - ${serviceName}`, emailHtml);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking cancelled successfully",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
