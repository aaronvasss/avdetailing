import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

interface CheckoutRequest {
  booking_id?: string;
  membership_plan_id?: string;
  price_id?: string;
  mode: 'payment' | 'subscription';
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for authenticated user (optional for guest checkout)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    let userEmail = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData.user;
      userEmail = user?.email;
      logStep("User authenticated", { userId: user?.id, email: userEmail });
    }

    const body: CheckoutRequest = await req.json();
    let { booking_id, membership_plan_id, price_id, mode, success_url, cancel_url, metadata } = body;

    logStep("Request parsed", { price_id, mode, booking_id, membership_plan_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // If booking_id is provided but no price_id, look up from database
    if (booking_id && !price_id) {
      logStep("Looking up booking details", { booking_id });
      
      const { data: booking, error: bookingError } = await serviceClient
        .from("bookings")
        .select(`
          id,
          service_id,
          vehicle_type,
          total_price,
          guest_email,
          services (slug, name)
        `)
        .eq("id", booking_id)
        .single();

      if (bookingError || !booking) {
        logStep("Booking lookup failed", { error: bookingError });
        throw new Error("Booking not found");
      }

      logStep("Booking found", { 
        service: (booking.services as any)?.slug,
        vehicleType: booking.vehicle_type,
        totalPrice: booking.total_price
      });

      // Use guest email if no user email
      if (!userEmail && booking.guest_email) {
        userEmail = booking.guest_email;
      }

      // Determine service type and vehicle category for stripe_prices lookup
      const serviceSlug = (booking.services as any)?.slug;
      const vehicleType = booking.vehicle_type?.toLowerCase() || '';
      
      // Map service slug to stripe service type
      const serviceTypeMap: Record<string, string> = {
        'full-detail': 'car-detailing',
        'paint-correction': 'paint-correction',
        'ceramic-coating': 'ceramic-coating',
        'boat-detail': 'boat-detailing',
        'rv-detail': 'rv-detailing',
        'aircraft-detail': 'aircraft-detailing',
      };
      const stripeServiceType = serviceTypeMap[serviceSlug] || serviceSlug;

      // Map vehicle type to price category
      let vehicleCategory = 'car-suv5';
      if (vehicleType.includes('suv-8') || vehicleType.includes('truck') || vehicleType.includes('large')) {
        vehicleCategory = 'large';
      } else if (vehicleType.includes('suv') && vehicleType.includes('5')) {
        vehicleCategory = 'suv5';
      } else if (vehicleType.includes('sedan') || vehicleType.includes('car') || vehicleType.includes('coupe')) {
        vehicleCategory = 'car';
      }

      logStep("Mapped types", { stripeServiceType, vehicleCategory });

      // Query stripe_prices table for matching price
      const { data: prices, error: priceError } = await serviceClient
        .from("stripe_prices")
        .select("stripe_price_id, price_cents, package_name, vehicle_type")
        .eq("service_type", stripeServiceType)
        .eq("is_active", true);

      if (priceError) {
        logStep("Price lookup error", { error: priceError });
      }

      if (prices && prices.length > 0) {
        // Try exact vehicle match first
        let matchedPrice = prices.find(p => p.vehicle_type === vehicleCategory);
        
        // Fallback to car-suv5
        if (!matchedPrice) {
          matchedPrice = prices.find(p => p.vehicle_type === 'car-suv5');
        }
        
        // Just use first available
        if (!matchedPrice) {
          matchedPrice = prices[0];
        }

        if (matchedPrice) {
          price_id = matchedPrice.stripe_price_id;
          logStep("Price found from database", { 
            price_id,
            package: matchedPrice.package_name,
            vehicle: matchedPrice.vehicle_type,
            cents: matchedPrice.price_cents
          });
        }
      }

      // If still no price_id, create a dynamic price based on booking total
      if (!price_id && booking.total_price) {
        logStep("Creating dynamic price for booking total", { total: booking.total_price });
        
        // Add 3.5% processing fee
        const processingFee = Math.round(booking.total_price * 0.035 * 100) / 100;
        const totalWithFee = booking.total_price + processingFee;
        const amountCents = Math.round(totalWithFee * 100);

        const dynamicPrice = await stripe.prices.create({
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `${(booking.services as any)?.name || 'Detailing Service'} - ${booking.vehicle_type || 'Vehicle'}`,
          },
        });

        price_id = dynamicPrice.id;
        logStep("Dynamic price created", { price_id, amountCents });
      }
    }

    if (!price_id) throw new Error("Missing price_id and unable to determine from booking");

    // Check for existing Stripe customer
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "https://avdetailing.lovable.app";

    // Build session metadata
    const sessionMetadata: Record<string, string> = {
      ...metadata,
    };
    if (user?.id) sessionMetadata.user_id = user.id;
    if (booking_id) sessionMetadata.booking_id = booking_id;
    if (membership_plan_id) sessionMetadata.membership_plan_id = membership_plan_id;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail || undefined,
      line_items: [{ price: price_id, quantity: 1 }],
      mode: mode,
      success_url: success_url || `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking_id || ''}`,
      cancel_url: cancel_url || `${origin}/booking/canceled?booking_id=${booking_id || ''}`,
      metadata: sessionMetadata,
    };

    // For subscriptions, allow customer to enter email if not logged in
    if (mode === 'subscription' && !customerId && !userEmail) {
      sessionParams.customer_creation = 'always';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update booking with checkout session ID if provided
    if (booking_id) {
      await serviceClient
        .from("bookings")
        .update({ 
          stripe_checkout_session_id: session.id,
          status: 'pending_payment',
          payment_status: 'pending',
          payment_method: 'online'
        })
        .eq("id", booking_id);
      logStep("Booking updated with session ID", { booking_id });
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
