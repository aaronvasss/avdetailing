CREATE TABLE public.booking_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  booking_user_id uuid,
  changed_by uuid,
  action text NOT NULL,
  field text,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_audit_log_booking_idx ON public.booking_audit_log(booking_id, created_at DESC);
GRANT SELECT ON public.booking_audit_log TO authenticated;
GRANT ALL ON public.booking_audit_log TO service_role;
ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read audit" ON public.booking_audit_log FOR SELECT TO authenticated USING (public.is_admin() OR public.is_staff());
CREATE POLICY "Customers read own audit" ON public.booking_audit_log FOR SELECT TO authenticated USING (booking_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_booking_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f text; o text; n text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_audit_log(booking_id, booking_user_id, changed_by, action) VALUES (NEW.id, NEW.user_id, auth.uid(), 'created');
    RETURN NEW;
  END IF;
  FOREACH f IN ARRAY ARRAY['status','scheduled_date','scheduled_time','total_price','payment_status','tip_amount','assigned_worker_id'] LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', f, f) INTO o, n USING OLD, NEW;
    IF o IS DISTINCT FROM n THEN
      INSERT INTO booking_audit_log(booking_id, booking_user_id, changed_by, action, field, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, auth.uid(), 'updated', f, o, n);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER bookings_audit AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.log_booking_changes();