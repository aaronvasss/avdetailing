import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_SMS_SENDER = "+12252284796";
const SENDER_DOMAIN = "notify.avdetailing.net";
const FROM_DOMAIN = "avdetailing.net";
const GOOGLE_REVIEW_URL = "https://g.page/r/CYyQqJOk3f1hEBM/review";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
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

async function enqueueEmail(supabase: any, to: string, from: string, subject: string, html: string, label: string) {
  const messageId = crypto.randomUUID();

  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: label,
    recipient_email: to,
    status: "pending",
  });

  const { error } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      run_id: crypto.randomUUID(),
      message_id: messageId,
      to,
      from,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: "",
      purpose: "transactional",
      label,
      queued_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.error(`Failed to enqueue ${label}`, error);
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: label,
      recipient_email: to,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    return { ok: false, error: String(error) };
  }

  return { ok: true, messageId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");

    const body: ReviewRequestBody = await req.json();
    logStep("Request body", { booking_id: body.booking_id, name: body.customer_name });

    if (!body.booking_id || !body.customer_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { smsSenderPhone, autoReviewEnabled } = await getBusinessSettings(supabase);

    if (!autoReviewEnabled) {
      logStep("Auto review requests disabled");
      return new Response(JSON.stringify({ success: false, message: "Auto review requests are disabled" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = body.customer_name.split(" ")[0];
    const reviewMessage = `Hi ${firstName}! 🚗✨ Thank you for choosing AV Detailing! We hope your vehicle is looking amazing. We'd love it if you could take 30 seconds to leave us a Google review — it helps us grow! ${GOOGLE_REVIEW_URL} Thank you! — AV Detailing Team`;

    const results: { sms?: any; email?: any } = {};

    // Send SMS (still via Twilio - SMS is not part of email migration)
    if (body.customer_phone) {
      const formatted = formatPhoneNumber(body.customer_phone);
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
        logStep("Invalid phone number", { phone: body.customer_phone });
      }
    }

    // Send Email via queue (migrated from Resend)
    if (body.customer_email) {
      logStep("Enqueuing review email", { to: body.customer_email });

      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a1a1a;">Hi ${firstName}! 🚗✨</h2>
          <p style="font-size:16px;color:#333;line-height:1.6;">
            Thank you for choosing <strong>AV Detailing</strong>! We hope your vehicle is looking amazing.
          </p>
          <p style="font-size:16px;color:#333;line-height:1.6;">
            We'd love it if you could take 30 seconds to leave us a Google review — it really helps us grow!
          </p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${GOOGLE_REVIEW_URL}" 
               style="display:inline-block;background-color:#dc2626;color:white;padding:14px 32px;
                      text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">
              ⭐ Leave a Review
            </a>
          </div>
          <p style="font-size:14px;color:#666;">
            Thank you!<br/>— AV Detailing Team
          </p>
        </div>`;

      const emailResult = await enqueueEmail(
        supabase, body.customer_email,
        `AV Detailing <noreply@${FROM_DOMAIN}>`,
        `${firstName}, how did we do? 🚗✨`,
        emailHtml, "review_request"
      );

      results.email = { success: emailResult.ok, messageId: emailResult.messageId };
      logStep("Email enqueue result", results.email);
    }

    // Log SMS in sms_messages for tracking
    if (results.sms?.success && body.customer_phone) {
      await supabase.from("sms_messages").insert({
        booking_id: body.booking_id,
        direction: "outbound",
        from_number: smsSenderPhone,
        to_number: formatPhoneNumber(body.customer_phone),
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
