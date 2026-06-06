
CREATE TABLE public.worker_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clock_in_at timestamptz NOT NULL DEFAULT now(),
  clock_out_at timestamptz,
  clock_in_lat numeric,
  clock_in_lng numeric,
  clock_in_accuracy numeric,
  clock_out_lat numeric,
  clock_out_lng numeric,
  clock_out_accuracy numeric,
  total_minutes integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX worker_shifts_user_id_idx ON public.worker_shifts(user_id);
CREATE INDEX worker_shifts_active_idx ON public.worker_shifts(user_id) WHERE clock_out_at IS NULL;
CREATE INDEX worker_shifts_clock_in_idx ON public.worker_shifts(clock_in_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.worker_shifts TO authenticated;
GRANT ALL ON public.worker_shifts TO service_role;
ALTER TABLE public.worker_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers view own shifts or admins all"
  ON public.worker_shifts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Workers create own shifts"
  ON public.worker_shifts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers update own shifts or admins"
  ON public.worker_shifts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins delete shifts"
  ON public.worker_shifts FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_worker_shifts_updated_at
  BEFORE UPDATE ON public.worker_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.worker_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shift_id uuid REFERENCES public.worker_shifts(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  accuracy numeric,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX worker_locations_user_recorded_idx ON public.worker_locations(user_id, recorded_at DESC);
CREATE INDEX worker_locations_shift_idx ON public.worker_locations(shift_id);

GRANT SELECT, INSERT ON public.worker_locations TO authenticated;
GRANT ALL ON public.worker_locations TO service_role;
ALTER TABLE public.worker_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers view own locations or admins all"
  ON public.worker_locations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Workers insert own locations"
  ON public.worker_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins delete locations"
  ON public.worker_locations FOR DELETE TO authenticated
  USING (public.is_admin());

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS location_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_tracking_enabled boolean NOT NULL DEFAULT false;

ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_locations;
