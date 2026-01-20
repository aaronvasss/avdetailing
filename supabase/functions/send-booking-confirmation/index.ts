import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Business email recipients
const BUSINESS_EMAILS = ["aaronvasquez100@gmail.com", "aaronvasquez@avdetailingg.com"];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10;

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

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

// Get client identifier for rate limiting
function getClientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  return cfIp || realIp || forwarded?.split(",")[0]?.trim() || "unknown";
}

// Check rate limit
function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(clientId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
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
    // Server-side rate limiting
    const clientId = getClientId(req);
    const rateCheck = checkRateLimit(clientId);
    
    if (!rateCheck.allowed) {
      console.log(`Rate limited: ${clientId}`);
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "3600",
            ...corsHeaders 
          } 
        }
      );
    }

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
        <title>Booking Confirmation - AV Detailing</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto; padding: 48px 24px;">
          
          <!-- Header with Logo -->
          <div style="text-align: center; margin-bottom: 48px;">
            <div style="display: inline-block; padding: 16px 32px; border: 2px solid #ef4444; border-radius: 4px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: 2px;">
                <span style="color: #ffffff;">AV</span><span style="color: #ef4444;"> DETAILING</span>
              </h1>
            </div>
            <p style="color: #737373; font-size: 13px; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 3px;">
              Premium Mobile Detailing
            </p>
          </div>
          
          <!-- Main Card -->
          <div style="background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 16px; overflow: hidden; border: 1px solid #262626; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            
            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 24px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 48px; height: 48px; line-height: 48px; margin-bottom: 12px;">
                <span style="font-size: 24px;">✓</span>
              </div>
              <h2 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">
                Booking Confirmed!
              </h2>
            </div>
            
            <!-- Greeting -->
            <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #262626;">
              <h3 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 600;">
                Thank you, ${safeCustomerName}!
              </h3>
              <p style="color: #a3a3a3; margin: 0; font-size: 15px; line-height: 1.5;">
                Your premium mobile detailing service is confirmed. We're excited to make your vehicle shine!
              </p>
            </div>
            
            <!-- Appointment Details -->
            <div style="padding: 32px;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: 600;">
                📅 Appointment Details
              </h4>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #262626;">
                    <span style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">${safeServiceName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #262626;">
                    <span style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span>
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">
                      ${formattedDate}<br>
                      <span style="color: #ef4444;">${safeScheduledTime}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #262626;">
                    <span style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service Location</span>
                    <p style="color: #ffffff; font-size: 16px; margin: 4px 0 0 0;">
                      ${safeServiceAddress}<br>
                      ${safeServiceCity}, LA
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #262626;">
                    <span style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Vehicle</span>
                    <p style="color: #ffffff; font-size: 16px; margin: 4px 0 0 0;">${safeVehicleInfo}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0 0 0;">
                    <span style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Total Investment</span>
                    <p style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 4px 0 0 0;">$${totalPrice.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- What to Expect -->
            <div style="background-color: #0a0a0a; padding: 32px; margin: 0 16px 16px 16px; border-radius: 12px;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; font-weight: 600;">
                🚗 What to Expect
              </h4>
              <ul style="color: #d4d4d4; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Our technician will arrive at your location on time with all equipment</li>
                <li>Service typically takes 2-4 hours depending on package</li>
                <li>We'll send you a text when we're on our way</li>
                <li>Payment is collected upon service completion</li>
              </ul>
            </div>
            
            <!-- Preparation Tips -->
            <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%); padding: 24px 32px; margin: 0 16px 16px 16px; border-radius: 12px; border: 1px solid rgba(239,68,68,0.2);">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; font-weight: 600;">
                📋 Before We Arrive
              </h4>
              <ul style="color: #d4d4d4; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong style="color: #ffffff;">Clear the vehicle</strong> – Remove personal items and valuables</li>
                <li><strong style="color: #ffffff;">Water access</strong> – Ensure we can connect to an outdoor spigot</li>
                <li><strong style="color: #ffffff;">Power outlet</strong> – Within 50ft of the vehicle if possible</li>
                <li><strong style="color: #ffffff;">Parking space</strong> – Keep the area clear for our equipment setup</li>
              </ul>
            </div>
            
            <!-- CTA Section -->
            <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #262626;">
              <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 16px 0;">
                Need to reschedule or have questions?
              </p>
              <a href="tel:+12252268979" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                📞 Call (225) 226-8979
              </a>
              <p style="color: #525252; font-size: 12px; margin: 16px 0 0 0;">
                or text us anytime
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #262626;">
            <p style="color: #525252; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
              Confirmation #${safeBookingId}
            </p>
            <p style="color: #404040; font-size: 12px; margin: 0;">
              AV Detailing • Baton Rouge & Surrounding Areas
            </p>
            <div style="margin-top: 20px;">
              <a href="https://avdetailing.net" style="color: #ef4444; text-decoration: none; font-size: 12px;">www.avdetailing.net</a>
            </div>
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
