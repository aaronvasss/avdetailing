import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
// Admin email for separate booking alert
const ADMIN_EMAIL = "aaronvasquez100@gmail.com";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10;

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
  serviceZip?: string;
  vehicleInfo: string;
  vehicleType?: string;
  vehicleSize?: string;
  totalPrice: number;
  bookingId: string;
  basePrice?: number;
  addOns?: BookingAddOn[];
  estimatedDuration?: number;
  customerPhone?: string;
  depositAmount?: number;
  paymentMethod?: string;
  gateCode?: string;
  parkingInstructions?: string;
  manageToken?: string;
  skipAdminNotification?: boolean;
}

// Get client identifier for rate limiting
function getClientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  return cfIp || realIp || forwarded?.split(",")[0]?.trim() || "unknown";
}

// In-memory rate limiting (resets on cold start, but provides protection during active usage)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(clientId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment count
  entry.count += 1;
  rateLimitMap.set(clientId, entry);
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

// Check if service is a quote-based service (RV, Boat, Aircraft)
function isQuoteBasedService(vehicleType?: string): boolean {
  const quoteServices = ['rv', 'boat', 'aircraft'];
  return vehicleType ? quoteServices.includes(vehicleType.toLowerCase()) : false;
}

// Check if service includes ceramic coating
function includesCeramic(serviceName: string, addOns?: BookingAddOn[]): boolean {
  const ceramicKeywords = ['ceramic', 'coating'];
  const nameHasCeramic = ceramicKeywords.some(k => serviceName.toLowerCase().includes(k));
  const addOnHasCeramic = addOns?.some(a => ceramicKeywords.some(k => a.name.toLowerCase().includes(k)));
  return nameHasCeramic || addOnHasCeramic || false;
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
      serviceZip = "",
      vehicleInfo,
      vehicleType = "car",
      vehicleSize = "",
      totalPrice,
      bookingId,
      basePrice,
      addOns = [],
      estimatedDuration,
      customerPhone,
      depositAmount = 0,
      paymentMethod = "card",
    gateCode,
    parkingInstructions,
    manageToken,
    skipAdminNotification = false,
  }: BookingConfirmationRequest = rawData;

  // Build manage URLs - always link to account page for managing bookings
  const baseUrl = "https://avdetailing.net";
  const rescheduleUrl = `${baseUrl}/account`;
  const cancelUrl = `${baseUrl}/account`;
    const safeCustomerName = htmlEncode(customerName.trim());
    const safeServiceName = htmlEncode(serviceName.trim());
    const safeScheduledTime = htmlEncode(scheduledTime.trim());
    const safeServiceAddress = htmlEncode(serviceAddress.trim());
    const safeServiceCity = htmlEncode(serviceCity.trim());
    const safeServiceState = htmlEncode(serviceState.trim());
    const safeServiceZip = serviceZip ? htmlEncode(serviceZip.trim()) : "";
    const safeVehicleInfo = vehicleInfo ? htmlEncode(vehicleInfo.trim()) : "Not specified";
    const safeBookingId = htmlEncode(bookingId);
    const safeVehicleType = htmlEncode(vehicleType);
    const safeVehicleSize = vehicleSize ? htmlEncode(vehicleSize) : "";
    const safeGateCode = gateCode ? htmlEncode(gateCode) : "";
    const safeParkingInstructions = parkingInstructions ? htmlEncode(parkingInstructions) : "";

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

    // Calculate processing fee (3.5%) — only for online/Stripe payments
    const isOnlinePayment = paymentMethod === 'online' || paymentMethod === 'stripe' || paymentMethod === 'card';
    const processingFee = isOnlinePayment ? totalPrice * 0.035 : 0;
    const totalWithFee = totalPrice + processingFee;
    const remainingBalance = totalWithFee - depositAmount;

    // Check for quote-based and ceramic services
    const isQuoteBased = isQuoteBasedService(vehicleType);
    const hasCeramic = includesCeramic(serviceName, addOns);

    // Generate calendar dates
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
    
    // Google Calendar URL
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('AV Detailing - ' + serviceName)}&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}&details=${encodeURIComponent('Mobile detailing service at your location.\n\nQuestions? Call (225) 521-6264\nBooking ID: ' + bookingId)}&location=${encodeURIComponent(serviceAddress + ', ' + serviceCity + ', ' + serviceState)}`;
    
    // Generate ICS file content for Apple Calendar / Outlook
    const formatICSDate = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };
    
    const escapeICS = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AV Detailing//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${safeBookingId}@avdetailing.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS('AV Detailing - ' + serviceName)}`,
      `DESCRIPTION:${escapeICS('Service: ' + serviceName + '\\nLocation: ' + serviceAddress + ', ' + serviceCity + ', ' + serviceState + '\\n\\nQuestions? Call (225) 521-6264')}`,
      `LOCATION:${escapeICS(serviceAddress + ', ' + serviceCity + ', ' + serviceState)}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:AV Detailing appointment tomorrow',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      'DESCRIPTION:AV Detailing appointment in 2 hours',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    
    // Create data URI for ICS download
    const icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines)}`;
    
    // Outlook Web URL
    const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent('AV Detailing - ' + serviceName)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&location=${encodeURIComponent(serviceAddress + ', ' + serviceCity + ', ' + serviceState)}&body=${encodeURIComponent('Mobile detailing service at your location.\n\nQuestions? Call (225) 521-6264')}`;

    // Get vehicle type display name
    const vehicleTypeNames: Record<string, string> = {
      'car': 'Car/SUV/Truck',
      'boat': 'Boat',
      'rv': 'RV/Motorhome',
      'aircraft': 'Aircraft'
    };
    const vehicleTypeName = vehicleTypeNames[vehicleType.toLowerCase()] || vehicleType;

    // Build the pricing summary section
    const pricingSummaryHtml = `
      <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%); border-radius: 12px; padding: 24px; border: 1px solid rgba(239,68,68,0.2); margin-top: 24px;">
        <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: 600;">
          💰 Your Package Summary
        </h4>
        
        <!-- Vehicle & Package Info -->
        <div style="background-color: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="display: table; width: 100%; margin-bottom: 8px;">
            <span style="display: table-cell; color: #737373; font-size: 12px;">Vehicle Type</span>
            <span style="display: table-cell; text-align: right; color: #ffffff; font-size: 14px; font-weight: 600;">${vehicleTypeName}</span>
          </div>
          ${safeVehicleSize ? `
          <div style="display: table; width: 100%; margin-bottom: 8px;">
            <span style="display: table-cell; color: #737373; font-size: 12px;">Size Category</span>
            <span style="display: table-cell; text-align: right; color: #ffffff; font-size: 14px;">${safeVehicleSize}</span>
          </div>
          ` : ''}
          <div style="display: table; width: 100%;">
            <span style="display: table-cell; color: #737373; font-size: 12px;">Package</span>
            <span style="display: table-cell; text-align: right; color: #ef4444; font-size: 14px; font-weight: 700;">${safeServiceName}</span>
          </div>
        </div>
        
        <!-- Line Items -->
        ${basePrice ? `
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 12px;">
          <div style="display: table; width: 100%;">
            <span style="display: table-cell; color: #d4d4d4; font-size: 14px;">${safeServiceName}</span>
            <span style="display: table-cell; text-align: right; color: #ffffff; font-size: 14px;">$${basePrice.toFixed(2)}</span>
          </div>
        </div>
        ` : ''}
        
        ${addOns.length > 0 ? `
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 12px;">
          <p style="color: #737373; font-size: 11px; text-transform: uppercase; margin: 0 0 8px 0;">Add-Ons Selected</p>
          ${addOns.map(addon => `
            <div style="display: table; width: 100%; margin-bottom: 6px;">
              <span style="display: table-cell; color: #a3a3a3; font-size: 13px;">+ ${htmlEncode(addon.name)}</span>
              <span style="display: table-cell; text-align: right; color: #d4d4d4; font-size: 13px;">$${addon.price.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <!-- Subtotal, Fee, Total -->
        <div style="margin-bottom: 8px;">
          <div style="display: table; width: 100%;">
            <span style="display: table-cell; color: #a3a3a3; font-size: 13px;">Subtotal</span>
            <span style="display: table-cell; text-align: right; color: #d4d4d4; font-size: 13px;">$${totalPrice.toFixed(2)}</span>
          </div>
        </div>
        ${isOnlinePayment ? `
        <div style="margin-bottom: 12px;">
          <div style="display: table; width: 100%;">
            <span style="display: table-cell; color: #a3a3a3; font-size: 13px;">Processing Fee (3.5%)</span>
            <span style="display: table-cell; text-align: right; color: #d4d4d4; font-size: 13px;">$${processingFee.toFixed(2)}</span>
          </div>
        </div>
        ` : ''}
        
        <div style="border-top: 2px solid rgba(239,68,68,0.3); padding-top: 12px;">
          <div style="display: table; width: 100%; margin-bottom: 8px;">
            <span style="display: table-cell; color: #ffffff; font-size: 16px; font-weight: 600;">Total</span>
            <span style="display: table-cell; text-align: right; color: #ef4444; font-size: 24px; font-weight: 800;">$${totalWithFee.toFixed(2)}</span>
          </div>
          ${depositAmount > 0 ? `
          <div style="display: table; width: 100%; margin-bottom: 4px;">
            <span style="display: table-cell; color: #22c55e; font-size: 13px;">✓ Deposit Paid</span>
            <span style="display: table-cell; text-align: right; color: #22c55e; font-size: 13px;">-$${depositAmount.toFixed(2)}</span>
          </div>
          <div style="display: table; width: 100%;">
            <span style="display: table-cell; color: #fbbf24; font-size: 14px; font-weight: 600;">Balance Due at Service</span>
            <span style="display: table-cell; text-align: right; color: #fbbf24; font-size: 16px; font-weight: 700;">$${remainingBalance.toFixed(2)}</span>
          </div>
          ` : `
          <div style="display: table; width: 100%;">
            <span style="display: table-cell; color: #fbbf24; font-size: 13px;">Due at Service</span>
            <span style="display: table-cell; text-align: right; color: #fbbf24; font-size: 14px; font-weight: 600;">$${totalWithFee.toFixed(2)}</span>
          </div>
          `}
        </div>
      </div>
    `;

    // Payment methods section
    const paymentMethodsHtml = `
      <div style="background-color: #0a0a0a; border-radius: 12px; padding: 20px; margin-top: 16px; text-align: center;">
        <p style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">
          We Accept
        </p>
        <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
          <span style="color: #ffffff; font-size: 13px; padding: 8px 12px; background-color: #171717; border-radius: 6px;">💳 Card</span>
          <span style="color: #ffffff; font-size: 13px; padding: 8px 12px; background-color: #171717; border-radius: 6px;">💵 Cash</span>
          <span style="color: #008cff; font-size: 13px; padding: 8px 12px; background-color: #171717; border-radius: 6px; font-weight: 600;">Venmo</span>
          <span style="color: #00d64f; font-size: 13px; padding: 8px 12px; background-color: #171717; border-radius: 6px; font-weight: 600;">Cash App</span>
        </div>
        <p style="color: #525252; font-size: 11px; margin: 12px 0 0 0;">
          Cash payments have no processing fee
        </p>
      </div>
    `;

    // Quote-based photo request section (for RV/Boat/Aircraft)
    const photoRequestHtml = isQuoteBased ? `
      <div style="background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%); border-radius: 12px; padding: 20px; border: 1px solid rgba(59,130,246,0.3); margin-top: 24px;">
        <h4 style="color: #3b82f6; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0; font-weight: 600;">
          📸 Help Us Quote Accurately
        </h4>
        <p style="color: #d4d4d4; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
          For the most accurate quote on your ${vehicleTypeName.toLowerCase()}, please reply with <strong style="color: #ffffff;">2-4 photos</strong>:
        </p>
        <ul style="color: #a3a3a3; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Front/bow view</li>
          <li>Side profile</li>
          <li>Interior/cabin</li>
          <li>Any areas of concern</li>
        </ul>
        <p style="color: #737373; font-size: 12px; margin: 16px 0 0 0;">
          Just reply to this email with your photos for the fastest response!
        </p>
      </div>
    ` : '';

    // Ceramic aftercare section
    const ceramicAftercareHtml = hasCeramic ? `
      <div style="background: linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%); border-radius: 12px; padding: 24px; border: 1px solid rgba(168,85,247,0.3); margin-top: 24px;">
        <h4 style="color: #a855f7; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; font-weight: 600;">
          🛡️ Ceramic Coating Aftercare
        </h4>
        <p style="color: #d4d4d4; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
          To ensure your ceramic coating cures properly and lasts for years:
        </p>
        <div style="background-color: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">⏳ First 7 Days (Curing Period)</p>
          <ul style="color: #a3a3a3; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.7;">
            <li><strong style="color: #ef4444;">Do NOT wash</strong> the vehicle</li>
            <li>Avoid parking under trees (sap/pollen)</li>
            <li>Keep away from sprinklers</li>
            <li>If bird droppings land on it, remove gently with a damp microfiber only</li>
          </ul>
        </div>
        <div style="background-color: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px;">
          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">🧴 First Wash Recommendations</p>
          <ul style="color: #a3a3a3; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.7;">
            <li>Use pH-neutral car wash soap</li>
            <li>Wash in the shade, never in direct sunlight</li>
            <li>Use the two-bucket method</li>
            <li>Dry with a clean microfiber towel</li>
          </ul>
        </div>
        <p style="color: #737373; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
          Questions about care? We're always here to help!
        </p>
      </div>
    ` : '';

    // Membership upsell section
    const membershipUpsellHtml = `
      <div style="background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%); border-radius: 12px; padding: 24px; border: 1px solid rgba(34,197,94,0.3); margin-top: 24px; text-align: center;">
        <p style="color: #22c55e; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0; font-weight: 600;">
          💎 Want Your Detail to Last Longer?
        </p>
        <h4 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
          Join Our Maintenance Membership
        </h4>
        <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
          Keep your vehicle looking showroom-fresh with regular scheduled maintenance washes.
        </p>
        <div style="background-color: rgba(0,0,0,0.4); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #fbbf24; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
            🎁 Limited Time: 24-Hour Bonus!
          </p>
          <p style="color: #d4d4d4; font-size: 13px; margin: 0;">
            Enroll within 24 hours of your service and get <strong style="color: #22c55e;">$20 OFF</strong> your first month!
          </p>
        </div>
        <a href="https://avdetailing.net/memberships" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px 0 rgba(34,197,94,0.3);">
          Learn About Memberships →
        </a>
      </div>
    `;

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
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">
              Your Appointment
            </p>
            <p style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 4px 0;">
              ${shortDate} at ${safeScheduledTime}
            </p>
            <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0;">
              📍 ${safeServiceCity}, ${safeServiceState}
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
              <h3 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 700;">
                AV Detailing 🚗
              </h3>
              <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                Booking Confirmed
              </p>
              <p style="color: #a3a3a3; margin: 0; font-size: 14px; line-height: 1.5;">
                Hi ${safeCustomerName.split(' ')[0]}, we're excited to bring our premium mobile detailing to you.
              </p>
            </div>
            
            <!-- ARRIVAL WINDOW NOTICE -->
            <div style="padding: 20px 32px; background-color: rgba(251,191,36,0.1); border-bottom: 1px solid #262626;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">🚐</span>
                <div>
                  <p style="color: #fbbf24; font-size: 14px; font-weight: 700; margin: 0;">Arrival Window</p>
                  <p style="color: #d4d4d4; font-size: 13px; margin: 4px 0 0 0;">
                    We'll arrive within a <strong style="color: #ffffff;">30-minute window</strong> of your scheduled ${safeScheduledTime} time.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- ONE-TAP ACTION BUTTONS -->
            <div style="padding: 24px 32px; background-color: #0f0f0f; border-bottom: 1px solid #262626;">
              <p style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; text-align: center;">
                Manage Your Booking
              </p>
              <!-- Reschedule & Cancel Row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                <tr>
                  <td width="50%" style="padding-right: 6px;">
                    <a href="${rescheduleUrl}" style="display: block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 0; border-radius: 8px; font-weight: 600; font-size: 13px; text-align: center;">
                      📅 Reschedule
                    </a>
                  </td>
                  <td width="50%" style="padding-left: 6px;">
                    <a href="${cancelUrl}" style="display: block; background-color: #525252; color: #ffffff; text-decoration: none; padding: 12px 0; border-radius: 8px; font-weight: 600; font-size: 13px; text-align: center;">
                      ✕ Cancel
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Call & Text Row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" style="padding-right: 6px;">
                    <a href="tel:+12255216264" style="display: block; background-color: #262626; color: #ffffff; text-decoration: none; padding: 10px 0; border-radius: 8px; font-size: 13px; text-align: center;">
                      📞 Call Us
                    </a>
                  </td>
                  <td width="50%" style="padding-left: 6px;">
                    <a href="sms:+12255216264" style="display: block; background-color: #262626; color: #ffffff; text-decoration: none; padding: 10px 0; border-radius: 8px; font-size: 13px; text-align: center;">
                      💬 Text Us
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Calendar Options -->
              <div style="padding: 16px; background-color: #0a0a0a; border-radius: 8px;">
                <p style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0; text-align: center;">
                  📅 Add to Your Calendar
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="33%" style="padding-right: 4px;">
                      <a href="${icsDataUri}" download="av-detailing-appointment.ics" style="display: block; background-color: #333333; color: #ffffff; text-decoration: none; padding: 10px 4px; border-radius: 8px; font-size: 12px; font-weight: 500; text-align: center;">
                        📱 Apple
                      </a>
                    </td>
                    <td width="34%" style="padding: 0 4px;">
                      <a href="${calendarUrl}" target="_blank" style="display: block; background-color: #4285f4; color: #ffffff; text-decoration: none; padding: 10px 4px; border-radius: 8px; font-size: 12px; font-weight: 500; text-align: center;">
                        📆 Google
                      </a>
                    </td>
                    <td width="33%" style="padding-left: 4px;">
                      <a href="${outlookUrl}" target="_blank" style="display: block; background-color: #0078d4; color: #ffffff; text-decoration: none; padding: 10px 4px; border-radius: 8px; font-size: 12px; font-weight: 500; text-align: center;">
                        📧 Outlook
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color: #525252; font-size: 10px; margin: 10px 0 0 0; text-align: center;">
                  iPhone/iPad users: Tap "Apple" to download .ics file
                </p>
              </div>
            </div>
            
            <!-- Appointment Details -->
            <div style="padding: 28px 32px;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: 600;">
                📋 Appointment Details
              </h4>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #0a0a0a; border-radius: 8px 8px 0 0;">
                    <span style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span>
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 6px 0 0 0;">
                      ${formattedDate}
                    </p>
                    <p style="color: #ef4444; font-size: 18px; font-weight: 700; margin: 4px 0 0 0;">
                      ${safeScheduledTime}
                    </p>
                    ${estimatedDuration ? `<p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">Estimated time: ${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60 > 0 ? (estimatedDuration % 60) + 'm' : ''}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; background-color: rgba(10,10,10,0.5);">
                    <span style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">📍 Service Location</span>
                    <p style="color: #ffffff; font-size: 15px; margin: 6px 0 0 0;">
                      ${safeServiceAddress}<br>
                      ${[safeServiceCity, safeServiceState, safeServiceZip].filter(s => s && s.length > 1).join(', ')}
                    </p>
                    ${safeGateCode ? `<p style="color: #fbbf24; font-size: 12px; margin: 8px 0 0 0;">🔐 Gate Code: ${safeGateCode}</p>` : ''}
                    ${safeParkingInstructions ? `<p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">📌 ${safeParkingInstructions}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; background-color: #0a0a0a; border-radius: 0 0 8px 8px;">
                    <span style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">🚗 Your Vehicle</span>
                    <p style="color: #ffffff; font-size: 15px; margin: 6px 0 0 0;">${safeVehicleInfo}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Package Summary (Clear & Impossible to Misunderstand) -->
              ${pricingSummaryHtml}
              
              <!-- Payment Methods -->
              ${paymentMethodsHtml}
            </div>
            
            <!-- PREPARATION CHECKLIST (Detailing-Specific) -->
            <div style="padding: 28px 32px; border-top: 1px solid #262626; background-color: #0a0a0a;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: 600;">
                ✅ Before We Arrive (Important!)
              </h4>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 32px;">
                    <span style="display: inline-block; width: 22px; height: 22px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 6px; text-align: center; line-height: 22px; font-size: 12px; color: white;">1</span>
                  </td>
                  <td style="padding: 10px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Remove personal items</span>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">Clear seats, trunk/cargo area, and door pockets</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 32px;">
                    <span style="display: inline-block; width: 22px; height: 22px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 6px; text-align: center; line-height: 22px; font-size: 12px; color: white;">2</span>
                  </td>
                  <td style="padding: 10px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Unlock vehicle or be available</span>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">We'll need access upon arrival</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 32px;">
                    <span style="display: inline-block; width: 22px; height: 22px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 6px; text-align: center; line-height: 22px; font-size: 12px; color: white;">3</span>
                  </td>
                  <td style="padding: 10px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Pets inside please 🐕</span>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">For their safety and ours</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 32px;">
                    <span style="display: inline-block; width: 22px; height: 22px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 6px; text-align: center; line-height: 22px; font-size: 12px; color: white;">4</span>
                  </td>
                  <td style="padding: 10px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Water & power access</span>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">Outdoor spigot + power outlet within 50ft</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 32px;">
                    <span style="display: inline-block; width: 22px; height: 22px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 6px; text-align: center; line-height: 22px; font-size: 12px; color: white;">5</span>
                  </td>
                  <td style="padding: 10px 0; padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Apartment/Gated? Share access info</span>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 4px 0 0 0;">Gate code, visitor parking, best contact method</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- What Happens Next Timeline -->
            <div style="padding: 28px 32px; border-top: 1px solid #262626;">
              <h4 style="color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: 600;">
                🚗 Day-of Timeline
              </h4>
              <div style="position: relative; padding-left: 24px; border-left: 2px solid #262626;">
                <div style="margin-bottom: 20px;">
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #3b82f6; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">Day Before</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Reminder text to confirm</p>
                </div>
                <div style="margin-bottom: 20px;">
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #fbbf24; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">30 Min Before Arrival</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">"On our way" text notification</p>
                </div>
                <div style="margin-bottom: 20px;">
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #ef4444; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">Service Time 🧽</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Relax while we work our magic</p>
                </div>
                <div>
                  <div style="position: absolute; left: -7px; width: 12px; height: 12px; background-color: #22c55e; border-radius: 50%;"></div>
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">All Done! ✨</p>
                  <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Final walkthrough & payment</p>
                </div>
              </div>
            </div>
            
            <!-- Trust Signals (Detailing-Specific) -->
            <div style="padding: 24px 32px; background-color: #0a0a0a; border-top: 1px solid #262626;">
              <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-bottom: 16px;">
                <span style="color: #a3a3a3; font-size: 12px;">✓ Fully Insured</span>
                <span style="color: #a3a3a3; font-size: 12px;">✓ Professional-Grade Products</span>
                <span style="color: #a3a3a3; font-size: 12px;">✓ Paint-Safe Process</span>
              </div>
              <div style="text-align: center; padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 8px;">
                <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
                  🛡️ Satisfaction Promise
                </p>
                <p style="color: #a3a3a3; font-size: 12px; margin: 0; line-height: 1.5;">
                  Not happy? We'll make it right—no questions asked.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Photo Request for Quote-Based Services -->
          ${photoRequestHtml}
          
          <!-- Ceramic Aftercare -->
          ${ceramicAftercareHtml}
          
          <!-- Membership Upsell -->
          ${membershipUpsellHtml}
          
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

    // Create service-role client for logging notifications
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine if the customer email is the admin's own email
    const isAdminBooking = customerEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // EMAIL A: Send customer confirmation (skip if admin is booking for themselves)
    if (!isAdminBooking) {
      const customerRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "AV Detailing <noreply@avdetailing.net>",
          to: [customerEmail.trim()],
          subject: `✅ Booking Confirmed - ${safeServiceName} on ${formattedDate}`,
          html: emailHtml,
        }),
      });

      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        console.error("Customer email failed:", customerData);
        // Log failed customer email
        await supabaseAdmin.from("booking_notification_log").insert({
          booking_id: bookingId,
          notification_type: "email_confirmation",
          recipient: customerEmail.trim(),
          status: "failed",
          error_message: customerData.message || `HTTP ${customerRes.status}`,
        });
        throw new Error(customerData.message || "Failed to send customer email");
      }
      console.log("Customer confirmation email sent:", customerData);
      // Log successful customer email
      await supabaseAdmin.from("booking_notification_log").insert({
        booking_id: bookingId,
        notification_type: "email_confirmation",
        recipient: customerEmail.trim(),
        status: "sent",
      });
    } else {
      console.log("Skipping customer confirmation — admin is the customer");
    }

    // EMAIL B: Send separate admin notification (skip if this is a resend — resends are customer-only)
    if (!skipAdminNotification) {
    const adminSubject = `New Booking 🚗 ${safeCustomerName} — ${safeServiceName} on ${shortDate}`;
    const adminHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #111; color: #fff; border-radius: 12px;">
        <h2 style="color: #ef4444;">New Booking Alert 🚗</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #999;">Customer</td><td style="padding: 8px 0; font-weight: bold;">${safeCustomerName}</td></tr>
          ${customerPhone ? `<tr><td style="padding: 8px 0; color: #999;">Phone</td><td style="padding: 8px 0;"><a href="tel:${htmlEncode(customerPhone)}" style="color: #ef4444;">${htmlEncode(customerPhone)}</a></td></tr>` : ""}
          <tr><td style="padding: 8px 0; color: #999;">Email</td><td style="padding: 8px 0;"><a href="mailto:${htmlEncode(customerEmail)}" style="color: #ef4444;">${htmlEncode(customerEmail)}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Service</td><td style="padding: 8px 0;">${safeServiceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Vehicle</td><td style="padding: 8px 0;">${safeVehicleInfo}</td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Date & Time</td><td style="padding: 8px 0;">${formattedDate} at ${safeScheduledTime}</td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Address</td><td style="padding: 8px 0;">${safeServiceAddress}, ${safeServiceCity}, ${safeServiceState} ${safeServiceZip}</td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Total</td><td style="padding: 8px 0; font-weight: bold; color: #22c55e;">$${totalWithFee.toFixed(2)}</td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Payment</td><td style="padding: 8px 0;">${paymentMethod.replace("_", " ")} — ${depositAmount > 0 ? `$${depositAmount.toFixed(2)} deposit paid` : "unpaid"}</td></tr>
        </table>
        <p style="margin-top: 16px; color: #666; font-size: 12px;">Booking ID: ${safeBookingId}</p>
      </div>
    `;

    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AV Detailing <notifications@avdetailing.net>",
        to: [ADMIN_EMAIL],
        subject: adminSubject,
        html: adminHtml,
      }),
    });

    const adminData = await adminRes.json();
    if (!adminRes.ok) {
      console.error("Admin notification email failed:", adminData);
      await supabaseAdmin.from("booking_notification_log").insert({
        booking_id: bookingId,
        notification_type: "admin_notification",
        recipient: ADMIN_EMAIL,
        status: "failed",
        error_message: adminData.message || `HTTP ${adminRes.status}`,
      });
    } else {
      console.log("Admin notification email sent:", adminData);
      await supabaseAdmin.from("booking_notification_log").insert({
        booking_id: bookingId,
        notification_type: "admin_notification",
        recipient: ADMIN_EMAIL,
        status: "sent",
      });
    }
    } else {
      console.log("Skipping admin notification — resend mode (customer-only)");
    }

    return new Response(JSON.stringify({ success: true }), {
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
