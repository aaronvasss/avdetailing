-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users and guests can insert bookings" ON public.bookings;

-- Create a new PERMISSIVE INSERT policy for bookings
CREATE POLICY "Users and guests can insert bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));