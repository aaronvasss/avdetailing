-- lovable-cron-fallback-reviewed: wake-on-enqueue queue; 1-minute retry timer exists only while GHL work is waiting and is removed when the queue drains, and never while sync is disabled
-- GoHighLevel one-way sync outbox (Phase 1). Sending stays disabled until ghl_sync_config.enabled is turned on.
CREATE TABLE public.ghl_sync_queue (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_key text NOT NULL UNIQUE,
 kind text NOT NULL CHECK (kind IN ('inquiry','booking_created','paid','rescheduled','cancelled','completed','rating','membership_started','membership_cancelled','refund','backfill')),
 booking_id uuid, contact_id uuid, membership_id uuid, payment_record_id uuid,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','leased','retry','sent','failed','skipped')),
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 8),
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 lease_id uuid, lease_until timestamptz, last_error text,
 ghl_contact_id text, ghl_opportunity_id text,
 created_at timestamptz NOT NULL DEFAULT now(), synced_at timestamptz
);
GRANT ALL ON public.ghl_sync_queue TO service_role;
ALTER TABLE public.ghl_sync_queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX ghl_sync_due ON public.ghl_sync_queue(next_attempt_at) WHERE status IN ('pending','retry','leased');

-- Stable GHL record ids so each contact/opportunity is updated, never duplicated.
CREATE TABLE public.ghl_links (
 link_key text PRIMARY KEY,
 ghl_id text NOT NULL,
 stage_rank integer,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ghl_links TO service_role;
ALTER TABLE public.ghl_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ghl_sync_config (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 function_url text NOT NULL CHECK (function_url ~ '^https://'),
 enabled boolean NOT NULL DEFAULT false,
 customer_messaging_via_ghl boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ghl_sync_config TO service_role;
ALTER TABLE public.ghl_sync_config ENABLE ROW LEVEL SECURITY;

-- Enqueue never blocks the business write that caused it.
CREATE OR REPLACE FUNCTION public.ghl_enqueue(_key text,_kind text,_booking uuid,_contact uuid,_membership uuid,_payment uuid,_payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.ghl_sync_queue(event_key,kind,booking_id,contact_id,membership_id,payment_record_id,payload)
 VALUES(_key,_kind,_booking,_contact,_membership,_payment,coalesce(_payload,'{}'::jsonb)) ON CONFLICT (event_key) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'GHL enqueue skipped: %',SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.ghl_bookings_enqueue() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 BEGIN
  IF TG_OP='INSERT' THEN
   PERFORM public.ghl_enqueue('booking_created:'||NEW.id,'booking_created',NEW.id,NULL,NULL,NULL,'{}');
   RETURN NEW;
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status IN ('paid','deposit_paid','partially_paid') THEN
   PERFORM public.ghl_enqueue('paid:'||NEW.id||':'||NEW.payment_status,'paid',NEW.id,NULL,NULL,NULL,'{}');
  END IF;
  IF (NEW.scheduled_date,NEW.scheduled_time) IS DISTINCT FROM (OLD.scheduled_date,OLD.scheduled_time) AND NEW.status NOT IN ('cancelled','completed') THEN
   PERFORM public.ghl_enqueue('rescheduled:'||NEW.id||':'||NEW.scheduled_date||'T'||NEW.scheduled_time,'rescheduled',NEW.id,NULL,NULL,NULL,'{}');
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status='cancelled' THEN
   PERFORM public.ghl_enqueue('cancelled:'||NEW.id,'cancelled',NEW.id,NULL,NULL,NULL,'{}');
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status='completed' THEN
   PERFORM public.ghl_enqueue('completed:'||NEW.id,'completed',NEW.id,NULL,NULL,NULL,'{}');
  END IF;
 EXCEPTION WHEN OTHERS THEN RAISE WARNING 'GHL booking enqueue skipped: %',SQLERRM;
 END;
 RETURN NEW;
END $$;
CREATE TRIGGER ghl_bookings_sync AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.ghl_bookings_enqueue();

CREATE OR REPLACE FUNCTION public.ghl_contacts_enqueue() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.ghl_enqueue('inquiry:'||NEW.id,'inquiry',NULL,NEW.id,NULL,NULL,'{}');
 RETURN NEW;
END $$;
CREATE TRIGGER ghl_contacts_sync AFTER INSERT ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.ghl_contacts_enqueue();

CREATE OR REPLACE FUNCTION public.ghl_ratings_enqueue() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.ghl_enqueue('rating:'||NEW.id,'rating',NEW.booking_id,NULL,NULL,NULL,'{}');
 RETURN NEW;
END $$;
CREATE TRIGGER ghl_ratings_sync AFTER INSERT ON public.booking_ratings FOR EACH ROW EXECUTE FUNCTION public.ghl_ratings_enqueue();

CREATE OR REPLACE FUNCTION public.ghl_memberships_enqueue() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 BEGIN
  IF NEW.status='active' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
   PERFORM public.ghl_enqueue('membership_started:'||NEW.id||':'||coalesce(NEW.current_period_start::text,NEW.updated_at::text),'membership_started',NULL,NULL,NEW.id,NULL,'{}');
  ELSIF TG_OP='UPDATE' AND OLD.status='active' AND NEW.status IS DISTINCT FROM 'active' THEN
   PERFORM public.ghl_enqueue('membership_cancelled:'||NEW.id||':'||NEW.updated_at::text,'membership_cancelled',NULL,NULL,NEW.id,NULL,'{}');
  END IF;
 EXCEPTION WHEN OTHERS THEN RAISE WARNING 'GHL membership enqueue skipped: %',SQLERRM;
 END;
 RETURN NEW;
END $$;
CREATE TRIGGER ghl_memberships_sync AFTER INSERT OR UPDATE ON public.customer_memberships FOR EACH ROW EXECUTE FUNCTION public.ghl_memberships_enqueue();

CREATE OR REPLACE FUNCTION public.ghl_payments_enqueue() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('refunded','partially_refunded') THEN
  PERFORM public.ghl_enqueue('refund:'||NEW.id||':'||NEW.status,'refund',NEW.booking_id,NULL,NULL,NEW.id,jsonb_build_object('full',NEW.status='refunded'));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ghl_payments_sync AFTER UPDATE ON public.payment_records FOR EACH ROW EXECUTE FUNCTION public.ghl_payments_enqueue();

-- Worker lease API (service only).
CREATE OR REPLACE FUNCTION public.claim_ghl_sync(_limit integer DEFAULT 10)
RETURNS SETOF public.ghl_sync_queue LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.ghl_sync_config WHERE id AND enabled) THEN RETURN; END IF;
 UPDATE public.ghl_sync_queue SET status='failed',last_error=coalesce(last_error,'Retry limit reached'),lease_id=NULL,lease_until=NULL
 WHERE status IN ('pending','retry','leased') AND attempts>=8 AND (lease_until IS NULL OR lease_until<=now());
 RETURN QUERY WITH due AS (
  SELECT q.id FROM public.ghl_sync_queue q
  WHERE (q.status IN ('pending','retry') AND q.next_attempt_at<=now() OR q.status='leased' AND q.lease_until<=now()) AND q.attempts<8
  ORDER BY q.created_at,q.id FOR UPDATE SKIP LOCKED LIMIT greatest(1,least(_limit,25))
 ) UPDATE public.ghl_sync_queue q SET status='leased',attempts=q.attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes'
 FROM due WHERE q.id=due.id RETURNING q.*;
END $$;

CREATE OR REPLACE FUNCTION public.finish_ghl_sync(_id uuid,_lease_id uuid,_outcome text,_error text,_contact text,_opportunity text,_retry_after_seconds integer DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q public.ghl_sync_queue; final_status text;
BEGIN
 SELECT * INTO q FROM public.ghl_sync_queue WHERE id=_id FOR UPDATE;
 IF q.lease_id IS DISTINCT FROM _lease_id OR q.status<>'leased' THEN RETURN false; END IF;
 IF _outcome NOT IN ('sent','retry','failed','skipped') THEN RAISE EXCEPTION 'Invalid GHL outcome'; END IF;
 final_status:=CASE WHEN _outcome='retry' AND q.attempts>=8 THEN 'failed' ELSE _outcome END;
 UPDATE public.ghl_sync_queue SET status=final_status,last_error=left(_error,500),ghl_contact_id=coalesce(_contact,ghl_contact_id),
  ghl_opportunity_id=coalesce(_opportunity,ghl_opportunity_id),synced_at=CASE WHEN final_status='sent' THEN now() ELSE synced_at END,
  next_attempt_at=now()+make_interval(secs=>greatest(coalesce(_retry_after_seconds,0),CASE q.attempts WHEN 1 THEN 60 WHEN 2 THEN 300 WHEN 3 THEN 900 ELSE 3600 END)),
  lease_id=NULL,lease_until=NULL WHERE id=q.id;
 RETURN true;
END $$;

-- Wake on enqueue only while enabled; the retry timer exists only while work remains.
CREATE OR REPLACE FUNCTION public.wake_ghl_sync() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.ghl_sync_config; secret text;
BEGIN
 SELECT * INTO c FROM public.ghl_sync_config WHERE id AND enabled;
 IF NOT FOUND THEN RETURN; END IF;
 IF to_regnamespace('cron') IS NULL OR to_regnamespace('net') IS NULL THEN RAISE EXCEPTION 'GHL scheduler extensions unavailable'; END IF;
 SELECT token INTO secret FROM public.portal_scheduler_credentials WHERE id=true;
 IF secret IS NULL THEN RAISE EXCEPTION 'Private scheduler credential unavailable'; END IF;
 IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='ghl-sync-retry') THEN
  PERFORM cron.schedule('ghl-sync-retry','* * * * *','SELECT public.tick_ghl_sync();');
 END IF;
 BEGIN
  PERFORM net.http_post(url:=c.function_url,headers:=jsonb_build_object('Content-Type','application/json','X-Reminder-Scheduler',secret),body:='{}'::jsonb);
 EXCEPTION WHEN OTHERS THEN RAISE WARNING 'GHL wake request failed; retry timer keeps durable work';
 END;
END $$;

CREATE OR REPLACE FUNCTION public.tick_ghl_sync() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE jid bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(624852);
 IF EXISTS(SELECT 1 FROM public.ghl_sync_config WHERE id AND enabled) AND EXISTS(SELECT 1 FROM public.ghl_sync_queue WHERE status IN ('pending','retry','leased')) THEN
  IF EXISTS(SELECT 1 FROM public.ghl_sync_queue WHERE status IN ('pending','retry') AND next_attempt_at<=now() OR status='leased' AND lease_until<=now()) THEN
   PERFORM public.wake_ghl_sync();
  END IF;
 ELSIF to_regnamespace('cron') IS NOT NULL THEN
  FOR jid IN SELECT jobid FROM cron.job WHERE jobname='ghl-sync-retry' LOOP PERFORM cron.unschedule(jid); END LOOP;
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ghl_queue_wake() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 BEGIN PERFORM public.wake_ghl_sync(); EXCEPTION WHEN OTHERS THEN RAISE WARNING 'GHL wake failed: %',SQLERRM; END;
 RETURN NULL;
END $$;
CREATE TRIGGER ghl_queue_wake AFTER INSERT ON public.ghl_sync_queue FOR EACH STATEMENT EXECUTE FUNCTION public.ghl_queue_wake();

-- Admin-only status and controls (role verified server-side).
CREATE OR REPLACE FUNCTION public.ghl_sync_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 RETURN jsonb_build_object(
  'enabled',coalesce((SELECT enabled FROM public.ghl_sync_config WHERE id),false),
  'customer_messaging_via_ghl',coalesce((SELECT customer_messaging_via_ghl FROM public.ghl_sync_config WHERE id),false),
  'last_success',(SELECT max(synced_at) FROM public.ghl_sync_queue WHERE status='sent'),
  'queued',(SELECT count(*) FROM public.ghl_sync_queue WHERE status IN ('pending','retry','leased')),
  'sent_today',(SELECT count(*) FROM public.ghl_sync_queue WHERE status='sent' AND synced_at>=date_trunc('day',now() AT TIME ZONE 'America/Chicago') AT TIME ZONE 'America/Chicago'),
  'failed',(SELECT count(*) FROM public.ghl_sync_queue WHERE status='failed'),
  'recent_failures',coalesce((SELECT jsonb_agg(f) FROM (SELECT id,kind,attempts,left(last_error,200) AS error,created_at FROM public.ghl_sync_queue WHERE status='failed' ORDER BY created_at DESC LIMIT 20) f),'[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.ghl_retry_failed() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 UPDATE public.ghl_sync_queue SET status='retry',attempts=0,next_attempt_at=now(),last_error=NULL WHERE status='failed';
 GET DIAGNOSTICS n=ROW_COUNT;
 BEGIN PERFORM public.wake_ghl_sync(); EXCEPTION WHEN OTHERS THEN NULL; END;
 RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.ghl_set_config(_enabled boolean,_customer_messaging_via_ghl boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 UPDATE public.ghl_sync_config SET enabled=_enabled,customer_messaging_via_ghl=_customer_messaging_via_ghl,updated_at=now() WHERE id;
 IF NOT FOUND THEN RAISE EXCEPTION 'GHL sync is not configured'; END IF;
 IF _enabled THEN BEGIN PERFORM public.wake_ghl_sync(); EXCEPTION WHEN OTHERS THEN NULL; END; END IF;
END $$;

REVOKE ALL ON FUNCTION public.ghl_enqueue(text,text,uuid,uuid,uuid,uuid,jsonb),public.ghl_bookings_enqueue(),public.ghl_contacts_enqueue(),
 public.ghl_ratings_enqueue(),public.ghl_memberships_enqueue(),public.ghl_payments_enqueue(),public.claim_ghl_sync(integer),
 public.finish_ghl_sync(uuid,uuid,text,text,text,text,integer),public.wake_ghl_sync(),public.tick_ghl_sync(),public.ghl_queue_wake(),
 public.ghl_sync_status(),public.ghl_retry_failed(),public.ghl_set_config(boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ghl_enqueue(text,text,uuid,uuid,uuid,uuid,jsonb),public.claim_ghl_sync(integer),public.finish_ghl_sync(uuid,uuid,text,text,text,text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.ghl_sync_status(),public.ghl_retry_failed(),public.ghl_set_config(boolean,boolean) TO authenticated;
