import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      // For development, parse without signature verification
      event = JSON.parse(body);
      logStep("Processing without signature verification (dev mode)");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          mode: session.mode,
          metadata: session.metadata 
        });

        const bookingId = session.metadata?.booking_id;
        const userId = session.metadata?.user_id;
        const membershipPlanId = session.metadata?.membership_plan_id;

        if (session.mode === 'payment' && bookingId) {
          // One-time payment for booking
          const { data: bookingData, error } = await supabase
            .from("bookings")
            .update({
              status: "confirmed",
              payment_status: "paid",
              payment_method: "online",
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_checkout_session_id: session.id,
            })
            .eq("id", bookingId)
            .select(`
              id,
              scheduled_date,
              scheduled_time,
              service_address,
              service_city,
              service_zip,
              total_price,
              guest_name,
              guest_email,
              guest_phone,
              vehicle_type,
              vehicle_make,
              vehicle_model,
              manage_token,
              services (name)
            `)
            .single();

          if (error) {
            logStep("Error updating booking", { error });
          } else {
            logStep("Booking confirmed", { bookingId });

            // Send confirmation email via edge function
            if (bookingData) {
              try {
                const customerEmail = bookingData.guest_email || session.customer_email;
                const customerName = bookingData.guest_name?.split(' ')[0] || 'Customer';
                
                // Trigger confirmation email
                await supabase.functions.invoke('send-booking-confirmation', {
                  body: {
                    customerEmail,
                    customerName,
                    serviceName: (bookingData.services as any)?.name || 'Detailing Service',
                    scheduledDate: bookingData.scheduled_date,
                    scheduledTime: bookingData.scheduled_time,
                    serviceAddress: bookingData.service_address,
                    serviceCity: bookingData.service_city,
                    serviceState: 'LA',
                    serviceZip: bookingData.service_zip,
                    vehicleType: bookingData.vehicle_type,
                    totalPrice: bookingData.total_price,
                    bookingId: bookingData.id,
                    manageToken: bookingData.manage_token,
                  },
                });
                logStep("Confirmation email triggered");
              } catch (emailErr) {
                logStep("Email trigger failed", { error: emailErr });
              }

              // Trigger SMS notification
              try {
                if (bookingData.guest_phone) {
                  await supabase.functions.invoke('send-booking-sms', {
                    body: {
                      customerPhone: bookingData.guest_phone,
                      customerName: bookingData.guest_name?.split(' ')[0] || 'Customer',
                      serviceName: (bookingData.services as any)?.name || 'Detailing Service',
                      scheduledDate: bookingData.scheduled_date,
                      scheduledTime: bookingData.scheduled_time,
                      serviceAddress: bookingData.service_address,
                      serviceCity: bookingData.service_city,
                      totalPrice: bookingData.total_price,
                      bookingId: bookingData.id,
                      notifyBusiness: true,
                    },
                  });
                  logStep("SMS notification triggered");
                }
              } catch (smsErr) {
                logStep("SMS trigger failed", { error: smsErr });
              }
            }
          }

          // Create payment record
          await supabase.from("payment_records").insert({
            user_id: userId || null,
            booking_id: bookingId,
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_checkout_session_id: session.id,
            stripe_customer_id: session.customer as string,
            amount_cents: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: 'succeeded',
            payment_type: 'booking',
            metadata: session.metadata || {},
          });
          logStep("Payment record created");
        }

        if (session.mode === 'subscription' && membershipPlanId) {
          // Subscription for membership
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Update or create membership
          const { error } = await supabase
            .from("customer_memberships")
            .upsert({
              user_id: userId,
              membership_plan_id: membershipPlanId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: 'user_id,membership_plan_id',
            });

          if (error) {
            logStep("Error upserting membership", { error });
          } else {
            logStep("Membership created/updated", { userId, membershipPlanId });
          }

          // Update profile with stripe_customer_id
          if (userId) {
            await supabase
              .from("profiles")
              .update({ stripe_customer_id: customerId })
              .eq("user_id", userId);
            logStep("Profile updated with customer ID");
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent succeeded", { id: paymentIntent.id });
        // Additional handling if needed
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { id: invoice.id, subscription: invoice.subscription });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // Update membership period
          const { error } = await supabase
            .from("customer_memberships")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription);

          if (error) {
            logStep("Error updating membership period", { error });
          } else {
            logStep("Membership period updated");
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { id: subscription.id, status: subscription.status });

        const { error } = await supabase
          .from("customer_memberships")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Error updating subscription status", { error });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { id: subscription.id });

        const { error } = await supabase
          .from("customer_memberships")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Error marking subscription cancelled", { error });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        logStep("Checkout session expired", { sessionId: session.id, bookingId });

        if (bookingId) {
          // Keep booking as pending_payment for admin review
          await supabase
            .from("bookings")
            .update({ 
              payment_status: "expired"
            })
            .eq("id", bookingId)
            .eq("status", "pending_payment");
          logStep("Booking marked as payment expired", { bookingId });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", { id: paymentIntent.id });
        
        // Find booking by payment intent if exists
        const { data: booking } = await supabase
          .from("bookings")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle();

        if (booking) {
          await supabase
            .from("bookings")
            .update({ payment_status: "failed" })
            .eq("id", booking.id);
          logStep("Booking marked as payment failed", { bookingId: booking.id });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
