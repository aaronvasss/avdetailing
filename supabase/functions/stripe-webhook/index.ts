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
        const flowType = session.metadata?.flow_type;
        const quoteId = session.metadata?.quote_id;

        // Handle specialty deposit flow (Boat, Aircraft, Ceramic Coating, Paint Correction)
        if (session.mode === 'payment' && flowType === 'specialty_deposit' && quoteId) {
          logStep("Processing specialty deposit payment", { quoteId });

          // Update quote status to deposit_paid
          await supabase
            .from("quotes")
            .update({
              status: 'deposit_paid',
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_checkout_session_id: session.id,
            })
            .eq("id", quoteId);

          // Create payment record
          await supabase.from("payment_records").insert({
            amount_cents: session.amount_total || 10000,
            payment_type: 'deposit',
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_checkout_session_id: session.id,
            stripe_customer_id: session.customer as string || null,
            metadata: {
              quote_id: quoteId,
              service_type: session.metadata?.service_type,
              flow_type: 'specialty_deposit',
            },
          });

          // Send confirmation email to customer
          const customerEmail = session.metadata?.customer_email || session.customer_email;
          const customerName = session.metadata?.customer_name || 'Customer';

          if (customerEmail) {
            try {
              const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
              const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

              await fetch(`${supabaseUrl}/functions/v1/send-contact-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                  to: customerEmail,
                  subject: `Deposit Confirmed — ${session.metadata?.service_type}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #dc2626;">AV Detailing 🚗</h2>
                      <p style="color: #22c55e; font-weight: bold;">Deposit Confirmed</p>
                      <p>Hi ${customerName.split(' ')[0]},</p>
                      <p>Your $100 deposit for <strong>${session.metadata?.service_type}</strong> has been received!</p>
                      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Service</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${session.metadata?.service_type}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Vehicle</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.vehicle_details || 'N/A'}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Preferred Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.preferred_date || 'TBD'}</td></tr>
                        ${session.metadata?.preferred_time ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Preferred Time</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.preferred_time}</td></tr>` : ''}
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Deposit Paid</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #22c55e;">$100.00</td></tr>
                      </table>
                      <p style="color: #666;">The remaining balance will be determined after our on-site inspection. We'll reach out to confirm your appointment details.</p>
                      <p style="margin-top: 24px;">Questions? Call us at <a href="tel:+12255216264">(225) 521-6264</a></p>
                    </div>
                  `,
                }),
              });
              logStep("Customer deposit confirmation email sent", { email: customerEmail });
            } catch (emailErr) {
              logStep("Failed to send customer deposit email", { error: emailErr });
            }
          }

          // Send internal notification to business
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
            const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

            await fetch(`${supabaseUrl}/functions/v1/send-contact-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                to: "aaronvasquez100@gmail.com",
                subject: `💰 New $100 Deposit — ${session.metadata?.service_type}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Specialty Service Deposit</h2>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Customer</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${customerName}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${customerEmail}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.customer_phone || 'Not provided'}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.service_type}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Vehicle</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.vehicle_details || 'N/A'}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Preferred Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.preferred_date || 'TBD'}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Preferred Time</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${session.metadata?.preferred_time || 'Not specified'}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Deposit</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: green; font-weight: bold;">$100.00 PAID</td></tr>
                    </table>
                    <p>Quote ID: ${quoteId}</p>
                  </div>
                `,
              }),
            });
            logStep("Business notification sent for deposit");
          } catch (bizErr) {
            logStep("Failed to send business deposit notification", { error: bizErr });
          }

          logStep("Specialty deposit flow completed", { quoteId });
          break;
        }

        // Handle tip payments
        if (session.mode === 'payment' && session.metadata?.payment_type === 'tip') {
          const tipBookingId = session.metadata?.booking_id;
          const tipAmount = session.amount_total || 0;
          logStep("Processing tip payment", { tipBookingId, tipAmount });

          await supabase.from("payment_records").insert({
            amount_cents: tipAmount,
            payment_type: 'tip',
            status: 'paid',
            booking_id: tipBookingId || null,
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_checkout_session_id: session.id,
            stripe_customer_id: session.customer as string || null,
            metadata: {
              booking_id: tipBookingId,
              payment_type: 'tip',
            },
          });

          logStep("Tip payment recorded", { tipBookingId, tipAmount });
          break;
        }

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
              user_id,
              service_id,
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

            if (bookingData) {
              // Resolve customer contact info: use guest fields, or look up profile for logged-in users
              let customerEmail = bookingData.guest_email || session.customer_email;
              let customerName = bookingData.guest_name?.split(' ')[0] || 'Customer';
              let customerPhone = bookingData.guest_phone;

              if (bookingData.user_id && (!customerEmail || !customerPhone)) {
                try {
                  const { data: profile } = await supabase
                    .from("profiles")
                    .select("full_name, email, phone")
                    .eq("user_id", bookingData.user_id)
                    .single();

                  if (profile) {
                    if (!customerEmail && profile.email) customerEmail = profile.email;
                    if (!customerPhone && profile.phone) customerPhone = profile.phone;
                    if (customerName === 'Customer' && profile.full_name) {
                      customerName = profile.full_name.split(' ')[0];
                    }
                    logStep("Resolved contact from profile", { 
                      hasEmail: !!customerEmail, hasPhone: !!customerPhone, name: customerName 
                    });
                  }
                } catch (profileErr) {
                  logStep("Profile lookup failed", { error: profileErr });
                }
              }

              // Send confirmation email + admin alert via unified notification function
              try {
                await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-booking-notifications`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    booking_id: bookingData.id,
                    mode: "auto",
                  }),
                });
                logStep("Booking notifications triggered");
              } catch (emailErr) {
                logStep("Notification trigger failed", { error: emailErr });
              }

              // Resolve package name from service_packages for friendlier messaging
              let packageName: string | null = null;
              try {
                if ((bookingData as any).service_id && bookingData.vehicle_type) {
                  const { data: pkg } = await supabase
                    .from("service_packages")
                    .select("name")
                    .eq("service_id", (bookingData as any).service_id)
                    .eq("vehicle_type", bookingData.vehicle_type)
                    .eq("is_active", true)
                    .maybeSingle();
                  packageName = (pkg as any)?.name || null;
                }
              } catch (_e) { /* ignore */ }

              const displayService = packageName || (bookingData.services as any)?.name || 'Detailing Service';

              // Send SMS notification
              try {
                if (customerPhone) {
                  await supabase.functions.invoke('send-booking-sms', {
                    body: {
                      customerPhone,
                      customerName,
                      serviceName: displayService,
                      scheduledDate: bookingData.scheduled_date,
                      scheduledTime: bookingData.scheduled_time,
                      serviceAddress: bookingData.service_address,
                      serviceCity: bookingData.service_city,
                      totalPrice: bookingData.total_price,
                      bookingId: bookingData.id,
                      notifyBusiness: true,
                    },
                  });
                  logStep("SMS notification triggered", { packageName });
                } else {
                  logStep("No phone number available for SMS", { userId: bookingData.user_id });
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

        if (session.mode === 'subscription') {
          const signupId = session.metadata?.signup_id;
          const membershipPlanId = session.metadata?.membership_plan_id;
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const customerEmail = session.customer_email || session.customer_details?.email;

          logStep("Processing subscription", { signupId, membershipPlanId, subscriptionId, customerId, customerEmail });

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          let userId = session.metadata?.user_id || null;

          // If this came from a membership signup flow (has signup_id), create user account
          if (signupId && customerEmail) {
            // Look up signup info
            const { data: signupData } = await supabase
              .from("membership_signups")
              .select("*")
              .eq("id", signupId)
              .single();

            if (signupData) {
              logStep("Found signup data", { email: signupData.email });

              // Check if user already exists
              const { data: existingUsers } = await supabase.auth.admin.listUsers();
              const existingUser = existingUsers?.users?.find(u => u.email === signupData.email);

              if (existingUser) {
                userId = existingUser.id;
                logStep("User already exists", { userId });
              } else {
                // Create user via invite (sends email with password setup link)
                const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
                  signupData.email,
                  {
                    data: {
                      full_name: `${signupData.first_name} ${signupData.last_name}`,
                    },
                    redirectTo: 'https://avdetailing.net/account?tab=memberships',
                  }
                );

                if (inviteError) {
                  logStep("User invite failed", { error: inviteError });
                } else {
                  userId = inviteData.user?.id || null;
                  logStep("User created via invite", { userId });
                }
              }

              // Update profile with additional info
              if (userId) {
                await supabase
                  .from("profiles")
                  .update({
                    full_name: `${signupData.first_name} ${signupData.last_name}`,
                    phone: signupData.phone,
                    stripe_customer_id: customerId,
                  })
                  .eq("user_id", userId);

                // Create customer address if provided
                if (signupData.service_address) {
                  await supabase
                    .from("customer_addresses")
                    .insert({
                      user_id: userId,
                      street_address: signupData.service_address,
                      city: signupData.service_city || '',
                      zip_code: signupData.service_zip || '',
                      is_default: true,
                    });
                  logStep("Customer address created");
                }

                // Create customer vehicle if provided
                if (signupData.vehicle_type) {
                  await supabase
                    .from("customer_vehicles")
                    .insert({
                      user_id: userId,
                      vehicle_type: signupData.vehicle_type,
                      make: signupData.vehicle_make,
                      model: signupData.vehicle_model,
                      year: signupData.vehicle_year,
                      is_default: true,
                    });
                  logStep("Customer vehicle created");
                }
              }

              // Update signup record
              await supabase
                .from("membership_signups")
                .update({ status: 'completed', created_user_id: userId })
                .eq("id", signupId);
            }
          }

          // Create/update membership record
          if (userId && membershipPlanId) {
            const { error } = await supabase
              .from("customer_memberships")
              .insert({
                user_id: userId,
                membership_plan_id: membershipPlanId,
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              });

            if (error) {
              logStep("Error creating membership", { error });
            } else {
              logStep("Membership created", { userId, membershipPlanId });
            }

            // Update profile with stripe_customer_id
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
