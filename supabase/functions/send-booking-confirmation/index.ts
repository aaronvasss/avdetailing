import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Business email recipients - stored here for security
const BUSINESS_EMAILS = ["aaronvasquez100@gmail.com", "aaronvasquez@avdetailingg.com"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  vehicleInfo: string;
  totalPrice: number;
  bookingId: string;
}

// HTML encode to prevent XSS in emails
function htmlEncode(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validate booking confirmation input
function validateInput(data: BookingConfirmationRequest): { valid: boolean; error?: string } {
  if (!data.customerEmail || !isValidEmail(data.customerEmail)) {
    return { valid: false, error: "Invalid customer email" };
  }
  if (!data.customerName || data.customerName.length > 100) {
    return { valid: false, error: "Invalid customer name" };
  }
  if (!data.serviceName || data.serviceName.length > 200) {
    return { valid: false, error: "Invalid service name" };
  }
  if (!data.scheduledDate) {
    return { valid: false, error: "Invalid scheduled date" };
  }
  if (!data.scheduledTime || data.scheduledTime.length > 20) {
    return { valid: false, error: "Invalid scheduled time" };
  }
  if (!data.serviceAddress || data.serviceAddress.length > 300) {
    return { valid: false, error: "Invalid service address" };
  }
  if (!data.serviceCity || data.serviceCity.length > 100) {
    return { valid: false, error: "Invalid service city" };
  }
  if (data.vehicleInfo && data.vehicleInfo.length > 200) {
    return { valid: false, error: "Invalid vehicle info" };
  }
  if (typeof data.totalPrice !== "number" || data.totalPrice < 0 || data.totalPrice > 100000) {
    return { valid: false, error: "Invalid total price" };
  }
  if (!data.bookingId || data.bookingId.length > 50) {
    return { valid: false, error: "Invalid booking ID" };
  }
  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawData = await req.json();
    const validation = validateInput(rawData);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      customerEmail,
      customerName,
      serviceName,
      scheduledDate,
      scheduledTime,
      serviceAddress,
      serviceCity,
      vehicleInfo,
      totalPrice,
      bookingId,
    }: BookingConfirmationRequest = rawData;

    // HTML encode all user inputs to prevent XSS in emails
    const safeCustomerName = htmlEncode(customerName.trim());
    const safeServiceName = htmlEncode(serviceName.trim());
    const safeScheduledTime = htmlEncode(scheduledTime.trim());
    const safeServiceAddress = htmlEncode(serviceAddress.trim());
    const safeServiceCity = htmlEncode(serviceCity.trim());
    const safeVehicleInfo = vehicleInfo ? htmlEncode(vehicleInfo.trim()) : "Not specified";
    const safeBookingId = htmlEncode(bookingId);

    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">
              <span style="color: #ffffff;">AV</span>
              <span style="color: #ef4444;"> DETAILING</span>
            </h1>
          </div>
          
          <div style="background-color: #171717; border-radius: 12px; padding: 32px; border: 1px solid #262626;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                ✓ Booking Confirmed
              </span>
            </div>
            
            <h2 style="color: #ffffff; font-size: 24px; text-align: center; margin: 0 0 8px 0;">
              Thank you, ${safeCustomerName}!
            </h2>
            <p style="color: #a3a3a3; text-align: center; margin: 0 0 32px 0;">
              Your mobile detail has been scheduled.
            </p>
            
            <div style="background-color: #0a0a0a; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #ef4444; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
                Appointment Details
              </h3>
              
              <div style="margin-bottom: 16px;">
                <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 4px 0;">SERVICE</p>
                <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${safeServiceName}</p>
              </div>
              
              <div style="margin-bottom: 16px;">
                <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 4px 0;">DATE & TIME</p>
                <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${formattedDate} at ${safeScheduledTime}</p>
              </div>
              
              <div style="margin-bottom: 16px;">
                <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 4px 0;">LOCATION</p>
                <p style="color: #ffffff; font-size: 16px; margin: 0;">${safeServiceAddress}<br>${safeServiceCity}, LA</p>
              </div>
              
              <div style="margin-bottom: 16px;">
                <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 4px 0;">VEHICLE</p>
                <p style="color: #ffffff; font-size: 16px; margin: 0;">${safeVehicleInfo}</p>
              </div>
              
              <div style="border-top: 1px solid #262626; padding-top: 16px; margin-top: 16px;">
                <p style="color: #a3a3a3; font-size: 12px; margin: 0 0 4px 0;">TOTAL</p>
                <p style="color: #ef4444; font-size: 24px; font-weight: 700; margin: 0;">$${totalPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                📋 Preparation Tips
              </h3>
              <ul style="color: #a3a3a3; font-size: 14px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Remove personal items from your vehicle</li>
                <li style="margin-bottom: 8px;">Ensure we have access to a water source and electrical outlet</li>
                <li style="margin-bottom: 8px;">Clear parking area for our equipment</li>
                <li>Let us know about any specific concerns or areas to focus on</li>
              </ul>
            </div>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #262626;">
              <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 8px 0;">
                Questions? Contact us:
              </p>
              <p style="margin: 0;">
                <a href="tel:+12255551234" style="color: #ef4444; text-decoration: none; font-weight: 600;">(225) 555-1234</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #525252; font-size: 12px; margin: 0;">
              Booking ID: ${safeBookingId}
            </p>
            <p style="color: #525252; font-size: 12px; margin: 8px 0 0 0;">
              AV Detailing • Baton Rouge, LA • Premium Mobile Detailing
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AV Detailing <noreply@avdetailing.net>",
        to: [customerEmail.trim()],
        cc: BUSINESS_EMAILS,
        subject: `Booking Confirmed - ${safeServiceName} on ${formattedDate}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Booking confirmation email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking confirmation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
