import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { balanceQuote, authorizationMatches } from '../_shared/portal-payment-rules.ts';
import { syncPortalCharge } from '../_shared/portal-charge-sync.ts';

const schema = z.object({ action: z.enum(['list','setup','complete','default','remove','quote','authorize','revoke','charge']), bookingId: z.string().uuid().optional(), paymentMethodId: z.string().regex(/^pm_[a-zA-Z0-9]+$/).optional(), sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]+$/).optional(), amountCents: z.number().int().positive().optional(), accepted: z.boolean().optional() });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers: {...corsHeaders, 'Content-Type':'application/json'}});
serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers:corsHeaders});
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: auth, error: authError } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer /,''));
    if (authError || !auth.user?.email) return json({error:'Please sign in'},401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({error:'Invalid wallet request'},400);
    const body = parsed.data;
    const user = auth.user;
    const {data: roles, error: roleError} = await db.from('user_roles').select('role').eq('user_id',user.id);
    if (roleError) throw roleError;
    const admin = roles?.some(r => r.role === 'admin');
    if (!admin && roles?.some(r => ['staff','manager','marketing'].includes(r.role))) return json({error:'Customer card access only'},403);
    let booking: any = null;
    let targetId = user.id;
    if (body.bookingId) {
      const {data, error} = await db.from('bookings').select('*').eq('id',body.bookingId).single();
      if (error || !data || (!admin && data.user_id !== user.id)) return json({error:'Appointment unavailable'},403);
      booking = data;
      if (!booking.user_id) return json({error:'Customer must have a linked account'},400);
      targetId = booking.user_id;
    }
    if (body.action === 'charge' && !admin) return json({error:'Administrator required'},403);
    if (['authorize','revoke'].includes(body.action) && targetId !== user.id) return json({error:'Only the customer can approve charges'},403);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {apiVersion:'2025-08-27.basil'});
    const {data: profile, error: profileError} = await db.from('profiles').select('stripe_customer_id,email,full_name').eq('user_id',targetId).single();
    if (profileError || !profile) return json({error:'Customer profile unavailable'},400);
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      // Metadata identity prevents linking another account merely by matching its email.
      if (body.action !== 'setup' || targetId !== user.id) return json({cards:[],defaultId:null, error: body.action === 'list' ? undefined : 'Customer needs to add a card first'});
      const customer = await stripe.customers.create({email:user.email, name:profile.full_name || undefined, metadata:{user_id:user.id}}, {idempotencyKey:`portal-customer-${user.id}`});
      customerId = customer.id;
      const {error} = await db.from('profiles').update({stripe_customer_id:customerId}).eq('user_id',user.id);
      if (error) throw error;
    }
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return json({error:'Card account unavailable'},400);
    const defaultId = typeof customer.invoice_settings.default_payment_method === 'string' ? customer.invoice_settings.default_payment_method : customer.invoice_settings.default_payment_method?.id ?? null;
    if (body.action === 'list') {
      const cards = await stripe.paymentMethods.list({customer:customerId,type:'card'});
      return json({cards:cards.data.map((m:Stripe.PaymentMethod)=>({id:m.id,brand:m.card?.brand,last4:m.card?.last4,expMonth:m.card?.exp_month,expYear:m.card?.exp_year})),defaultId});
    }
    if (body.action === 'setup') {
      if (targetId !== user.id) return json({error:'Customer must add their own card'},403);
      const origin = req.headers.get('origin') || 'https://avdetailing.net';
      const allowed = origin === 'http://localhost:8080' || ['https://avdetailing.net','https://www.avdetailing.net','https://avdetailing.lovable.app'].includes(origin) || /^https:\/\/(?:id-preview--|preview--)[a-z0-9-]+\.lovable\.app$/.test(origin);
      const base = allowed ? origin : 'https://avdetailing.net';
      const view=admin?'&view=client':'';
      const session = await stripe.checkout.sessions.create({mode:'setup',customer:customerId,payment_method_types:['card'],currency:'usd',setup_intent_data:{metadata:{user_id:user.id}},metadata:{flow_type:'portal_card_setup',user_id:user.id},success_url:`${base}/account?tab=payments${view}&card_session={CHECKOUT_SESSION_ID}`,cancel_url:`${base}/account?tab=payments${view}`});
      return json({url:session.url});
    }
    if (body.action === 'complete') {
      if (!body.sessionId || targetId !== user.id) return json({error:'Invalid setup session'},400);
      const session = await stripe.checkout.sessions.retrieve(body.sessionId);
      if (session.customer !== customerId || session.mode !== 'setup' || session.status !== 'complete' || session.metadata?.user_id !== user.id) return json({error:'Card setup not complete'},400);
      const setup = await stripe.setupIntents.retrieve(String(session.setup_intent));
      if (setup.status !== 'succeeded') return json({error:'Card verification incomplete'},400);
      if (!defaultId && setup.payment_method) await stripe.customers.update(customerId,{invoice_settings:{default_payment_method: typeof setup.payment_method === 'string' ? setup.payment_method : setup.payment_method.id}});
      return json({success:true});
    }
    if (['default','remove'].includes(body.action)) {
      if (!body.paymentMethodId || targetId !== user.id) return json({error:'Invalid card'},400);
      const method = await stripe.paymentMethods.retrieve(body.paymentMethodId);
      if (method.customer !== customerId) return json({error:'Card unavailable'},403);
      if (body.action === 'default') await stripe.customers.update(customerId,{invoice_settings:{default_payment_method:method.id}});
      else {
        const subscriptions = await stripe.subscriptions.list({customer:customerId,status:'all',limit:100});
        if (subscriptions.has_more || subscriptions.data.some((s:Stripe.Subscription) => !['canceled','incomplete_expired'].includes(s.status) && (s.default_payment_method === method.id || (!s.default_payment_method && defaultId === method.id)))) return json({error:'Change your membership payment card before removing this card'},409);
        if (defaultId === method.id) await stripe.customers.update(customerId,{invoice_settings:{default_payment_method:''}});
        await stripe.paymentMethods.detach(method.id);
      }
      return json({success:true});
    }
    if (!booking || ['cancelled','canceled','no_show'].includes(booking.status)) return json({error:'Select an eligible appointment'},400);
    // Guest contact must match the linked account; never charge an admin who booked for a guest.
    if (booking.guest_email && booking.guest_email.toLowerCase() !== (profile.email ?? '').toLowerCase()) return json({error:'Appointment customer does not match the linked account'},409);
    const {data: records,error: recordsError} = await db.from('payment_records').select('amount_cents,payment_type,status,metadata,stripe_payment_intent_id').eq('booking_id',booking.id);
    if (recordsError) throw recordsError;
    const {data: depositQuotes,error: depositError} = await db.from('quotes').select('deposit_amount,stripe_payment_intent_id,guest_email').eq('booking_id',booking.id);
    if(depositError)throw depositError;
    let confirmedDeposit=['partial','deposit_paid'].includes(booking.payment_status)?Number(booking.deposit_amount||0):0;
    for(const deposit of depositQuotes??[]){
      if(!deposit.stripe_payment_intent_id)continue;
      const intent=await stripe.paymentIntents.retrieve(deposit.stripe_payment_intent_id);
      if(intent.status==='succeeded' && deposit.guest_email?.toLowerCase()===(profile.email??'').toLowerCase())confirmedDeposit=Math.max(confirmedDeposit,Number(deposit.deposit_amount||0));
    }
    const quote = balanceQuote(booking.total_price,['paid','refunded'].includes(booking.payment_status)?booking.payment_status:confirmedDeposit>0?'deposit_paid':booking.payment_status,confirmedDeposit,(records ?? []).map(r=>({...r,metadata:{...r.metadata,stripe_payment_intent_id:r.stripe_payment_intent_id}})));
    const {data: authorization,error: authorizationError} = await db.from('card_authorizations').select('*').eq('booking_id',booking.id).eq('user_id',targetId).maybeSingle();
    if (authorizationError) throw authorizationError;
    const {data: existing,error: existingError} = await db.from('portal_charge_requests').select('*').eq('booking_id',booking.id).maybeSingle();
    if (existingError) throw existingError;
    const terms = `I authorize AV Detailing to charge my default saved card once for the remaining balance of appointment ${booking.id.slice(0,8).toUpperCase()}: $${(quote.serviceCents/100).toFixed(2)} plus $${(quote.feeCents/100).toFixed(2)} processing fee (3.5%), total $${(quote.amountCents/100).toFixed(2)}. This approval covers this appointment only, not additional fees or future appointments. I can revoke it before the charge starts.`;
    if (body.action === 'quote') return json({...quote,terms,authorization,charge:existing,hasDefault:!!defaultId});
    if (body.action === 'revoke') {
      if (existing) return json({error:'Charge already started; contact AV Detailing'},409);
      const {error} = await db.from('card_authorizations').update({revoked_at:new Date().toISOString()}).eq('booking_id',booking.id).eq('user_id',user.id);
      if (error) throw error;
      return json({success:true});
    }
    if (body.action === 'authorize') {
      if (!body.accepted || body.amountCents !== quote.amountCents || !defaultId || existing || quote.amountCents <= 0) return json({error:'Reload the balance and select a default card before approving'},409);
      const {error} = await db.from('card_authorizations').upsert({booking_id:booking.id,user_id:user.id,amount_cents:quote.amountCents,terms_text:terms,authorized_at:new Date().toISOString(),revoked_at:null},{onConflict:'booking_id,user_id'});
      if (error) throw error;
      return json({success:true});
    }
    if (body.action === 'charge') {
      if (existing?.stripe_payment_intent_id) {
        const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
        const settled=await syncPortalCharge(db,stripe,intent);
        return json(settled??{status:intent.status});
      }
      if(existing)return json({error:'A charge is already reserved. Its result must be reconciled before any retry; no second charge was created.'},409);
      if (!authorization || !authorizationMatches(authorization.amount_cents,authorization.revoked_at,quote.amountCents) || body.amountCents !== quote.amountCents || !defaultId) return json({error:'Exact customer approval and a default card are required'},409);
      let reservation = existing;
      if (!reservation) {
        const {data,error} = await db.from('portal_charge_requests').insert({booking_id:booking.id,user_id:targetId,authorization_id:authorization.id,requested_by:user.id,amount_cents:quote.amountCents,service_amount_cents:quote.serviceCents,stripe_payment_method_id:defaultId}).select('*').single();
        if (error) return json({error:'Charge already reserved; refresh its status'},409);
        reservation=data;
      }
      if (!reservation || reservation.amount_cents !== quote.amountCents) return json({error:'Balance changed; contact AV Detailing'},409);
      // Persist the intent before confirming. A lost creation response leaves a locked reservation, never a creation retry.
      const intent = await stripe.paymentIntents.create({amount:reservation.amount_cents,currency:'usd',customer:customerId,payment_method:reservation.stripe_payment_method_id,receipt_email:profile.email || undefined,metadata:{portal_charge_id:reservation.id,booking_id:booking.id,user_id:targetId},description:`AV Detailing appointment ${booking.id.slice(0,8)} remaining balance`},{idempotencyKey:`portal-balance-${reservation.id}`});
      const {error:persistError}=await db.from('portal_charge_requests').update({stripe_payment_intent_id:intent.id,status:intent.status}).eq('id',reservation.id);
      if(persistError)throw persistError;
      const confirmed=await stripe.paymentIntents.confirm(intent.id,{off_session:true},{idempotencyKey:`portal-confirm-${reservation.id}`});
      await syncPortalCharge(db,stripe,confirmed);
      return json({status:confirmed.status});
    }
    return json({error:'Unsupported operation'},400);
  } catch (error) {
    console.error('Wallet operation failed', error instanceof Error ? error.name : 'unknown');
    return json({error:'Unable to complete card request. Refresh before retrying; no new charge will be created for an existing request.'},500);
  }
});