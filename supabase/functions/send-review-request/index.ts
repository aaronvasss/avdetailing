import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_SMS_SENDER = "+12252284796";
const GOOGLE_REVIEW_URL = "https://g.page/r/CYyQqJOk3f1hEBM/review";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REVIEW-REQUEST] ${step}${detailsStr}`);
};

interface ReviewRequestBody {
  booking_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

async function getBusinessSettings(supabase: any) {
  try {
    const { data } = await supabase
      .from("business_settings")
      .select("key, value")
      .in("key", ["sms_sender_phone", "auto_review_request_enabled"]);

    const settings = (data || []).reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return {
      smsSenderPhone: settings.sms_sender_phone || DEFAULT_SMS_SENDER,
      autoReviewEnabled: settings.auto_review_request_enabled !== "false",
    };
  } catch {
    return { smsSenderPhone: DEFAULT_SMS_SENDER, autoReviewEnabled: true };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Service-role-only: this function may only be invoked server-to-server (e.g. from stripe-webhook or cron)
  const authHeader = req.headers.get("Authorization") ?? "";
  const authToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (authToken !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    logStep("Function started");

    const body: ReviewRequestBody = await req.json();
    logStep("Request body", { booking_id: body.booking_id });

    if (!body.booking_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.booking_id)) {
      return new Response(JSON.stringify({ error: "Invalid booking_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up customer contact info from the booking — do NOT trust caller-supplied values
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("guest_name, guest_email, guest_phone, user_id")
      .eq("id", body.booking_id)
      .maybeSingle();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerEmail: string | null = booking.guest_email || null;
    let customerPhone: string | null = booking.guest_phone || null;
    let customerName: string = booking.guest_name || "";

    if (booking.user_id && (!customerEmail || !customerPhone || !customerName)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, phone, full_name")
        .eq("user_id", booking.user_id)
        .maybeSingle();
      if (profile) {
        customerEmail = customerEmail || profile.email || null;
        customerPhone = customerPhone || profile.phone || null;
        customerName = customerName || profile.full_name || "";
      }
    }

    const { smsSenderPhone, autoReviewEnabled } = await getBusinessSettings(supabase);

    if (!autoReviewEnabled) {
      logStep("Auto review requests disabled");
      return new Response(JSON.stringify({ success: false, message: "Auto review requests are disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = (customerName || "Customer").split(" ")[0];
    const reviewMessage = `Hi ${firstName}! 🚗✨ Thank you for choosing AV Detailing! We hope your vehicle is looking amazing. We'd love it if you could take 30 seconds to leave us a Google review — it helps us grow! ${GOOGLE_REVIEW_URL} Thank you! — AV Detailing Team`;

    const results: { sms?: any; email?: any } = {};

    // Send SMS
    if (customerPhone) {
      const formatted = formatPhoneNumber(customerPhone);
      if (/^\+1\d{10}$/.test(formatted)) {
        logStep("Sending review SMS", { to: formatted });
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const formData = new URLSearchParams();
        formData.append("To", formatted);
        formData.append("From", smsSenderPhone);
        formData.append("Body", reviewMessage);

        try {
          const smsRes = await fetch(url, {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
          });
          const smsData = await smsRes.json();
          results.sms = { success: smsRes.ok, sid: smsData.sid };
          logStep("SMS result", results.sms);
        } catch (err) {
          results.sms = { success: false, error: String(err) };
          logStep("SMS error", results.sms);
        }
      } else {
        logStep("Invalid phone number", { phone: customerPhone });
      }
    }

    // Send Email
    if (customerEmail && RESEND_API_KEY) {
      logStep("Sending review email", { to: customerEmail });
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "AV Detailing <noreply@avdetailing.net>",
            to: [customerEmail],
            subject: `${firstName}, how did we do? 🚗✨`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a1a;">Hi ${firstName}! 🚗✨</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  Thank you for choosing <strong>AV Detailing</strong>! We hope your vehicle is looking amazing.
                </p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  We'd love it if you could take 30 seconds to leave us a Google review — it really helps us grow!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${GOOGLE_REVIEW_URL}" 
                     style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 32px; 
                            text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                    ⭐ Leave a Review
                  </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                  Thank you!<br/>— AV Detailing Team
                </p>
              </div>
            `,
          }),
        });
        const emailData = await emailRes.json();
        results.email = { success: emailRes.ok, id: emailData.id };
        logStep("Email result", results.email);
      } catch (err) {
        results.email = { success: false, error: String(err) };
        logStep("Email error", results.email);
      }
    }

    // Log the review request in sms_messages for tracking
    if (results.sms?.success && customerPhone) {
      await supabase.from("sms_messages").insert({
        booking_id: body.booking_id,
        direction: "outbound",
        from_number: smsSenderPhone,
        to_number: formatPhoneNumber(customerPhone),
        body: reviewMessage,
        message_sid: results.sms.sid || null,
        status: "sent",
      });
    }

    logStep("Review request completed", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Failed to send review request" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
