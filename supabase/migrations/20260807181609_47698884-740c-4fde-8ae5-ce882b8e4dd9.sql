ALTER TABLE public.worker_profiles DISABLE TRIGGER prevent_worker_pay_changes_trigger;
ALTER TABLE public.worker_profiles DISABLE TRIGGER trg_prevent_worker_pay_changes;

ALTER TABLE public.worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_pay_type_check;

UPDATE public.worker_profiles
SET pay_rate = 18
WHERE pay_type <> 'hourly' AND (pay_rate = 0 OR pay_type = 'percentage');

UPDATE public.worker_profiles
SET pay_type = 'hourly'
WHERE pay_type <> 'hourly';

ALTER TABLE public.worker_profiles
  ADD CONSTRAINT worker_profiles_pay_type_check CHECK (pay_type = 'hourly');

ALTER TABLE public.worker_profiles ENABLE TRIGGER prevent_worker_pay_changes_trigger;
ALTER TABLE public.worker_profiles ENABLE TRIGGER trg_prevent_worker_pay_changes;

ALTER TABLE public.worker_profiles ALTER COLUMN pay_type SET DEFAULT 'hourly';
ALTER TABLE public.worker_profiles ALTER COLUMN pay_rate SET DEFAULT 18;

UPDATE public.bookings
SET worker_pay_type = NULL, worker_pay_rate = NULL
WHERE worker_pay_type IN ('percentage', 'flat');