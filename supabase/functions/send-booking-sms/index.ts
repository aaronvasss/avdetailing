import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER")!;

// Business phone for notifications
const BUSINESS_PHONES = ["+13373446968"]; // Add more numbers if needed

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingSmsRequest {
  customerPhone: string;
  customerName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  totalPrice: number;
  bookingId: string;
  notifyBusiness?: boolean;
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

// Validate phone number
function isValidPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return /^\+1\d{10}$/.test(formatted);
}

// Format date for display
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
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
    const body: BookingSmsRequest = await req.json();
    
    // Validate required fields
    if (!body.customerPhone || !body.customerName || !body.scheduledDate || !body.scheduledTime) {
      return new Response(
        JSON.stringify({ error: "Missing required booking fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidPhone(body.customerPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid customer phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedDate = formatDate(body.scheduledDate);
    const results: { customer?: any; business?: any[] } = {};

    // Customer confirmation SMS
    const customerMessage = `✅ AV Detailing Confirmed!

📅 ${formattedDate} at ${body.scheduledTime}
📍 ${body.serviceAddress}, ${body.serviceCity}
🚗 ${body.serviceName}
💰 $${body.totalPrice.toFixed(2)}

We'll text you 24hrs before. Reply HELP for support or call (337) 344-6968.

-AV Detailing Team`;

    const customerResult = await sendTwilioSms(body.customerPhone, customerMessage);
    results.customer = customerResult;

    // Business notification SMS (optional)
    if (body.notifyBusiness !== false) {
      const businessMessage = `📥 NEW BOOKING

${body.customerName}
📞 ${body.customerPhone}
📅 ${formattedDate} at ${body.scheduledTime}
📍 ${body.serviceCity}
🚗 ${body.serviceName}
💰 $${body.totalPrice.toFixed(2)}

ID: ${body.bookingId.slice(0, 8)}`;

      results.business = [];
      for (const phone of BUSINESS_PHONES) {
        const bizResult = await sendTwilioSms(phone, businessMessage);
        results.business.push(bizResult);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: customerResult.success, 
        results,
        message: customerResult.success 
          ? "Booking confirmation SMS sent" 
          : "Failed to send SMS"
      }),
      { 
        status: customerResult.success ? 200 : 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
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
