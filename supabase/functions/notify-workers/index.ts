import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify service role authorization with exact-equality match
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { type, booking_id, service_name, customer_name, scheduled_date, scheduled_time, address } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active worker user_ids
    const { data: workers } = await supabase
      .from("worker_profiles")
      .select("user_id")
      .eq("is_active", true);

    // Also get admin user_ids
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const allUserIds = new Set<string>();
    (workers || []).forEach((w) => allUserIds.add(w.user_id));
    (admins || []).forEach((a) => allUserIds.add(a.user_id));

    if (allUserIds.size === 0) {
      return new Response(JSON.stringify({ success: true, message: "No workers to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = customer_name?.split(" ")[0] || "Customer";

    let title = "";
    let body = "";

    if (type === "new_booking") {
      title = "New Job Assigned! 🚗";
      body = `${service_name} for ${firstName} on ${scheduled_date} at ${scheduled_time}${address ? ` — ${address}` : ""}`;
    } else if (type === "cancelled") {
      title = "Job Cancelled ❌";
      body = `${service_name} on ${scheduled_date} at ${scheduled_time} has been cancelled.`;
    } else {
      title = "Booking Update";
      body = `${service_name} for ${firstName} has been updated.`;
    }

    // Insert notification for each worker
    const notifications = Array.from(allUserIds).map((user_id) => ({
      user_id,
      title,
      body,
      type: type || "booking",
      booking_id: booking_id || null,
    }));

    const { error } = await supabase.from("worker_notifications").insert(notifications);

    if (error) {
      console.error("Error inserting notifications:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, notified: allUserIds.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to notify workers" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
