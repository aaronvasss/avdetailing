-- STAGED ONLY: apply via Lovable migration tooling only after release authorization.
-- No historical rows are modified. All payment consumers use this locked ledger calculation.
CREATE OR REPLACE FUNCTION public.portal_booking_balance(_booking_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.bookings; r record; q record; seen jsonb := '{}'::jsonb;
  key text; signature jsonb; cents bigint; paid bigint := 0; deposits bigint := 0;
  total bigint; reason text;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id=_booking_id FOR UPDATE;
  IF b.id IS NULL THEN RAISE EXCEPTION 'Appointment unavailable'; END IF;
  total := round(b.total_price*100)::bigint;
  IF total IS NULL OR total<=0 OR total>2147483647 THEN reason := 'Invalid saved total'; END IF;
  FOR r IN SELECT * FROM public.payment_records WHERE booking_id=b.id AND payment_type<>'tip' ORDER BY id LOOP
    IF r.status IN ('refunded','partially_refunded') OR coalesce(r.metadata->>'refunded_amount_cents','0') <> '0' THEN
      reason := 'Refund history requires review'; CONTINUE;
    END IF;
    IF r.status NOT IN ('succeeded','paid') OR r.status IS NULL THEN CONTINUE; END IF;
    IF r.user_id IS DISTINCT FROM b.user_id OR coalesce(r.currency,'')<>'usd'
      OR jsonb_typeof(r.metadata->'service_amount_cents') IS DISTINCT FROM 'number'
      OR coalesce(r.metadata->>'service_amount_cents','') !~ '^[0-9]{1,10}$' THEN
      reason := 'Historical payment requires reconciliation'; CONTINUE;
    END IF;
    cents := (r.metadata->>'service_amount_cents')::bigint;
    IF cents<=0 OR cents>r.amount_cents OR cents>2147483647 THEN
      reason := 'Invalid service credit'; CONTINUE;
    END IF;
    IF nullif(r.stripe_payment_intent_id,'') IS NOT NULL
      AND nullif(r.metadata->>'stripe_payment_intent_id','') IS NOT NULL
      AND r.stripe_payment_intent_id <> r.metadata->>'stripe_payment_intent_id' THEN
      reason := 'Payment identity conflict'; CONTINUE;
    END IF;
    key := coalesce(nullif(r.stripe_payment_intent_id,''),nullif(r.metadata->>'stripe_payment_intent_id',''),'record:'||r.id::text);
    signature := jsonb_build_object('cents',cents,'amount',r.amount_cents,'type',r.payment_type);
    IF seen ? key THEN
      IF seen->key IS DISTINCT FROM signature THEN reason := 'Conflicting duplicate payment'; END IF;
      CONTINUE;
    END IF;
    seen := seen || jsonb_build_object(key,signature);
    paid := paid+cents;
    IF r.payment_type='deposit' THEN deposits:=deposits+cents; END IF;
  END LOOP;
  -- A quote status or booking deposit field is not proof of payment. Quote-only
  -- legacy deposits require reconciliation into the ledger, never an inferred credit.
  FOR q IN SELECT * FROM public.quotes WHERE booking_id=b.id LOOP
    IF q.status IN ('deposit_paid','converted','accepted') AND q.stripe_payment_intent_id IS NOT NULL THEN
      IF NOT (seen ? q.stripe_payment_intent_id) THEN reason:='Quote deposit lacks verified ledger evidence';
      ELSIF (seen->q.stripe_payment_intent_id->>'type') IS DISTINCT FROM 'deposit'
        OR (seen->q.stripe_payment_intent_id->>'cents')::bigint IS DISTINCT FROM round(q.deposit_amount*100)::bigint THEN
        reason:='Quote and ledger deposit conflict';
      END IF;
    END IF;
  END LOOP;
  IF b.payment_status IN ('partial','deposit_paid') AND paid=0 THEN reason:='Deposit status lacks verified payment evidence'; END IF;
  IF paid>total THEN reason:='Credits exceed saved total'; END IF;
  -- Terminal status suppresses charges but does not conceal ambiguous ledger history.
  IF reason IS NOT NULL THEN RETURN jsonb_build_object('review',true,'reason',reason); END IF;
  RETURN jsonb_build_object('review',false,'totalCents',total,'depositCents',deposits,
    'creditedCents',paid,'serviceCents',CASE WHEN b.payment_status IN ('paid','refunded') THEN 0 ELSE greatest(0,total-paid) END,
    'feeCents',0,'amountCents',CASE WHEN b.payment_status IN ('paid','refunded') THEN 0 ELSE greatest(0,total-paid) END);
END $$;
REVOKE ALL ON FUNCTION public.portal_booking_balance(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.portal_booking_balance(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_portal_charge_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.bookings; a public.card_authorizations; quote jsonb;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id=NEW.booking_id FOR UPDATE;
  SELECT * INTO a FROM public.card_authorizations WHERE id=NEW.authorization_id FOR UPDATE;
  IF b.id IS NULL OR a.id IS NULL OR b.user_id IS DISTINCT FROM NEW.user_id
    OR a.user_id IS DISTINCT FROM NEW.user_id OR a.booking_id IS DISTINCT FROM b.id
    OR a.revoked_at IS NOT NULL OR a.amount_cents IS DISTINCT FROM NEW.amount_cents
    OR b.payment_status IN ('paid','refunded') OR b.status IN ('cancelled','canceled','no_show') THEN
    RAISE EXCEPTION 'Appointment or authorization changed';
  END IF;
  quote:=public.portal_booking_balance(b.id);
  IF (quote->>'review')::boolean THEN RAISE EXCEPTION 'Payment balance needs review: %',quote->>'reason'; END IF;
  IF (quote->>'amountCents')::bigint<=0
    OR NEW.service_amount_cents IS DISTINCT FROM (quote->>'serviceCents')::integer
    OR NEW.amount_cents IS DISTINCT FROM (quote->>'amountCents')::integer THEN
    RAISE EXCEPTION 'Balance changed; new customer approval required';
  END IF;
  RETURN NEW;
END $$;
COMMENT ON FUNCTION public.portal_booking_balance(uuid) IS 'Service-only locked saved-payable ledger balance; no additional processing fee; unresolved historical/quote credits fail closed.';
