import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SERVICE_TYPES = new Set([
  "car-detailing",
  "paint-correction",
  "aircraft-detailing",
  "boat-detailing",
  "rv-detailing",
  "ceramic-coating",
]);

const ALLOWED_VEHICLE_CATEGORIES = new Set([
  "car",
  "suv5",
  "large",
  "car-suv5",
]);

function isSafeString(v: unknown, max = 64): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max && /^[a-zA-Z0-9_-]+$/.test(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { serviceType, packageSlug, vehicleCategory } = body ?? {};

    if (
      !isSafeString(serviceType) ||
      !ALLOWED_SERVICE_TYPES.has(serviceType) ||
      !isSafeString(packageSlug) ||
      !isSafeString(vehicleCategory) ||
      !ALLOWED_VEHICLE_CATEGORIES.has(vehicleCategory)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid request parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: prices, error } = await supabase
      .from("stripe_prices")
      .select("stripe_price_id, vehicle_type")
      .eq("service_type", serviceType)
      .eq("package_name", packageSlug)
      .eq("is_active", true);

    if (error) {
      console.error("lookup-stripe-price db error", error);
      return new Response(JSON.stringify({ error: "Lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!prices || prices.length === 0) {
      return new Response(JSON.stringify({ stripe_price_id: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exact = prices.find((p) => p.vehicle_type === vehicleCategory);
    const fallback = prices.find((p) => p.vehicle_type === "car-suv5");
    const result = exact?.stripe_price_id ?? fallback?.stripe_price_id ?? prices[0].stripe_price_id;

    return new Response(JSON.stringify({ stripe_price_id: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lookup-stripe-price error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
