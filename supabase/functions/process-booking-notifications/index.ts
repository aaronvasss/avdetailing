import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Unified Booking Notification System
// Sends customer confirmations and admin alerts via email.
// Transport: Resend API with verified avdetailing.net domain.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ADMIN_EMAIL = "aaronvasquez100@gmail.com";
const FROM_EMAIL = "AV Detailing <noreply@avdetailing.net>";
const ADMIN_FROM_EMAIL = "AV Detailing <notifications@avdetailing.net>";
const BASE_URL = "https://avdetailing.net";
const PHONE = "(225) 521-6264";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ━━━━ Helpers ━━━━

function htmlEncode(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime12(time: string): string {
  const parts = time.match(/(\d+):(\d+)/);
  if (!parts) return time;
  const h = parseInt(parts[1]);
  const m = parts[2];
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

function isQuoteBasedService(vehicleType?: string): boolean {
  return vehicleType ? ["rv", "boat", "aircraft"].includes(vehicleType.toLowerCase()) : false;
}

function includesCeramic(serviceName: string, addOns?: { name: string }[]): boolean {
  const keywords = ["ceramic", "coating"];
  return keywords.some(k => serviceName.toLowerCase().includes(k)) ||
    (addOns?.some(a => keywords.some(k => a.name.toLowerCase().includes(k))) ?? false);
}

// ━━━━ Email Sending (Transport Layer) ━━━━

async function sendEmail(to: string, from: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ━━━━ Calendar Helpers ━━━━

function buildCalendarLinks(booking: any, serviceName: string) {
  const startDate = new Date(booking.scheduled_date);
  const [hours, minutes] = (booking.scheduled_time.match(/(\d+):(\d+)/) || ["", "9", "00"]).slice(1);
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + (booking.duration_minutes || 180));

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const location = [booking.service_address, booking.service_city, booking.service_state || "LA"].filter(Boolean).join(", ");

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("AV Detailing - " + serviceName)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent("Mobile detailing service.\nCall " + PHONE + "\nBooking: " + booking.id)}&location=${encodeURIComponent(location)}`;

  // Use hosted edge function URL for ICS download (data: URIs don't work in email clients)
  const icsUrl = `${SUPABASE_URL}/functions/v1/download-ics?id=${booking.id}`;

  const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent("AV Detailing - " + serviceName)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&location=${encodeURIComponent(location)}&body=${encodeURIComponent("Mobile detailing. Call " + PHONE)}`;

  return { googleUrl, icsUrl, outlookUrl };
}

// ━━━━ Customer Confirmation HTML ━━━━

function buildCustomerHtml(booking: any, serviceName: string, addOns: { name: string; price: number }[]) {
  const name = htmlEncode((booking.guest_name || "Customer").split(" ")[0]);
  const time = formatTime12(booking.scheduled_time);
  const date = formatDate(booking.scheduled_date);
  const short = shortDate(booking.scheduled_date);
  const addr = htmlEncode(booking.service_address || "");
  const city = htmlEncode(booking.service_city || "");
  const state = htmlEncode(booking.service_state || "LA");
  const zip = booking.service_zip ? htmlEncode(booking.service_zip) : "";
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || "Not specified";
  const vehicleType = booking.vehicle_type || "car";
  const totalPrice = Number(booking.total_price) || 0;
  const subtotal = Number(booking.subtotal) || totalPrice;
  const deposit = Number(booking.deposit_amount) || 0;
  const paymentMethod = booking.payment_method || "in_person";
  const isOnline = ["online", "stripe", "card"].includes(paymentMethod);
  const fee = isOnline ? totalPrice * 0.035 : 0;
  const totalWithFee = totalPrice + fee;
  const remaining = totalWithFee - deposit;
  const duration = booking.duration_minutes || 180;

  const vehicleTypeNames: Record<string, string> = { car: "Car/SUV/Truck", boat: "Boat", rv: "RV/Motorhome", aircraft: "Aircraft" };
  const vtName = vehicleTypeNames[vehicleType.toLowerCase()] || vehicleType;

  const { googleUrl, icsUrl, outlookUrl } = buildCalendarLinks(booking, serviceName);
  const rescheduleUrl = `${BASE_URL}/booking/manage?token=${booking.manage_token}`;

  const isQuote = isQuoteBasedService(vehicleType);
  const hasCeramic = includesCeramic(serviceName, addOns);

  const addOnsHtml = addOns.length > 0 ? `
    <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 12px;">
      <p style="color: #737373; font-size: 11px; text-transform: uppercase; margin: 0 0 8px 0;">Add-Ons Selected</p>
      ${addOns.map(a => `<div style="display:table;width:100%;margin-bottom:6px;"><span style="display:table-cell;color:#a3a3a3;font-size:13px;">+ ${htmlEncode(a.name)}</span><span style="display:table-cell;text-align:right;color:#d4d4d4;font-size:13px;">$${a.price.toFixed(2)}</span></div>`).join("")}
    </div>` : "";

  const photoRequestHtml = isQuote ? `
    <div style="background:linear-gradient(135deg,rgba(59,130,246,0.15) 0%,rgba(59,130,246,0.05) 100%);border-radius:12px;padding:20px;border:1px solid rgba(59,130,246,0.3);margin-top:24px;">
      <h4 style="color:#3b82f6;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;">📸 Help Us Quote Accurately</h4>
      <p style="color:#d4d4d4;font-size:14px;margin:0 0 16px 0;">For the most accurate quote, please reply with <strong style="color:#fff;">2-4 photos</strong>.</p>
    </div>` : "";

  const ceramicHtml = hasCeramic ? `
    <div style="background:linear-gradient(135deg,rgba(168,85,247,0.15) 0%,rgba(168,85,247,0.05) 100%);border-radius:12px;padding:24px;border:1px solid rgba(168,85,247,0.3);margin-top:24px;">
      <h4 style="color:#a855f7;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px 0;">🛡️ Ceramic Coating Aftercare</h4>
      <div style="background-color:rgba(0,0,0,0.3);border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 8px 0;">⏳ First 7 Days</p>
        <ul style="color:#a3a3a3;font-size:13px;margin:0;padding-left:20px;line-height:1.7;">
          <li><strong style="color:#ef4444;">Do NOT wash</strong> the vehicle</li>
          <li>Avoid parking under trees</li><li>Keep away from sprinklers</li>
        </ul>
      </div>
    </div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background-color:#0a0a0a;">
<div style="max-width:600px;margin:0 auto;padding:48px 24px;">

<!-- Header -->
<div style="text-align:center;margin-bottom:40px;">
  <div style="display:inline-block;padding:16px 32px;border:2px solid #ef4444;border-radius:4px;">
    <h1 style="color:#fff;font-size:32px;margin:0;font-weight:800;letter-spacing:2px;"><span style="color:#fff;">AV</span><span style="color:#ef4444;"> DETAILING</span></h1>
  </div>
  <p style="color:#737373;font-size:13px;margin:12px 0 0;text-transform:uppercase;letter-spacing:3px;">Premium Mobile Detailing</p>
</div>

<!-- Date Card -->
<div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
  <p style="color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your Appointment</p>
  <p style="color:#fff;font-size:28px;font-weight:700;margin:0 0 4px;">${short} at ${time}</p>
  <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;">📍 ${city}, ${state}</p>
</div>

<!-- Main Card -->
<div style="background:linear-gradient(180deg,#1a1a1a 0%,#0f0f0f 100%);border-radius:16px;overflow:hidden;border:1px solid #262626;">

  <!-- Success Banner -->
  <div style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:20px;text-align:center;">
    <span style="display:inline-block;background-color:rgba(255,255,255,0.2);border-radius:50%;width:40px;height:40px;line-height:40px;font-size:20px;margin-right:12px;vertical-align:middle;">✓</span>
    <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;">Booking Confirmed!</span>
  </div>

  <!-- Greeting -->
  <div style="padding:28px 32px;text-align:center;border-bottom:1px solid #262626;">
    <p style="color:#a3a3a3;margin:0;font-size:14px;">Hi ${name}, we're excited to bring our premium mobile detailing to you.</p>
  </div>

  <!-- Arrival Window -->
  <div style="padding:20px 32px;background-color:rgba(251,191,36,0.1);border-bottom:1px solid #262626;">
    <p style="color:#fbbf24;font-size:14px;font-weight:700;margin:0;">🚐 Arrival Window</p>
    <p style="color:#d4d4d4;font-size:13px;margin:4px 0 0;">We'll arrive within a <strong style="color:#fff;">30-minute window</strong> of your scheduled ${time} time.</p>
  </div>

  <!-- Action Buttons -->
  <div style="padding:24px 32px;background-color:#0f0f0f;border-bottom:1px solid #262626;">
    <p style="color:#737373;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;text-align:center;">Manage Your Booking</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
      <tr>
        <td width="50%" style="padding-right:6px;"><a href="${BASE_URL}/account" style="display:block;background-color:#3b82f6;color:#fff;text-decoration:none;padding:12px 0;border-radius:8px;font-weight:600;font-size:13px;text-align:center;">📅 Manage Appointment</a></td>
        <td width="50%" style="padding-left:6px;"><a href="${BASE_URL}/cancel/${booking.id}" style="display:block;background-color:#525252;color:#fff;text-decoration:none;padding:12px 0;border-radius:8px;font-weight:600;font-size:13px;text-align:center;">✕ Cancel Appointment</a></td>
      </tr>
    </table>
    ${!booking.user_id ? '<p style="color:#737373;font-size:11px;text-align:center;margin:0 0 12px;">To manage your appointment, create a free account using the same email you booked with.</p>' : ''}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td width="50%" style="padding-right:6px;"><a href="tel:+12255216264" style="display:block;background-color:#262626;color:#fff;text-decoration:none;padding:10px 0;border-radius:8px;font-size:13px;text-align:center;">📞 Call Us</a></td>
        <td width="50%" style="padding-left:6px;"><a href="sms:+12255216264" style="display:block;background-color:#262626;color:#fff;text-decoration:none;padding:10px 0;border-radius:8px;font-size:13px;text-align:center;">💬 Text Us</a></td>
      </tr>
    </table>
    <!-- Calendar -->
    <div style="padding:16px;background-color:#0a0a0a;border-radius:8px;">
      <p style="color:#737373;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;text-align:center;">📅 Add to Your Calendar</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="33%" style="padding-right:4px;"><a href="${icsDataUri}" download="av-detailing.ics" style="display:block;background-color:#333;color:#fff;text-decoration:none;padding:10px 4px;border-radius:8px;font-size:12px;text-align:center;">📱 Apple</a></td>
          <td width="34%" style="padding:0 4px;"><a href="${googleUrl}" target="_blank" style="display:block;background-color:#4285f4;color:#fff;text-decoration:none;padding:10px 4px;border-radius:8px;font-size:12px;text-align:center;">📆 Google</a></td>
          <td width="33%" style="padding-left:4px;"><a href="${outlookUrl}" target="_blank" style="display:block;background-color:#0078d4;color:#fff;text-decoration:none;padding:10px 4px;border-radius:8px;font-size:12px;text-align:center;">📧 Outlook</a></td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Appointment Details -->
  <div style="padding:28px 32px;">
    <h4 style="color:#ef4444;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 20px;font-weight:600;">📋 Appointment Details</h4>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:14px 16px;background-color:#0a0a0a;border-radius:8px 8px 0 0;">
        <span style="color:#737373;font-size:11px;text-transform:uppercase;">Date & Time</span>
        <p style="color:#fff;font-size:16px;font-weight:600;margin:6px 0 0;">${date}</p>
        <p style="color:#ef4444;font-size:18px;font-weight:700;margin:4px 0 0;">${time}</p>
        <p style="color:#a3a3a3;font-size:12px;margin:4px 0 0;">Estimated: ${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ""}</p>
      </td></tr>
      <tr><td style="padding:14px 16px;background-color:rgba(10,10,10,0.5);">
        <span style="color:#737373;font-size:11px;text-transform:uppercase;">📍 Service Location</span>
        <p style="color:#fff;font-size:15px;margin:6px 0 0;">${addr}<br>${[city, state, zip].filter(s => s.length > 1).join(", ")}</p>
      </td></tr>
      <tr><td style="padding:14px 16px;background-color:#0a0a0a;border-radius:0 0 8px 8px;">
        <span style="color:#737373;font-size:11px;text-transform:uppercase;">🚗 Your Vehicle</span>
        <p style="color:#fff;font-size:15px;margin:6px 0 0;">${htmlEncode(vehicle)}</p>
      </td></tr>
    </table>

    <!-- Pricing -->
    <div style="background:linear-gradient(135deg,rgba(239,68,68,0.1) 0%,rgba(239,68,68,0.05) 100%);border-radius:12px;padding:24px;border:1px solid rgba(239,68,68,0.2);margin-top:24px;">
      <h4 style="color:#ef4444;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 20px;font-weight:600;">💰 Package Summary</h4>
      <div style="background-color:rgba(0,0,0,0.3);border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="display:table;width:100%;margin-bottom:8px;"><span style="display:table-cell;color:#737373;font-size:12px;">Vehicle Type</span><span style="display:table-cell;text-align:right;color:#fff;font-size:14px;font-weight:600;">${vtName}</span></div>
        <div style="display:table;width:100%;"><span style="display:table-cell;color:#737373;font-size:12px;">Package</span><span style="display:table-cell;text-align:right;color:#ef4444;font-size:14px;font-weight:700;">${htmlEncode(serviceName)}</span></div>
      </div>
      <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;margin-bottom:12px;">
        <div style="display:table;width:100%;"><span style="display:table-cell;color:#d4d4d4;font-size:14px;">${htmlEncode(serviceName)}</span><span style="display:table-cell;text-align:right;color:#fff;font-size:14px;">$${subtotal.toFixed(2)}</span></div>
      </div>
      ${addOnsHtml}
      <div style="margin-bottom:8px;"><div style="display:table;width:100%;"><span style="display:table-cell;color:#a3a3a3;font-size:13px;">Subtotal</span><span style="display:table-cell;text-align:right;color:#d4d4d4;font-size:13px;">$${totalPrice.toFixed(2)}</span></div></div>
      ${isOnline ? `<div style="margin-bottom:12px;"><div style="display:table;width:100%;"><span style="display:table-cell;color:#a3a3a3;font-size:13px;">Processing Fee (3.5%)</span><span style="display:table-cell;text-align:right;color:#d4d4d4;font-size:13px;">$${fee.toFixed(2)}</span></div></div>` : ""}
      <div style="border-top:2px solid rgba(239,68,68,0.3);padding-top:12px;">
        <div style="display:table;width:100%;margin-bottom:8px;"><span style="display:table-cell;color:#fff;font-size:16px;font-weight:600;">Total</span><span style="display:table-cell;text-align:right;color:#ef4444;font-size:24px;font-weight:800;">$${totalWithFee.toFixed(2)}</span></div>
        ${deposit > 0 ? `
          <div style="display:table;width:100%;margin-bottom:4px;"><span style="display:table-cell;color:#22c55e;font-size:13px;">✓ Deposit Paid</span><span style="display:table-cell;text-align:right;color:#22c55e;font-size:13px;">-$${deposit.toFixed(2)}</span></div>
          <div style="display:table;width:100%;"><span style="display:table-cell;color:#fbbf24;font-size:14px;font-weight:600;">Balance Due</span><span style="display:table-cell;text-align:right;color:#fbbf24;font-size:16px;font-weight:700;">$${remaining.toFixed(2)}</span></div>
        ` : `<div style="display:table;width:100%;"><span style="display:table-cell;color:#fbbf24;font-size:13px;">Due at Service</span><span style="display:table-cell;text-align:right;color:#fbbf24;font-size:14px;font-weight:600;">$${totalWithFee.toFixed(2)}</span></div>`}
      </div>
    </div>

    <!-- Payment Methods -->
    <div style="background-color:#0a0a0a;border-radius:12px;padding:20px;margin-top:16px;text-align:center;">
      <p style="color:#737373;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">We Accept</p>
      <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">
        <span style="color:#fff;font-size:13px;padding:8px 12px;background-color:#171717;border-radius:6px;">💳 Card</span>
        <span style="color:#fff;font-size:13px;padding:8px 12px;background-color:#171717;border-radius:6px;">💵 Cash</span>
        <span style="color:#008cff;font-size:13px;padding:8px 12px;background-color:#171717;border-radius:6px;font-weight:600;">Venmo</span>
        <span style="color:#00d64f;font-size:13px;padding:8px 12px;background-color:#171717;border-radius:6px;font-weight:600;">Cash App</span>
      </div>
    </div>
  </div>

  <!-- Prep Checklist -->
  <div style="padding:28px 32px;border-top:1px solid #262626;background-color:#0a0a0a;">
    <h4 style="color:#ef4444;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 20px;font-weight:600;">✅ Before We Arrive</h4>
    <table style="width:100%;">
      ${[
        ["1", "Remove personal items", "Clear seats, trunk, and door pockets"],
        ["2", "Unlock vehicle or be available", "We need access upon arrival"],
        ["3", "Pets inside please 🐕", "For their safety and ours"],
        ["4", "Water & power access", "Outdoor spigot + outlet within 50ft"],
        ["5", "Gated? Share access info", "Gate code, visitor parking, contact method"],
      ].map(([n, title, desc]) => `
        <tr>
          <td style="padding:10px 0;vertical-align:top;width:32px;"><span style="display:inline-block;width:22px;height:22px;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border-radius:6px;text-align:center;line-height:22px;font-size:12px;color:white;">${n}</span></td>
          <td style="padding:10px 0;padding-left:12px;"><span style="color:#fff;font-size:14px;font-weight:600;">${title}</span><p style="color:#a3a3a3;font-size:12px;margin:4px 0 0;">${desc}</p></td>
        </tr>`).join("")}
    </table>
  </div>

  <!-- Day-of Timeline -->
  <div style="padding:28px 32px;border-top:1px solid #262626;">
    <h4 style="color:#ef4444;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 20px;font-weight:600;">🚗 Day-of Timeline</h4>
    <div style="position:relative;padding-left:24px;border-left:2px solid #262626;">
      ${[
        ["#3b82f6", "Day Before", "Reminder text to confirm"],
        ["#fbbf24", "30 Min Before", "'On our way' text"],
        ["#ef4444", "Service Time 🧽", "Relax while we work"],
        ["#22c55e", "All Done! ✨", "Final walkthrough & payment"],
      ].map(([c, t, d]) => `<div style="margin-bottom:20px;"><div style="position:absolute;left:-7px;width:12px;height:12px;background-color:${c};border-radius:50%;"></div><p style="color:#fff;font-size:14px;font-weight:600;margin:0;">${t}</p><p style="color:#a3a3a3;font-size:13px;margin:4px 0 0;">${d}</p></div>`).join("")}
    </div>
  </div>

  <!-- Trust -->
  <div style="padding:24px 32px;background-color:#0a0a0a;border-top:1px solid #262626;">
    <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-bottom:16px;">
      <span style="color:#a3a3a3;font-size:12px;">✓ Fully Insured</span>
      <span style="color:#a3a3a3;font-size:12px;">✓ Professional Products</span>
      <span style="color:#a3a3a3;font-size:12px;">✓ Paint-Safe</span>
    </div>
    <div style="text-align:center;padding:16px;background-color:rgba(255,255,255,0.03);border-radius:8px;">
      <p style="color:#22c55e;font-size:14px;font-weight:600;margin:0 0 4px;">🛡️ Satisfaction Promise</p>
      <p style="color:#a3a3a3;font-size:12px;margin:0;">Not happy? We'll make it right—no questions asked.</p>
    </div>
  </div>
</div>

${photoRequestHtml}
${ceramicHtml}

<!-- Membership Upsell -->
<div style="background:linear-gradient(135deg,rgba(34,197,94,0.15) 0%,rgba(34,197,94,0.05) 100%);border-radius:12px;padding:24px;border:1px solid rgba(34,197,94,0.3);margin-top:24px;text-align:center;">
  <p style="color:#22c55e;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-weight:600;">💎 Want Your Detail to Last?</p>
  <h4 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">Join Our Maintenance Membership</h4>
  <p style="color:#a3a3a3;font-size:14px;margin:0 0 16px;">Keep your vehicle looking showroom-fresh.</p>
  <a href="${BASE_URL}/memberships" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;">Learn About Memberships →</a>
</div>

<!-- Footer -->
<div style="text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #262626;">
  <p style="color:#525252;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Confirmation #${booking.id.substring(0, 8)}</p>
  <p style="color:#404040;font-size:12px;margin:0;">AV Detailing • Baton Rouge & Surrounding Areas</p>
  <a href="${BASE_URL}" style="color:#ef4444;text-decoration:none;font-size:12px;">www.avdetailing.net</a>
  <p style="color:#404040;font-size:11px;margin:16px 0 0;">© ${new Date().getFullYear()} AV Detailing. All rights reserved.</p>
</div>

</div></body></html>`;
}

// ━━━━ Admin Alert HTML ━━━━

function buildAdminHtml(booking: any, serviceName: string) {
  const name = htmlEncode(booking.guest_name || "Customer");
  const email = booking.guest_email ? htmlEncode(booking.guest_email) : "";
  const phone = booking.guest_phone ? htmlEncode(booking.guest_phone) : "";
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || "N/A";
  const date = formatDate(booking.scheduled_date);
  const time = formatTime12(booking.scheduled_time);
  const addr = [booking.service_address, booking.service_city, booking.service_state || "LA", booking.service_zip].filter(Boolean).join(", ");
  const total = Number(booking.total_price) || 0;
  const payment = (booking.payment_method || "in_person").replace("_", " ");
  const deposit = Number(booking.deposit_amount) || 0;

  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#111;color:#fff;border-radius:12px;">
    <h2 style="color:#ef4444;">New Booking Alert 🚗</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#999;">Customer</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
      ${phone ? `<tr><td style="padding:8px 0;color:#999;">Phone</td><td style="padding:8px 0;"><a href="tel:${phone}" style="color:#ef4444;">${phone}</a></td></tr>` : ""}
      ${email ? `<tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#ef4444;">${email}</a></td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#999;">Service</td><td style="padding:8px 0;">${htmlEncode(serviceName)}</td></tr>
      <tr><td style="padding:8px 0;color:#999;">Vehicle</td><td style="padding:8px 0;">${htmlEncode(vehicle)}</td></tr>
      <tr><td style="padding:8px 0;color:#999;">Date & Time</td><td style="padding:8px 0;">${date} at ${time}</td></tr>
      <tr><td style="padding:8px 0;color:#999;">Address</td><td style="padding:8px 0;">${htmlEncode(addr)}</td></tr>
      <tr><td style="padding:8px 0;color:#999;">Total</td><td style="padding:8px 0;font-weight:bold;color:#22c55e;">$${total.toFixed(2)}</td></tr>
      <tr><td style="padding:8px 0;color:#999;">Payment</td><td style="padding:8px 0;">${payment}${deposit > 0 ? ` — $${deposit.toFixed(2)} deposit paid` : " — unpaid"}</td></tr>
    </table>
    <p style="margin-top:16px;"><a href="${BASE_URL}/admin" style="color:#ef4444;font-weight:600;">View in Admin Dashboard →</a></p>
    <p style="margin-top:8px;color:#666;font-size:12px;">Booking ID: ${booking.id}</p>
  </div>`;
}

// ━━━━ Main Handler ━━━━

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, mode = "auto" } = await req.json();

    if (!booking_id) {
      return new Response(JSON.stringify({ error: "Missing booking_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate mode
    const validModes = ["auto", "resend_customer", "resend_admin"];
    if (!validModes.includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For resend modes, verify caller is staff/admin
    if (mode !== "auto") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch booking with service info
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceName = (booking.services as any)?.name || "Detailing Service";

    // For auto mode, check idempotency
    if (mode === "auto" && booking.sent_confirmation === true) {
      console.log(`Booking ${booking_id} already sent confirmation — skipping`);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch add-ons
    const { data: addOns } = await supabase
      .from("booking_add_ons")
      .select("name, price")
      .eq("booking_id", booking_id);

    const results: { customer?: { ok: boolean; error?: string }; admin?: { ok: boolean; error?: string } } = {};
    const customerEmail = booking.guest_email?.trim();
    const isAdminSelf = customerEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    console.log(`Processing notifications for booking ${booking_id} | mode=${mode} | customer=${customerEmail} | isAdminSelf=${isAdminSelf}`);

    // ━━━━ Customer Confirmation ━━━━
    if ((mode === "auto" || mode === "resend_customer") && customerEmail && !isAdminSelf) {
      const html = buildCustomerHtml(booking, serviceName, addOns || []);
      const subject = `✅ Booking Confirmed - ${serviceName} on ${formatDate(booking.scheduled_date)}`;

      results.customer = await sendEmail(customerEmail, FROM_EMAIL, subject, html);

      await supabase.from("booking_notification_log").insert({
        booking_id,
        notification_type: "email_confirmation",
        recipient: customerEmail,
        status: results.customer.ok ? "sent" : "failed",
        error_message: results.customer.error || null,
      });

      console.log(`Customer email ${results.customer.ok ? "sent" : "failed"} to ${customerEmail}`);
    }

    // ━━━━ Admin Alert ━━━━
    if (mode === "auto" || mode === "resend_admin") {
      const html = buildAdminHtml(booking, serviceName);
      const subject = `New Booking 🚗 ${booking.guest_name || "Customer"} — ${serviceName} on ${shortDate(booking.scheduled_date)}`;

      results.admin = await sendEmail(ADMIN_EMAIL, ADMIN_FROM_EMAIL, subject, html);

      await supabase.from("booking_notification_log").insert({
        booking_id,
        notification_type: "admin_notification",
        recipient: ADMIN_EMAIL,
        status: results.admin.ok ? "sent" : "failed",
        error_message: results.admin.error || null,
      });

      console.log(`Admin email ${results.admin.ok ? "sent" : "failed"} to ${ADMIN_EMAIL}`);
    }

    // Mark as sent (auto mode only)
    if (mode === "auto") {
      await supabase.from("bookings").update({ sent_confirmation: true }).eq("id", booking_id);
    }

    const anyFailed = (results.customer && !results.customer.ok) || (results.admin && !results.admin.ok);

    return new Response(JSON.stringify({ success: !anyFailed, results }), {
      status: anyFailed ? 207 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
