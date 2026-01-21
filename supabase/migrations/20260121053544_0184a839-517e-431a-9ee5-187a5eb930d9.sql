-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users and guests can insert bookings" ON public.bookings;

-- Create a PERMISSIVE policy that allows guest bookings (user_id = NULL) and authenticated user bookings
CREATE POLICY "Allow guest and user bookings"
ON public.bookings
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- Also need to allow guests to insert booking add-ons
DROP POLICY IF EXISTS "Users and guests can insert booking add-ons" ON public.booking_add_ons;

CREATE POLICY "Allow guest and user booking add-ons"
ON public.booking_add_ons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_add_ons.booking_id
    AND ((bookings.user_id = auth.uid()) OR (bookings.user_id IS NULL))
  )
);