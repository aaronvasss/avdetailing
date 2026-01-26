import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
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

// Format date for display
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

interface ReminderRequest {
  reminderType: "24h" | "2h" | "custom";
  bookingId?: string; // Send reminder for specific booking
  sendAll?: boolean;  // Send all due reminders (for cron job)
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Extract and verify Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create Supabase client with user's auth context for auth verification
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // 3. Verify user is authenticated using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    // 4. Check admin/staff role in user_roles table
    const { data: roleData, error: roleError } = await userSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "staff"])
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin or staff access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Parse request body
    const body: ReminderRequest = await req.json();

    // 6. Apply rate limiting based on operation type
    const rateLimitKey = body.sendAll ? `reminder_all_${userId}` : `reminder_${userId}`;
    const maxRequests = body.sendAll ? 2 : 20; // Stricter limit for mass sends
    const windowMs = body.sendAll ? 300000 : 60000; // 5 min for sendAll, 1 min for single
    
    if (!checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded - Please wait before sending more reminders" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Audit log
    console.log(`Reminder SMS invoked by user ${userId} (${userEmail}), sendAll: ${body.sendAll}, bookingId: ${body.bookingId}`);

    // Use service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const results: any[] = [];
    const now = new Date();
    
    if (body.sendAll) {
      // Calculate time windows for 24h and 2h reminders
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0];
      
      const todayDate = now.toISOString().split("T")[0];

      // Fetch upcoming bookings that need reminders
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "confirmed")
        .in("scheduled_date", [todayDate, tomorrowDate])
        .order("scheduled_date", { ascending: true });

      if (error) {
        console.error("Error fetching bookings:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch bookings" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const booking of bookings || []) {
        const phone = booking.guest_phone;
        if (!phone) continue;

        const customerName = booking.guest_name?.split(" ")[0] || "there";
        const formattedDate = formatDate(booking.scheduled_date);
        const address = `${booking.service_address}, ${booking.service_city}`;

        // Determine reminder type based on timing
        const bookingDateTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
        const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        let message = "";
        let reminderType = "";

        if (hoursUntil > 20 && hoursUntil <= 28) {
          // 24-hour reminder
          reminderType = "24h";
          message = `Hey ${customerName}! 👋

Your AV Detailing appointment is TOMORROW:

📅 ${formattedDate}
⏰ ${booking.scheduled_time}
📍 ${address}

✅ Please ensure vehicle is accessible
✅ Clear the area around the vehicle
✅ Remove personal items

Questions? Reply or call (225) 521-6264.

See you soon!
-AV Detailing`;
        } else if (hoursUntil > 1.5 && hoursUntil <= 3) {
          // 2-hour reminder
          reminderType = "2h";
          message = `🚗 AV Detailing arriving in ~2 hours!

📍 ${address}
⏰ ${booking.scheduled_time}

We'll text when we're on our way!

-AV Detailing`;
        }

        if (message) {
          const result = await sendTwilioSms(phone, message);
          results.push({
            bookingId: booking.id,
            reminderType,
            phone,
            ...result,
          });
        }
      }
    } else if (body.bookingId) {
      // Validate bookingId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(body.bookingId)) {
        return new Response(
          JSON.stringify({ error: "Invalid booking ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send reminder for specific booking
      const { data: booking, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", body.bookingId)
        .single();

      if (error || !booking) {
        return new Response(
          JSON.stringify({ error: "Booking not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const phone = booking.guest_phone;
      if (!phone) {
        return new Response(
          JSON.stringify({ error: "No phone number for this booking" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const customerName = booking.guest_name?.split(" ")[0] || "there";
      const formattedDate = formatDate(booking.scheduled_date);
      const address = `${booking.service_address}, ${booking.service_city}`;

      let message = "";
      if (body.reminderType === "24h") {
        message = `Hey ${customerName}! 👋

Your AV Detailing appointment is TOMORROW:

📅 ${formattedDate}
⏰ ${booking.scheduled_time}
📍 ${address}

✅ Please ensure vehicle is accessible
✅ Clear the area around the vehicle
✅ Remove personal items

Questions? Reply or call (225) 521-6264.

See you soon!
-AV Detailing`;
      } else if (body.reminderType === "2h") {
        message = `🚗 AV Detailing arriving in ~2 hours!

📍 ${address}
⏰ ${booking.scheduled_time}

We'll text when we're on our way!

-AV Detailing`;
      }

      if (message) {
        const result = await sendTwilioSms(phone, message);
        results.push({ bookingId: booking.id, ...result });
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Missing required field: bookingId or sendAll" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent: results.length,
        results 
      }),
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
