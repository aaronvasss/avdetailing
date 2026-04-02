ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS boat_type text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS boat_length text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS boat_brand text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS aircraft_type text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tail_number text;