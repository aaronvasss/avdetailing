-- Staged only: apply with the managed migration tool on authorized release.
CREATE TABLE public.owner_alert_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL,
 event_key text NOT NULL UNIQUE, kind text NOT NULL CHECK(kind IN ('reschedule','cancellation')),
 content jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.owner_alert_events TO service_role;
ALTER TABLE public.owner_alert_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.owner_alert_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.owner_alert_events(id),
 channel text NOT NULL CHECK(channel IN ('email','sms')), recipient text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','leased','sending','retry','sent','failed','needs_review')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_id uuid, lease_until timestamptz,
 provider_id text, last_error text, sent_at timestamptz,
 UNIQUE(event_id,channel,recipient)
);
GRANT ALL ON public.owner_alert_deliveries TO service_role;
ALTER TABLE public.owner_alert_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX owner_alert_due ON public.owner_alert_deliveries(next_attempt_at) WHERE status IN ('pending','retry','leased','sending');
CREATE TABLE public.owner_alert_dispatch_config (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), function_url text NOT NULL CHECK(function_url ~ '^https://'),
 enabled boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.owner_alert_dispatch_config TO service_role;
ALTER TABLE public.owner_alert_dispatch_config ENABLE ROW LEVEL SECURITY;

-- One transaction: existing triggers/financial guards remain active on the booking update.
CREATE OR REPLACE FUNCTION public.commit_owner_appointment_change(
 _booking_id uuid, _expected_updated_at timestamptz, _expected_date date, _expected_time time,
 _expected_status text, _user_id uuid, _manage_token text, _kind text,
 _new_date date, _new_time time, _notes text, _content jsonb, _email_recipients text[], _sms_recipients text[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.bookings; eid uuid; k text; recipient text;
BEGIN
 SELECT * INTO b FROM public.bookings WHERE id=_booking_id FOR UPDATE;
 IF b.id IS NULL OR b.updated_at IS DISTINCT FROM _expected_updated_at OR b.scheduled_date IS DISTINCT FROM _expected_date
 OR b.scheduled_time IS DISTINCT FROM _expected_time OR b.status IS DISTINCT FROM _expected_status
 OR (_manage_token IS NULL AND (b.user_id IS NULL OR b.user_id IS DISTINCT FROM _user_id))
 OR (_manage_token IS NOT NULL AND b.manage_token IS DISTINCT FROM _manage_token) THEN
  RETURN jsonb_build_object('changed',false);
 END IF;
 IF _kind NOT IN ('reschedule','cancellation') OR b.status NOT IN ('pending','confirmed')
 OR jsonb_typeof(_content) IS DISTINCT FROM 'object' OR NOT (_content ?& ARRAY['subject','html','text'])
 OR cardinality(_email_recipients) IS DISTINCT FROM 1 OR cardinality(_sms_recipients) IS DISTINCT FROM 1 THEN
  RAISE EXCEPTION 'Invalid owner appointment change';
 END IF;
 IF _kind='reschedule' THEN
  UPDATE public.bookings SET scheduled_date=_new_date,scheduled_time=_new_time,status='pending' WHERE id=b.id;
 ELSE
  UPDATE public.bookings SET status='cancelled',customer_notes=_notes WHERE id=b.id;
 END IF;
 -- The prior revision plus action is stable across duplicate requests; the booking lock serializes writers.
 k:=_kind||'/'||b.id::text||'/'||_expected_updated_at::text;
 INSERT INTO public.owner_alert_events(booking_id,event_key,kind,content) VALUES(b.id,k,_kind,_content) RETURNING id INTO eid;
 FOREACH recipient IN ARRAY _email_recipients LOOP
  INSERT INTO public.owner_alert_deliveries(event_id,channel,recipient) VALUES(eid,'email',recipient);
 END LOOP;
 FOREACH recipient IN ARRAY _sms_recipients LOOP
  INSERT INTO public.owner_alert_deliveries(event_id,channel,recipient) VALUES(eid,'sms',recipient);
 END LOOP;
 RETURN jsonb_build_object('changed',true,'eventId',eid);
END $$;
REVOKE ALL ON FUNCTION public.commit_owner_appointment_change(uuid,timestamptz,date,time,text,uuid,text,text,date,time,text,jsonb,text[],text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_owner_appointment_change(uuid,timestamptz,date,time,text,uuid,text,text,date,time,text,jsonb,text[],text[]) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_owner_alert_deliveries(_limit integer DEFAULT 10)
RETURNS TABLE(id uuid,event_id uuid,booking_id uuid,kind text,channel text,recipient text,content jsonb,attempts integer,lease_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 -- SMS accepted-but-unrecorded is uncertain: never blindly resend. Email uses provider idempotency.
 UPDATE public.owner_alert_deliveries d SET status='needs_review',last_error='SMS processing stopped after send began; verify provider delivery before retry',lease_id=NULL,lease_until=NULL
 WHERE d.channel='sms' AND d.status='sending' AND d.lease_until<=now();
 UPDATE public.owner_alert_deliveries d SET status='failed',last_error='Retry limit or six-hour delivery window exhausted',lease_id=NULL,lease_until=NULL
 FROM public.owner_alert_events e WHERE e.id=d.event_id AND d.status IN ('pending','retry','leased','sending')
 AND (d.lease_until IS NULL OR d.lease_until<=now()) AND (d.attempts>=5 OR e.created_at<now()-interval '6 hours');
 RETURN QUERY WITH due AS (
  SELECT d.id FROM public.owner_alert_deliveries d JOIN public.owner_alert_events e ON e.id=d.event_id
  WHERE (d.status IN ('pending','retry') AND d.next_attempt_at<=now() OR d.status IN ('leased','sending') AND d.lease_until<=now())
  AND d.attempts<5 AND e.created_at>=now()-interval '6 hours'
  ORDER BY d.next_attempt_at,d.id FOR UPDATE OF d SKIP LOCKED LIMIT greatest(1,least(_limit,20))
 ), claimed AS (
  UPDATE public.owner_alert_deliveries d SET status='leased',attempts=d.attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes'
  FROM due WHERE d.id=due.id RETURNING d.*
 ) SELECT c.id,c.event_id,e.booking_id,e.kind,c.channel,c.recipient,e.content,c.attempts,c.lease_id FROM claimed c JOIN public.owner_alert_events e ON e.id=c.event_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_owner_alert_deliveries(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_owner_alert_deliveries(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.begin_owner_alert_send(_id uuid,_lease_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.owner_alert_deliveries SET status='sending' WHERE id=_id AND lease_id=_lease_id AND status='leased' AND lease_until>now();
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.begin_owner_alert_send(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_owner_alert_send(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.finish_owner_alert_send(_id uuid,_lease_id uuid,_outcome text,_provider_id text,_error text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.owner_alert_deliveries; e public.owner_alert_events; final_status text;
BEGIN
 SELECT * INTO d FROM public.owner_alert_deliveries WHERE id=_id FOR UPDATE;
 IF d.lease_id IS DISTINCT FROM _lease_id OR d.status<>'sending' OR d.lease_until<=now() THEN RETURN false; END IF;
 SELECT * INTO e FROM public.owner_alert_events WHERE id=d.event_id;
 IF _outcome NOT IN ('sent','retry','failed','needs_review') THEN RAISE EXCEPTION 'Invalid delivery outcome'; END IF;
 final_status:=CASE WHEN _outcome='retry' AND (d.attempts>=5 OR e.created_at<now()-interval '6 hours') THEN 'failed' ELSE _outcome END;
 UPDATE public.owner_alert_deliveries SET status=final_status,provider_id=_provider_id,last_error=left(_error,500),
 sent_at=CASE WHEN final_status='sent' THEN now() ELSE NULL END,
 next_attempt_at=now()+make_interval(mins=>CASE d.attempts WHEN 1 THEN 1 WHEN 2 THEN 5 WHEN 3 THEN 15 ELSE 60 END),lease_id=NULL,lease_until=NULL WHERE id=d.id;
 INSERT INTO public.booking_notification_log(booking_id,notification_type,recipient,status,error_message)
 VALUES(e.booking_id,'owner_'||e.kind||'_'||d.channel, d.recipient,final_status,left(_error,500));
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.finish_owner_alert_send(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_owner_alert_send(uuid,uuid,text,text,text) TO service_role;

-- Wake on enqueue; retry timer exists only while work remains. Config is installed separately at release.
CREATE OR REPLACE FUNCTION public.wake_owner_alert_dispatch() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.owner_alert_dispatch_config; secret text;
BEGIN
 SELECT * INTO c FROM public.owner_alert_dispatch_config WHERE id=true AND enabled;
 IF NOT FOUND THEN RETURN; END IF;
 IF to_regnamespace('cron') IS NULL OR to_regnamespace('net') IS NULL THEN RAISE EXCEPTION 'Owner alert scheduler extensions unavailable'; END IF;
 SELECT token INTO secret FROM public.portal_scheduler_credentials WHERE id=true;
 IF secret IS NULL THEN RAISE EXCEPTION 'Private scheduler credential unavailable'; END IF;
 PERFORM net.http_post(url:=c.function_url,headers:=jsonb_build_object('Content-Type','application/json','X-Reminder-Scheduler',secret),body:='{}'::jsonb);
 IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='owner-alert-retry') THEN
  PERFORM cron.schedule('owner-alert-retry','* * * * *','SELECT public.tick_owner_alert_dispatch();');
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.tick_owner_alert_dispatch() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE jid bigint;
BEGIN
 -- Serialize arm/disarm transitions with enqueues so newly committed work cannot lose its timer.
 PERFORM pg_advisory_xact_lock(624851);
 IF EXISTS(SELECT 1 FROM public.owner_alert_deliveries WHERE status IN ('pending','retry','leased','sending')) THEN
  IF EXISTS(SELECT 1 FROM public.owner_alert_deliveries WHERE status IN ('pending','retry') AND next_attempt_at<=now() OR status IN ('leased','sending') AND lease_until<=now()) THEN
   PERFORM public.wake_owner_alert_dispatch();
  END IF;
 ELSE
  IF to_regnamespace('cron') IS NOT NULL THEN
   FOR jid IN SELECT jobid FROM cron.job WHERE jobname='owner-alert-retry' LOOP PERFORM cron.unschedule(jid); END LOOP;
  END IF;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.owner_alert_enqueue_wake() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(624851);
 -- Optional wake failure must not erase the booking or durable alert. Surface it for release monitoring.
 BEGIN PERFORM public.wake_owner_alert_dispatch(); EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Owner alert wake failed; durable queue requires recovery: %',SQLERRM; END;
 RETURN NEW;
END $$;
CREATE TRIGGER owner_alert_wake AFTER INSERT ON public.owner_alert_deliveries FOR EACH STATEMENT EXECUTE FUNCTION public.owner_alert_enqueue_wake();
REVOKE ALL ON FUNCTION public.wake_owner_alert_dispatch(),public.tick_owner_alert_dispatch(),public.owner_alert_enqueue_wake() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wake_owner_alert_dispatch(),public.tick_owner_alert_dispatch() TO service_role;