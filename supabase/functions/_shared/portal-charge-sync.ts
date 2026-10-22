import type Stripe from 'https://esm.sh/stripe@18.5.0';
export async function syncPortalCharge(db: any, stripe: Stripe, intent: Stripe.PaymentIntent) {
  intent=await stripe.paymentIntents.retrieve(intent.id);
  const requestId = intent.metadata.portal_charge_id;
  if (!requestId) return;
  const { data: request, error } = await db.from('portal_charge_requests').select('*').eq('id', requestId).single();
  if (error || !request || request.amount_cents !== intent.amount || intent.metadata.booking_id !== request.booking_id || intent.metadata.user_id !== request.user_id) throw new Error('Charge reconciliation failed');
  let receiptUrl = null;
  if (intent.latest_charge) {
    const charge = await stripe.charges.retrieve(typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge.id);
    receiptUrl = charge.receipt_url;
  }
  const {error:settlementError}=await db.rpc('settle_portal_charge',{_request_id:request.id,_intent_id:intent.id,_status:intent.status,_customer_id:typeof intent.customer==='string'?intent.customer:intent.customer?.id,_amount:intent.amount,_currency:intent.currency,_receipt:receiptUrl});
  if(settlementError)throw settlementError;
  return {status:intent.status,receiptUrl:receiptUrl??request.receipt_url};
}