-- Add staff read/write access to all bookings (in addition to existing admin policies)
-- Staff should be able to view all bookings, not just their own

-- Allow staff (admin + staff roles) to view all bookings
CREATE POLICY "Staff can view all bookings"
ON public.bookings
FOR SELECT
USING (is_staff());

-- Allow staff to update all bookings
CREATE POLICY "Staff can update all bookings"
ON public.bookings
FOR UPDATE
USING (is_staff())
WITH CHECK (is_staff());