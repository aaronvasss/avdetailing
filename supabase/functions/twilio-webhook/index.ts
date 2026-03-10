import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Default settings (will be overridden by DB)
const DEFAULT_BUSINESS_PHONE = "+12255216264"; // For forwarding messages
const DEFAULT_SMS_SENDER = "+12252284796"; // Twilio number
const DEFAULT_PUBLIC_PHONE = "(225) 521-6264"; // Displayed in messages

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetch business settings from database
async function getBusinessSettings(supabase: any): Promise<{ smsSenderPhone: string; publicPhone: string }> {
  try {
    const { data } = await supabase
      .from("business_settings")
      .select("key, value")
      .in("key", ["sms_sender_phone", "public_business_phone"]);

    const settings = (data || []).reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return {
      smsSenderPhone: settings.sms_sender_phone || DEFAULT_SMS_SENDER,
      publicPhone: settings.public_business_phone || DEFAULT_PUBLIC_PHONE,
    };
  } catch (error) {
    console.error("Error fetching business settings:", error);
    return { smsSenderPhone: DEFAULT_SMS_SENDER, publicPhone: DEFAULT_PUBLIC_PHONE };
  }
}

// Format phone number to E.164
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

// Send SMS via Twilio
async function sendTwilioSms(to: string, body: string, fromNumber: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const formData = new URLSearchParams();
  formData.append("To", formatPhoneNumber(to));
  formData.append("From", fromNumber);
  formData.append("Body", body);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Twilio error:", data);
      return { success: false, error: data.message || "Failed to send SMS" };
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: String(error) };
  }
}

// Validate Twilio request signature
function validateTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  // Build the data string: URL + sorted params
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }
  const computed = createHmac("sha1", TWILIO_AUTH_TOKEN).update(data).digest("base64");
  // Constant-time comparison
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// Handle incoming SMS (webhook from Twilio)
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Validate Twilio signature before processing
    const twilioSignature = req.headers.get("X-Twilio-Signature");
    if (!twilioSignature) {
      console.error("Missing Twilio signature header");
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const webhookUrl = req.url;
    if (!validateTwilioSignature(webhookUrl, params, twilioSignature)) {
      console.error("Invalid Twilio signature");
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const from = params["From"] || "";
    const body = params["Body"] || "";
    const messageSid = params["MessageSid"] || "";
    const toNumber = params["To"] || "";

    console.log(`Incoming SMS from ${from}: ${body}`);

    // Fetch business settings
    const { smsSenderPhone, publicPhone } = await getBusinessSettings(supabase);

    // Store incoming message in database
    await supabase.from("sms_messages").insert({
      from_number: from,
      to_number: toNumber || smsSenderPhone,
      body: body,
      message_sid: messageSid,
      direction: "inbound",
      status: "received",
    });

    // Handle special commands
    const lowerBody = body.toLowerCase().trim();
    
    if (lowerBody === "stop" || lowerBody === "unsubscribe") {
      console.log(`User ${from} requested to unsubscribe`);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    if (lowerBody === "help") {
      const helpMessage = `AV Detailing Help:
      
📞 Call: ${publicPhone}
📧 Email: aaronvasquez100@gmail.com
🌐 Book: avdetailing.net

Reply STOP to unsubscribe.`;

      const result = await sendTwilioSms(from, helpMessage, smsSenderPhone);
      
      // Store outbound message
      await supabase.from("sms_messages").insert({
        from_number: smsSenderPhone,
        to_number: from,
        body: helpMessage,
        message_sid: result.sid || null,
        direction: "outbound",
        status: result.success ? "sent" : "failed",
      });
      
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Forward all other messages to business owner
    const forwardMessage = `📱 SMS from ${from}:\n\n"${body}"\n\nReply to this customer at: ${from}`;
    await sendTwilioSms(DEFAULT_BUSINESS_PHONE, forwardMessage, smsSenderPhone);

    // Auto-reply to customer
    const autoReply = `Thanks for texting AV Detailing! We received your message and will respond shortly.\n\n📞 For urgent matters, call ${publicPhone}.`;
    const autoResult = await sendTwilioSms(from, autoReply, smsSenderPhone);

    // Store auto-reply
    await supabase.from("sms_messages").insert({
      from_number: smsSenderPhone,
      to_number: from,
      body: autoReply,
      message_sid: autoResult.sid || null,
      direction: "outbound",
      status: autoResult.success ? "sent" : "failed",
    });

    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  }
};

serve(handler);
