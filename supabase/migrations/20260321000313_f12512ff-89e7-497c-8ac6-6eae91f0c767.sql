
-- Add tip_amount column to bookings table for cash/in-person tip tracking
ALTER TABLE public.bookings ADD COLUMN tip_amount numeric DEFAULT NULL;
