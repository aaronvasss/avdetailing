import type Stripe from 'https://esm.sh/stripe@18.5.0';
export async function syncPortalCharge(db: any, stripe: Stripe, intent: Stripe.PaymentIntent) {
  const requestId = intent.metadata.portal_charge_id;
  if (!requestId) return;
  const { data: request, error } = await db.from('portal_charge_requests').select('*').eq('id', requestId).single();
  if (error || !request || request.amount_cents !== intent.amount || intent.metadata.booking_id !== request.booking_id || intent.metadata.user_id !== request.user_id) throw new Error('Charge reconciliation failed');
  let receiptUrl = null;
  if (intent.latest_charge) {
    const charge = await stripe.charges.retrieve(typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge.id);
    receiptUrl = charge.receipt_url;
  }
  const { error: updateError } = await db.from('portal_charge_requests').update({ status: intent.status, stripe_payment_intent_id: intent.id, receipt_url: receiptUrl, updated_at: new Date().toISOString() }).eq('id', request.id);
  if (updateError) throw updateError;
  if (intent.status !== 'succeeded') return;
  const { error: recordError } = await db.from('payment_records').upsert({ id: request.id, user_id: request.user_id, booking_id: request.booking_id, stripe_payment_intent_id: intent.id, stripe_customer_id: intent.customer, amount_cents: intent.amount, currency: intent.currency, status: 'succeeded', payment_type: 'balance', receipt_url: receiptUrl, metadata: { portal_charge_id: request.id, service_amount_cents: request.service_amount_cents } }, { onConflict: 'id' });
  if (recordError) throw recordError;
  const { error: bookingError } = await db.from('bookings').update({ payment_status: 'paid', payment_method: 'online', stripe_payment_intent_id: intent.id }).eq('id', request.booking_id).eq('user_id',request.user_id);
  if (bookingError) throw bookingError;
}