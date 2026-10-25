import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { bookingCheckoutCents } from "../_shared/booking-pricing.ts";
import { logEdgeError } from "../_shared/error-log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// In-memory rate limiting (best-effort per-isolate)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

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

  // Rate limit: 10 checkout attempts per IP per hour
  const ip = getClientIp(req);
  if (!checkRateLimit(`create-checkout:${ip}`, 10, 60 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: "Too many checkout attempts. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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

    let baseLineItem: Stripe.Checkout.SessionCreateParams.LineItem | null = null;

    // If booking_id is provided but no price_id, create dynamic price from booking total
    // This is more reliable than looking up stripe_prices since the booking already has
    // the correct total calculated from the selected package + vehicle type
    if (booking_id) {
      price_id = undefined;
      logStep("Looking up booking details", { booking_id });
      
      const bookingSelect = `
          id,
          service_id,
          vehicle_type,
          total_price,
          subtotal,
          add_ons_total,
          guest_email,
          services (slug, name)
        `;

      let { data: booking, error: bookingError } = await serviceClient
        .from("bookings")
        .select(bookingSelect)
        .eq("id", booking_id)
        .maybeSingle();

      // One short retry to rule out a timing gap right after booking creation
      if (!booking && !bookingError) {
        await new Promise((r) => setTimeout(r, 500));
        const retry = await serviceClient
          .from("bookings")
          .select(bookingSelect)
          .eq("id", booking_id)
          .maybeSingle();
        booking = retry.data;
        bookingError = retry.error;
      }

      if (bookingError) {
        logStep("Booking lookup errored", { booking_id, hasSession: !!user, error: bookingError });
        await logEdgeError({
          functionName: "create-checkout",
          code: "booking_lookup_failed",
          message: `Booking lookup failed: ${bookingError.message}`,
          bookingId: booking_id,
          userId: user?.id ?? null,
          context: { hasSession: !!user },
        });
        throw new Error("Booking lookup failed");
      }

      if (!booking) {
        logStep("Booking not found", { booking_id, hasSession: !!user });
        await logEdgeError({
          functionName: "create-checkout",
          code: "booking_not_found",
          severity: "warning",
          message: "Booking no longer exists at checkout",
          bookingId: booking_id,
          userId: user?.id ?? null,
          context: { hasSession: !!user },
        });
        return new Response(
          JSON.stringify({
            code: "booking_not_found",
            error: "This booking no longer exists — please start a new booking.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
        );
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

      // Persisted total is authoritative, including saved add-ons and existing fees/taxes.
      // Do not re-price at checkout or add selected add-ons a second time.
      const amountCents = bookingCheckoutCents(Number(booking.total_price));
      baseLineItem = {
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: { name: metadata?.service_name || `${serviceName} - ${booking.vehicle_type || 'Vehicle'}` },
        },
        quantity: 1,
      };

      if (!price_id && !baseLineItem) throw new Error("Missing price_id and unable to determine from booking");
    } else if (!price_id) {
      throw new Error("Missing price_id and unable to determine from booking");
    }

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
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = baseLineItem
      ? [baseLineItem]
      : [{ price: price_id, quantity: 1 }];

    // Add add-on line items if provided
    if (!booking_id && add_on_ids && add_on_ids.length > 0) {
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
          const addonBasePrice = Number(addon.price);
          const addonTotalCents = Math.round(addonBasePrice * 100);
          if (addonTotalCents > 0) {
            lineItems.push({
              price_data: {
                currency: 'usd',
                unit_amount: addonTotalCents,
                product_data: { name: `${addon.name} (Add-on)` },
              },
              quantity: 1,
            });
            logStep("Added inline add-on line item", { name: addon.name, amountCents: addonTotalCents });
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
    await logEdgeError({
      functionName: "create-checkout",
      code: "checkout_failed",
      severity: "fatal",
      errorId,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : null,
    });
    return new Response(JSON.stringify({ error: "Checkout failed. Please try again.", errorId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
