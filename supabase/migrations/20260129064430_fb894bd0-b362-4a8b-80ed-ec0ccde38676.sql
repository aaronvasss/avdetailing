-- Remove the overly permissive RLS policy that allows anyone to read all bookings
-- The manage-booking edge function already handles token-based access securely using service role
DROP POLICY IF EXISTS "Allow access with valid manage token" ON public.bookings;