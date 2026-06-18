
-- Replace broad UPDATE policies with column-level grants to prevent workers
-- from modifying pay_rate, pay_type, or is_active on their own profile.
REVOKE UPDATE ON public.worker_profiles FROM authenticated;
GRANT UPDATE (phone, location_consent_at, location_tracking_enabled, updated_at)
  ON public.worker_profiles TO authenticated;
