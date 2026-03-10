import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MEMBERSHIP-CHECKOUT] ${step}${detailsStr}`);
};

// Stripe price IDs for membership products
const MEMBERSHIP_PRICE_IDS: Record<string, string> = {
  'monthly': 'price_1T9JXHDr7pQ6grsf5c9r4ToG',
  'bi-weekly': 'price_1StucDDr7pQ6grsfg53qnHOr',
  'weekly-premium': 'price_1StucEDr7pQ6grsfrIHZe5Zo',
};

interface MembershipCheckoutRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  service_address?: string;
  service_city?: string;
  service_zip?: string;
  vehicle_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number | null;
  membership_plan_id: string;
  plan_slug: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: MembershipCheckoutRequest = await req.json();
    logStep("Request parsed", { email: body.email, plan_slug: body.plan_slug });

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email || !body.membership_plan_id || !body.plan_slug) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the correct Stripe price ID
    const priceId = MEMBERSHIP_PRICE_IDS[body.plan_slug];
    if (!priceId) {
      logStep("Invalid plan slug", { slug: body.plan_slug });
      return new Response(JSON.stringify({ error: "Invalid membership plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save signup info to membership_signups table
    const { data: signup, error: signupError } = await serviceClient
      .from("membership_signups")
      .insert({
        first_name: body.first_name.slice(0, 100),
        last_name: body.last_name.slice(0, 100),
        email: body.email.trim().slice(0, 255),
        phone: body.phone?.slice(0, 20) || null,
        service_address: body.service_address?.slice(0, 200) || null,
        service_city: body.service_city?.slice(0, 100) || null,
        service_zip: body.service_zip?.slice(0, 10) || null,
        vehicle_type: body.vehicle_type?.slice(0, 50) || null,
        vehicle_make: body.vehicle_make?.slice(0, 50) || null,
        vehicle_model: body.vehicle_model?.slice(0, 50) || null,
        vehicle_year: body.vehicle_year || null,
        membership_plan_id: body.membership_plan_id,
        status: 'pending',
      })
      .select("id")
      .single();

    if (signupError) {
      logStep("Signup insert failed", { error: signupError });
      throw new Error("Failed to save signup info");
    }

    logStep("Signup saved", { signupId: signup.id });

    // Create Stripe checkout session
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: body.email.trim(), limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://avdetailing.net";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : body.email.trim(),
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/memberships?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/memberships?canceled=true`,
      metadata: {
        signup_id: signup.id,
        membership_plan_id: body.membership_plan_id,
        plan_slug: body.plan_slug,
        customer_name: `${body.first_name} ${body.last_name}`,
      },
    });

    // Update signup with checkout session ID
    await serviceClient
      .from("membership_signups")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", signup.id);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { errorId, message: errorMessage });
    return new Response(JSON.stringify({ error: "Checkout failed. Please try again.", errorId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
