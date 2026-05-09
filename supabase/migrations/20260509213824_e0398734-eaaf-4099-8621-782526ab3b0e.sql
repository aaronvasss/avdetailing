ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS clock_in_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS clock_out_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_duration_minutes integer;