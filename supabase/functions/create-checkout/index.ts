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

// Map package slug + vehicle sub-type to exact Stripe product names
function getStripeProductName(packageSlug: string, vehicleSubType: string, vehicleTypeLabel: string): string {
  const isLarge = vehicleSubType === 'suv-8' || vehicleSubType === 'truck' ||
    vehicleTypeLabel?.includes('8 seats') || vehicleTypeLabel?.includes('3-row') ||
    vehicleTypeLabel?.toLowerCase() === 'truck';
  const isSuv5 = vehicleSubType === 'suv-5' || vehicleTypeLabel?.includes('5 seats');

  const nameMap: Record<string, { carSuv5: string; suv5?: string; large: string }> = {
    'exterior-only': { carSuv5: 'Exterior Only - Car/SUV-5', large: 'Exterior Only - Large' },
    'basic': { carSuv5: 'Basic Detail - Car/SUV-5', large: 'Basic Detail - Large' },
    'silver': { carSuv5: 'Silver Detail - Car', suv5: 'Silver Detail - SUV-5', large: 'Silver Detail - Large' },
    'gold': { carSuv5: 'Gold Detail - Car/SUV-5', large: 'Gold Detail - Large' },
  };

  const mapping = nameMap[packageSlug];
  if (!mapping) return `${packageSlug} - ${vehicleTypeLabel || 'Vehicle'}`;

  if (isLarge) return mapping.large;
  if (isSuv5 && mapping.suv5) return mapping.suv5;
  return mapping.carSuv5;
}

interface CheckoutRequest {
  booking_id?: string;
  membership_plan_id?: string;
  price_id?: string;
  mode: 'payment' | 'subscription';
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, string>;
  add_on_ids?: string[];
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
    let { booking_id, membership_plan_id, price_id, mode, success_url, cancel_url, metadata, add_on_ids } = body;

    logStep("Request parsed", { price_id, mode, booking_id, membership_plan_id, add_on_ids });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // If booking_id is provided but no price_id, create dynamic price from booking total
    // This is more reliable than looking up stripe_prices since the booking already has
    // the correct total calculated from the selected package + vehicle type
    if (booking_id && !price_id) {
      logStep("Looking up booking details", { booking_id });
      
      const { data: booking, error: bookingError } = await serviceClient
        .from("bookings")
        .select(`
          id,
          service_id,
          vehicle_type,
          total_price,
          subtotal,
          add_ons_total,
          guest_email,
          services (slug, name)
        `)
        .eq("id", booking_id)
        .single();

      if (bookingError || !booking) {
        logStep("Booking lookup failed", { error: bookingError });
        throw new Error("Booking not found");
      }

      const serviceName = (booking.services as any)?.name || 'Detailing Service';
      
      logStep("Booking found", { 
        service: (booking.services as any)?.slug,
        vehicleType: booking.vehicle_type,
        subtotal: booking.subtotal,
        addOnsTotal: booking.add_ons_total,
        totalPrice: booking.total_price
      });

      // Use guest email if no user email
      if (!userEmail && booking.guest_email) {
        userEmail = booking.guest_email;
      }

      // SECURITY: Recalculate base price from service_packages or services table
      // Never trust stored booking prices for payment amount
      const packageSlug = metadata?.package_slug || '';
      const vehicleSubType = metadata?.vehicle_sub_type || '';
      const vehicleType = booking.vehicle_type || '';

      let serverBasePrice = 0;
      let packageStripePriceId: string | null = null;

      if (packageSlug && (vehicleSubType || vehicleType)) {
        // Look up exact price from service_packages
        const packageVehicleType = vehicleSubType || vehicleType;
        const { data: pkg } = await serviceClient
          .from("service_packages")
          .select("price, stripe_price_id")
          .eq("service_id", booking.service_id)
          .eq("slug", packageSlug)
          .eq("vehicle_type", packageVehicleType)
          .eq("is_active", true)
          .single();

        if (pkg) {
          serverBasePrice = Number(pkg.price);
          packageStripePriceId = pkg.stripe_price_id || null;
          logStep("Price validated from service_packages", { serverBasePrice, packageSlug, packageVehicleType, packageStripePriceId });
        }
      }

      // If service_packages has a stripe_price_id, use it directly (price already finalized in Stripe)
      if (packageStripePriceId) {
        price_id = packageStripePriceId;
        logStep("Using stripe_price_id from service_packages directly", { price_id });
      }

      // Fallback to services.base_price if no package match
      if (serverBasePrice <= 0) {
        const { data: svc } = await serviceClient
          .from("services")
          .select("base_price")
          .eq("id", booking.service_id)
          .single();
        serverBasePrice = Number(svc?.base_price || 0);
        logStep("Price fallback to services.base_price", { serverBasePrice });
      }

      const basePrice = serverBasePrice;
      
      if (!price_id && basePrice > 0) {
        // No static stripe_price_id; create dynamic price including 3.5% processing fee
        const processingFee = Math.round(basePrice * 0.035 * 100) / 100;
        const baseWithFee = basePrice + processingFee;
        const amountCents = Math.round(baseWithFee * 100);

        logStep("Creating dynamic price for base service", { basePrice, processingFee, amountCents });

        const productName = packageSlug
          ? getStripeProductName(packageSlug, vehicleSubType, booking.vehicle_type || '')
          : `${serviceName} - ${booking.vehicle_type || 'Vehicle'}`;

        logStep("Stripe product name", { productName, packageSlug, vehicleSubType });

        const dynamicPrice = await stripe.prices.create({
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: productName,
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

    const origin = req.headers.get("origin") || "https://avdetailing.net";

    // Build session metadata
    const sessionMetadata: Record<string, string> = {
      ...metadata,
    };
    if (user?.id) sessionMetadata.user_id = user.id;
    if (booking_id) sessionMetadata.booking_id = booking_id;
    if (membership_plan_id) sessionMetadata.membership_plan_id = membership_plan_id;

    // Build line items: base service + add-ons
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: price_id, quantity: 1 }
    ];

    // Add add-on line items if provided
    if (add_on_ids && add_on_ids.length > 0) {
      logStep("Looking up add-on Stripe prices", { add_on_ids });
      const { data: addOns, error: addOnError } = await serviceClient
        .from("service_add_ons")
        .select("id, name, price, stripe_price_id")
        .in("id", add_on_ids)
        .eq("is_active", true);

      if (addOnError) {
        logStep("Add-on lookup error", { error: addOnError });
      }

      if (addOns && addOns.length > 0) {
        for (const addon of addOns) {
          if (addon.stripe_price_id) {
            lineItems.push({ price: addon.stripe_price_id, quantity: 1 });
            logStep("Added add-on line item", { name: addon.name, price_id: addon.stripe_price_id });
          } else {
            // Create dynamic price for add-on without a Stripe price ID (include 3.5% processing fee)
            const addonBasePrice = Number(addon.price);
            const addonFee = Math.round(addonBasePrice * 0.035 * 100) / 100;
            const addonTotalCents = Math.round((addonBasePrice + addonFee) * 100);
            const addonPrice = await stripe.prices.create({
              currency: 'usd',
              unit_amount: addonTotalCents,
              product_data: { name: `${addon.name} (Add-on)` },
            });
            lineItems.push({ price: addonPrice.id, quantity: 1 });
            logStep("Created dynamic add-on price", { name: addon.name, price_id: addonPrice.id });
          }
        }
        // Add add-on names to metadata
        sessionMetadata.add_ons = addOns.map(a => a.name).join(', ');
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail || undefined,
      line_items: lineItems,
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
    const errorId = crypto.randomUUID();
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { errorId, message: errorMessage });
    return new Response(JSON.stringify({ error: "Checkout failed. Please try again.", errorId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
