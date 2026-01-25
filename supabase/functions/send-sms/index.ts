import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER")!;

// Business phone for notifications
const BUSINESS_PHONE = "+12255216264";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  to: string;
  message: string;
  type?: "booking_confirmation" | "reminder" | "custom";
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
  if (digits.startsWith("+")) {
    return digits;
  }
  return `+${digits}`;
}

// Validate phone number
function isValidPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return /^\+1\d{10}$/.test(formatted);
}

// Send SMS via Twilio
async function sendTwilioSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const formData = new URLSearchParams();
  formData.append("To", formatPhoneNumber(to));
  formData.append("From", TWILIO_PHONE_NUMBER);
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SendSmsRequest = await req.json();
    
    if (!body.to || !body.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidPhone(body.to)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendTwilioSms(body.to, body.message);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
