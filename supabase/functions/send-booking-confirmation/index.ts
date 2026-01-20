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

interface BookingAddOn {
  name: string;
  price: number;
}

interface BookingConfirmationRequest {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  serviceState?: string;
  vehicleInfo: string;
  totalPrice: number;
  bookingId: string;
  basePrice?: number;
  addOns?: BookingAddOn[];
  estimatedDuration?: number;
  customerPhone?: string;
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
      serviceState = "LA",
      vehicleInfo,
      totalPrice,
      bookingId,
      basePrice,
      addOns = [],
      estimatedDuration,
      customerPhone,
    }: BookingConfirmationRequest = rawData;

    // HTML encode all user inputs to prevent XSS in emails
    const safeCustomerName = htmlEncode(customerName.trim());
    const safeServiceName = htmlEncode(serviceName.trim());
    const safeScheduledTime = htmlEncode(scheduledTime.trim());
    const safeServiceAddress = htmlEncode(serviceAddress.trim());
    const safeServiceCity = htmlEncode(serviceCity.trim());
    const safeServiceState = htmlEncode(serviceState.trim());
    const safeVehicleInfo = vehicleInfo ? htmlEncode(vehicleInfo.trim()) : "Not specified";
    const safeBookingId = htmlEncode(bookingId);

    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const shortDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    // Generate Google Calendar link
    const startDate = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.match(/(\d+):(\d+)/)?.slice(1) || ["9", "00"];
    const isPM = scheduledTime.toLowerCase().includes('pm');
    let hour = parseInt(hours);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    startDate.setHours(hour, parseInt(minutes), 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + (estimatedDuration ? Math.ceil(estimatedDuration / 60) : 3));
    
    const formatCalendarDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('AV Detailing - ' + serviceName)}&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}&details=${encodeURIComponent('Mobile detailing service at your location. Booking ID: ' + bookingId)}&location=${encodeURIComponent(serviceAddress + ', ' + serviceCity + ', ' + serviceState)}`;

    // Build add-ons HTML if present
    const addOnsHtml = addOns.length > 0 ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #262626;">
          <span style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Add-Ons</span>
          <div style="margin-top: 8px;">
            ${addOns.map(addon => `
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span style="color: #d4d4d4; font-size: 14px;">+ ${htmlEncode(addon.name)}</span>
                <span style="color: #a3a3a3; font-size: 14px;">$${addon.price.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </td>
      </tr>
    ` : '';

    // Build pricing breakdown
    const pricingHtml = basePrice ? `
      <div style="background-color: #0a0a0a; border-radius: 8px; padding: 16px; margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #a3a3a3; font-size: 14px;">Base Service</span>
          <span style="color: #d4d4d4; font-size: 14px;">$${basePrice.toFixed(2)}</span>
        </div>
        ${addOns.map(addon => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #a3a3a3; font-size: 14px;">+ ${htmlEncode(addon.name)}</span>
            <span style="color: #d4d4d4; font-size: 14px;">$${addon.price.toFixed(2)}</span>
          </div>
        `).join('')}
        <div style="border-top: 1px solid #262626; padding-top: 12px; margin-top: 8px; display: flex; justify-content: space-between;">
          <span style="color: #ffffff; font-size: 16px; font-weight: 600;">Total</span>
          <span style="color: #ef4444; font-size: 18px; font-weight: 700;">$${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    ` : '';

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
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; padding: 16px 32px; border: 2px solid #ef4444; border-radius: 4px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: 2px;">
                <span style="color: #ffffff;">AV</span><span style="color: #ef4444;"> DETAILING</span>
              </h1>
            </div>
            <p style="color: #737373; font-size: 13px; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 3px;">
              Premium Mobile Detailing
            </p>
          </div>
          
          <!-- Quick Date Card -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">
              Your Appointment
            </p>
            <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">
              ${shortDate} at ${safeScheduledTime}
            </p>
          </div>
          
          <!-- Main Card -->
          <div style="background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 16px; overflow: hidden; border: 1px solid #262626; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            
            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 20px; text-align: center;">
              <span style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 40px; height: 40px; line-height: 40px; font-size: 20px; margin-right: 12px; vertical-align: middle;">✓</span>
              <span style="color: #ffffff; font-size: 20px; font-weight: 700; vertical-align: middle;">Booking Confirmed!</span>
            </div>
            
            <!-- Greeting -->
            <div style="padding: 28px 32px; text-align: center; border-bottom: 1px solid #262626;">
              <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0; font-weight: 600;">
                Thank you, ${safeCustomerName}! 🎉
              </h3>
              <p style="color: #a3a3a3; margin: 0; font-size: 14px; line-height: 1.5;">
                We're excited to bring our premium mobile detailing to you. Here's everything you need to know.
              </p>
            </div>
            
            <!-- Appointment Details -->
            <div style="padding: 28px 32px;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: 600;">
                📋 Service Details
              </h4>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #0a0a0a; border-radius: 8px 8px 0 0;">
                    <span style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Service Package</span>
                    <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 6px 0 0 0;">${safeServiceName}</p>
                    ${estimatedDuration ? `<p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">Estimated time: ${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60 > 0 ? (estimatedDuration % 60) + 'm' : ''}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; background-color: rgba(10,10,10,0.5);">
                    <span style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span>
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 6px 0 0 0;">
                      ${formattedDate}
                    </p>
                    <p style="color: #ef4444; font-size: 18px; font-weight: 700; margin: 4px 0 0 0;">
                      ${safeScheduledTime}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; background-color: #0a0a0a;">
                    <span style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">📍 Service Location</span>
                    <p style="color: #ffffff; font-size: 15px; margin: 6px 0 0 0;">
                      ${safeServiceAddress}<br>
                      ${safeServiceCity}, ${safeServiceState}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; background-color: rgba(10,10,10,0.5); border-radius: 0 0 8px 8px;">
                    <span style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">🚗 Vehicle</span>
                    <p style="color: #ffffff; font-size: 15px; margin: 6px 0 0 0;">${safeVehicleInfo}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Pricing Summary -->
              <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%); border-radius: 12px; border: 1px solid rgba(239,68,68,0.2);">
                <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; font-weight: 600;">
                  💰 Investment Summary
                </h4>
                ${basePrice ? `
                  <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: table; width: 100%;">
                      <span style="display: table-cell; color: #d4d4d4; font-size: 14px;">${safeServiceName}</span>
                      <span style="display: table-cell; text-align: right; color: #ffffff; font-size: 14px;">$${basePrice.toFixed(2)}</span>
                    </div>
                  </div>
                ` : ''}
                ${addOns.map(addon => `
                  <div style="margin-bottom: 8px;">
                    <div style="display: table; width: 100%;">
                      <span style="display: table-cell; color: #a3a3a3; font-size: 13px;">+ ${htmlEncode(addon.name)}</span>
                      <span style="display: table-cell; text-align: right; color: #d4d4d4; font-size: 13px;">$${addon.price.toFixed(2)}</span>
                    </div>
                  </div>
                `).join('')}
                <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid rgba(239,68,68,0.3);">
                  <div style="display: table; width: 100%;">
                    <span style="display: table-cell; color: #ffffff; font-size: 16px; font-weight: 600;">Total Due</span>
                    <span style="display: table-cell; text-align: right; color: #ef4444; font-size: 28px; font-weight: 800;">$${totalPrice.toFixed(2)}</span>
                  </div>
                  <p style="color: #737373; font-size: 11px; margin: 8px 0 0 0; text-align: right;">
                    Payment collected upon completion
                  </p>
                </div>
              </div>
              
              <!-- Add to Calendar -->
              <div style="margin-top: 20px; text-align: center;">
                <a href="${calendarUrl}" target="_blank" style="display: inline-block; background-color: #262626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; border: 1px solid #404040;">
                  📅 Add to Google Calendar
                </a>
              </div>
            </div>
            
            <!-- What to Expect Timeline -->
            <div style="padding: 28px 32px; background-color: #0a0a0a;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: 600;">
                🚗 What Happens Next
              </h4>
              <div style="position: relative; padding-left: 24px; border-left: 2px solid #262626;">
                <div style="margin-bottom: 20px;">
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #ef4444; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">Day Before</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">We'll send you a reminder text</p>
                </div>
                <div style="margin-bottom: 20px;">
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #ef4444; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">On Your Way</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Text notification when we're headed your way</p>
                </div>
                <div style="margin-bottom: 20px;">
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #ef4444; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">Service Time</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Sit back and relax while we work our magic</p>
                </div>
                <div>
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #22c55e; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">All Done!</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Final walkthrough & payment</p>
                </div>
              </div>
            </div>
            
            <!-- Preparation Checklist -->
            <div style="padding: 28px 32px; border-top: 1px solid #262626;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; font-weight: 600;">
                ✅ Quick Prep Checklist
              </h4>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; width: 24px;">
                    <span style="display: inline-block; width: 18px; height: 18px; border: 2px solid #404040; border-radius: 4px;"></span>
                  </td>
                  <td style="padding: 8px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px;">Remove personal items from vehicle</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; width: 24px;">
                    <span style="display: inline-block; width: 18px; height: 18px; border: 2px solid #404040; border-radius: 4px;"></span>
                  </td>
                  <td style="padding: 8px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px;">Ensure access to outdoor water spigot</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; width: 24px;">
                    <span style="display: inline-block; width: 18px; height: 18px; border: 2px solid #404040; border-radius: 4px;"></span>
                  </td>
                  <td style="padding: 8px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px;">Clear parking area for equipment</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; width: 24px;">
                    <span style="display: inline-block; width: 18px; height: 18px; border: 2px solid #404040; border-radius: 4px;"></span>
                  </td>
                  <td style="padding: 8px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px;">Power outlet within 50ft (if possible)</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- CTA Section -->
            <div style="padding: 28px 32px; text-align: center; background: linear-gradient(180deg, #171717 0%, #1a1a1a 100%); border-top: 1px solid #262626;">
              <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">
                Need to make changes?
              </p>
              <p style="color: #a3a3a3; font-size: 13px; margin: 0 0 20px 0;">
                Call or text us anytime
              </p>
              <a href="tel:+12252268979" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(239,68,68,0.3);">
                📞 (225) 226-8979
              </a>
            </div>
            
            <!-- Social Proof -->
            <div style="padding: 24px 32px; background-color: #0a0a0a; border-top: 1px solid #262626; text-align: center;">
              <p style="color: #737373; font-size: 12px; margin: 0 0 8px 0;">
                Join hundreds of satisfied customers
              </p>
              <p style="color: #fbbf24; font-size: 18px; margin: 0; letter-spacing: 2px;">
                ★★★★★
              </p>
              <p style="color: #a3a3a3; font-size: 11px; margin: 8px 0 0 0;">
                5.0 average rating on Google
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
            <div style="margin-top: 16px;">
              <a href="https://avdetailing.net" style="color: #ef4444; text-decoration: none; font-size: 12px; font-weight: 500;">www.avdetailing.net</a>
            </div>
            <p style="color: #404040; font-size: 11px; margin: 16px 0 0 0;">
              © ${new Date().getFullYear()} AV Detailing. All rights reserved.
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
