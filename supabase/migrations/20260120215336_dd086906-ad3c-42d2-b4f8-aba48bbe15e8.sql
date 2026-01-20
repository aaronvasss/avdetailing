-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert bookings" ON public.bookings;

-- Create a permissive INSERT policy that allows both authenticated users and guests
CREATE POLICY "Users and guests can insert bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) OR (user_id IS NULL)
);

-- Also allow anonymous users to insert into booking_add_ons for their booking
DROP POLICY IF EXISTS "Users can insert booking add-ons" ON public.booking_add_ons;

CREATE POLICY "Users and guests can insert booking add-ons"
ON public.booking_add_ons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_add_ons.booking_id 
    AND ((bookings.user_id = auth.uid()) OR (bookings.user_id IS NULL))
  )
);