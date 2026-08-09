CREATE TABLE public.worker_tips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tip_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Chicago')::date,
  amount numeric NOT NULL CHECK (amount > 0 AND amount <= 10000),
  payment_type text NOT NULL DEFAULT 'cash',
  note text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_tips TO authenticated;
GRANT ALL ON public.worker_tips TO service_role;

ALTER TABLE public.worker_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers view own tips" ON public.worker_tips
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_manager() OR public.is_admin());

CREATE POLICY "Workers insert own tips" ON public.worker_tips
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_manager() OR public.is_admin());

CREATE POLICY "Workers update own tips" ON public.worker_tips
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_manager() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_manager() OR public.is_admin());

CREATE POLICY "Workers delete own tips" ON public.worker_tips
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_manager() OR public.is_admin());

CREATE INDEX idx_worker_tips_user_date ON public.worker_tips (user_id, tip_date);

CREATE TRIGGER update_worker_tips_updated_at
  BEFORE UPDATE ON public.worker_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.prevent_worker_tip_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_manager() OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'You cannot reassign a tip entry to another worker';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_worker_tip_owner_change
  BEFORE UPDATE ON public.worker_tips
  FOR EACH ROW EXECUTE FUNCTION public.prevent_worker_tip_owner_change();