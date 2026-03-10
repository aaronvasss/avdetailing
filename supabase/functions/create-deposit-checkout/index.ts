import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEPOSIT_PRICE_ID = "price_1StmLIDr7pQ6grsf1V0Mc2cl"; // $100 Aircraft Detailing Deposit

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEPOSIT-CHECKOUT] ${step}${detailsStr}`);
};

interface DepositCheckoutRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  service_address?: string;
  service_city?: string;
  service_zip?: string;
  vehicle_details: string;
  condition_description?: string;
  preferred_date: string;
  preferred_time?: string;
  service_type: string;
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

    const body: DepositCheckoutRequest = await req.json();
    logStep("Request parsed", { email: body.email, service: body.service_type });

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email || !body.vehicle_details || !body.preferred_date || !body.service_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the matching service in the DB
    const serviceSlugMap: Record<string, string> = {
      "Boat Detailing": "boat-detailing",
      "Aircraft Detailing": "aircraft-detailing",
      "Ceramic Coating": "ceramic-coating",
      "Paint Correction": "paint-correction",
    };
    const serviceSlug = serviceSlugMap[body.service_type];

    let serviceId: string | null = null;
    if (serviceSlug) {
      const { data: svc } = await serviceClient
        .from("services")
        .select("id")
        .eq("slug", serviceSlug)
        .single();
      serviceId = svc?.id || null;
    }

    // Create a quote record to track this deposit booking
    const { data: quote, error: quoteError } = await serviceClient
      .from("quotes")
      .insert({
        guest_name: `${body.first_name.slice(0, 100)} ${body.last_name.slice(0, 100)}`,
        guest_email: body.email.trim().slice(0, 255),
        guest_phone: body.phone?.slice(0, 20) || null,
        service_type: body.service_type,
        vehicle_details: body.vehicle_details.slice(0, 500),
        customer_notes: body.condition_description?.slice(0, 1000) || null,
        service_address: body.service_address?.slice(0, 200) || null,
        service_city: body.service_city?.slice(0, 100) || null,
        service_zip: body.service_zip?.slice(0, 10) || null,
        deposit_required: true,
        deposit_amount: 100,
        status: 'pending',
        internal_notes: `Preferred date: ${body.preferred_date}${body.preferred_time ? ` at ${body.preferred_time}` : ''}`,
      })
      .select("id")
      .single();

    if (quoteError) {
      logStep("Quote insert failed", { error: quoteError });
      throw new Error("Failed to save booking info");
    }

    logStep("Quote saved", { quoteId: quote.id });

    // Create Stripe checkout session for $100 deposit
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

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
      line_items: [{ price: DEPOSIT_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/booking/success?deposit=true&quote_id=${quote.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/canceled?deposit=true`,
      metadata: {
        quote_id: quote.id,
        service_type: body.service_type,
        customer_name: `${body.first_name} ${body.last_name}`,
        customer_email: body.email.trim(),
        customer_phone: body.phone || '',
        vehicle_details: body.vehicle_details.slice(0, 200),
        preferred_date: body.preferred_date,
        preferred_time: body.preferred_time || '',
        flow_type: 'specialty_deposit',
      },
    });

    // Update quote with checkout session ID
    await serviceClient
      .from("quotes")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", quote.id);

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
