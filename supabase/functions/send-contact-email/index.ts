import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Business email recipients
const BUSINESS_EMAILS = ["aaronvasquez100@gmail.com", "aaronvasquez@avdetailingg.com"];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 300000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
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

// Validate input lengths and formats
function validateInput(data: ContactEmailRequest): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length < 1 || data.name.length > 100) {
    return { valid: false, error: "Invalid name" };
  }
  if (!data.email || !isValidEmail(data.email)) {
    return { valid: false, error: "Invalid email address" };
  }
  if (data.phone && data.phone.length > 20) {
    return { valid: false, error: "Invalid phone number" };
  }
  if (data.service && data.service.length > 100) {
    return { valid: false, error: "Invalid service selection" };
  }
  if (!data.message || data.message.trim().length < 10 || data.message.length > 2000) {
    return { valid: false, error: "Message must be between 10 and 2000 characters" };
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
            "Retry-After": "300",
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

    const { name, email, phone, service, message }: ContactEmailRequest = rawData;

    // HTML encode all user inputs to prevent XSS in emails
    const safeName = htmlEncode(name.trim());
    const safeEmail = htmlEncode(email.trim());
    const safePhone = phone ? htmlEncode(phone.trim()) : null;
    const safeService = service ? htmlEncode(service.trim()) : null;
    const safeMessage = htmlEncode(message.trim());

    // Send notification to business
    const businessEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AV Detailing <noreply@avdetailing.net>",
        to: BUSINESS_EMAILS,
        subject: `New Contact Form Submission from ${safeName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            ${safePhone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ''}
            ${safeService ? `<p><strong>Service Interest:</strong> ${safeService}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p>${safeMessage.replace(/\n/g, '<br>')}</p>
          </body>
          </html>
        `,
      }),
    });

    if (!businessEmailRes.ok) {
      const errorData = await businessEmailRes.json();
      console.error("Failed to send business notification:", errorData);
    }

    // Send confirmation to customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
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
            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
              Thanks for reaching out, ${safeName}!
            </h2>
            <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              We've received your message and will get back to you within 24 hours. If you need immediate assistance, feel free to call us.
            </p>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #262626;">
              <a href="tel:+12255551234" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                Call (225) 555-1234
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #525252; font-size: 12px; margin: 0;">
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
        to: [email.trim()], // Use original email for delivery
        subject: "We received your message!",
        html: customerEmailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Contact emails sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending contact email:", error);
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
