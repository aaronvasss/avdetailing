import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, token, rating, comment, customer_name } = await req.json();

    if (!booking_id || !token || !rating) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid rating" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the manage_token matches this booking
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id, manage_token")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr || !booking || !booking.manage_token || booking.manage_token !== token) {
      return new Response(JSON.stringify({ error: "Invalid or expired link" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent duplicate ratings
    const { data: existing } = await supabase
      .from("booking_ratings")
      .select("id")
      .eq("booking_id", booking_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Rating already submitted" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await supabase.from("booking_ratings").insert({
      booking_id,
      rating,
      comment: comment ? String(comment).slice(0, 2000) : null,
      customer_name: customer_name ? String(customer_name).slice(0, 200) : null,
    });

    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
