CREATE OR REPLACE FUNCTION public.get_day_bookings(_date date)
RETURNS TABLE(scheduled_time time, duration_minutes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.scheduled_time, b.duration_minutes FROM public.bookings b
  WHERE b.scheduled_date = _date AND b.status IN ('pending','confirmed','in_progress');
$$;
GRANT EXECUTE ON FUNCTION public.get_day_bookings(date) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_booking_capacity()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(1, COALESCE(
    NULLIF((SELECT value FROM public.business_settings WHERE key='max_concurrent_jobs'), '')::int,
    0) ) * 0 + GREATEST(1, CASE
      WHEN COALESCE(NULLIF((SELECT value FROM public.business_settings WHERE key='max_concurrent_jobs'),'')::int,0) > 0
        THEN (SELECT value FROM public.business_settings WHERE key='max_concurrent_jobs')::int
      ELSE (SELECT count(*)::int FROM public.worker_profiles WHERE is_active = true)
    END);
$$;
GRANT EXECUTE ON FUNCTION public.get_booking_capacity() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public settings are readable by anyone" ON public.business_settings;
CREATE POLICY "Public settings are readable by anyone" ON public.business_settings FOR SELECT
USING (key = ANY (ARRAY['public_business_phone','public_business_phone_e164','business_hours_start','business_hours_end','buffer_minutes','default_duration','slot_interval','latest_start_time','max_concurrent_jobs']));