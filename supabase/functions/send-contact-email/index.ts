import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SENDER_DOMAIN = "notify.avdetailing.net";
const FROM_DOMAIN = "avdetailing.net";
const BUSINESS_EMAILS = ["aaronvasquez100@gmail.com", "aaronvasquez@avdetailingg.com"];

const RATE_LIMIT_WINDOW_MS = 300000;
const MAX_REQUESTS_PER_WINDOW = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

function getClientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  return cfIp || realIp || forwarded?.split(",")[0]?.trim() || "unknown";
}

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
    }
  }

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return { allowed: false, remaining: 0 };

  entry.count += 1;
  rateLimitMap.set(clientId, entry);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
}

function htmlEncode(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function validateInput(data: ContactEmailRequest): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length < 1 || data.name.length > 100) return { valid: false, error: "Invalid name" };
  if (!data.email || !isValidEmail(data.email)) return { valid: false, error: "Invalid email address" };
  if (data.phone && data.phone.length > 20) return { valid: false, error: "Invalid phone number" };
  if (data.service && data.service.length > 100) return { valid: false, error: "Invalid service selection" };
  if (!data.message || data.message.trim().length < 10 || data.message.length > 2000) return { valid: false, error: "Message must be between 10 and 2000 characters" };
  return { valid: true };
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
    const clientId = getClientId(req);
    const rateCheck = checkRateLimit(clientId);

    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Too many requests. Please try again later." }), {
        status: 429, headers: { "Content-Type": "application/json", "Retry-After": "300", ...corsHeaders },
      });
    }

    const rawData = await req.json();
    const validation = validateInput(rawData);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { name, email, phone, service, message }: ContactEmailRequest = rawData;
    const safeName = htmlEncode(name.trim());
    const safeEmail = htmlEncode(email.trim());
    const safePhone = phone ? htmlEncode(phone.trim()) : null;
    const safeService = service ? htmlEncode(service.trim()) : null;
    const safeMessage = htmlEncode(message.trim());

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Business notification
    const businessHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;">
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      ${safePhone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ""}
      ${safeService ? `<p><strong>Service Interest:</strong> ${safeService}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p>${safeMessage.replace(/\n/g, "<br>")}</p>
    </body></html>`;

    for (const bizEmail of BUSINESS_EMAILS) {
      await enqueueEmail(
        supabase, bizEmail,
        `AV Detailing <notifications@${FROM_DOMAIN}>`,
        `New Contact Form Submission from ${safeName}`,
        businessHtml, "contact_business_alert"
      );
    }

    // Customer confirmation
    const customerHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background-color:#0a0a0a;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="color:#ffffff;font-size:28px;margin:0;">
            <span style="color:#ffffff;">AV</span><span style="color:#ef4444;"> DETAILING</span>
          </h1>
        </div>
        <div style="background-color:#171717;border-radius:12px;padding:32px;border:1px solid #262626;">
          <h2 style="color:#ffffff;font-size:24px;margin:0 0 8px 0;text-align:center;">AV Detailing 🚗</h2>
          <p style="color:#22c55e;font-size:16px;font-weight:600;margin:0 0 16px 0;text-align:center;">We received your message</p>
          <p style="color:#a3a3a3;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
            Hi ${safeName.split(" ")[0]}, thanks for reaching out! We've received your message and will get back to you within 24 hours. If you need immediate assistance, feel free to call us.
          </p>
          <div style="text-align:center;padding:20px 0;border-top:1px solid #262626;">
            <a href="tel:+12255216264" style="display:inline-block;background-color:#ef4444;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">Call (225) 521-6264</a>
          </div>
        </div>
        <div style="text-align:center;margin-top:32px;">
          <p style="color:#525252;font-size:12px;margin:0;">AV Detailing • Baton Rouge, LA • Premium Mobile Detailing</p>
        </div>
      </div>
    </body></html>`;

    await enqueueEmail(
      supabase, email.trim(),
      `AV Detailing <noreply@${FROM_DOMAIN}>`,
      "We received your message!",
      customerHtml, "contact_customer_confirmation"
    );

    console.log("Contact emails enqueued successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending contact email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
