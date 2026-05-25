
-- 1. Booking photos storage: verify path's first folder is a booking owned by user
DROP POLICY IF EXISTS "Authenticated users can upload booking photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload booking photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-photos'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = (storage.foldername(name))[1]
      AND b.user_id = auth.uid()
  )
);

-- 2. Quote photos storage: restrict INSERT to staff only
DROP POLICY IF EXISTS "Authenticated users can upload quote photos" ON storage.objects;
CREATE POLICY "Staff can upload quote photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quote-photos'
  AND public.is_staff()
);

-- 3. Booking ratings: remove public insert; ratings will go through edge function with service role
DROP POLICY IF EXISTS "Anyone can submit a rating for existing booking" ON public.booking_ratings;

CREATE POLICY "Service role can insert ratings"
ON public.booking_ratings
FOR INSERT
TO public
WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');

-- 4. Booking checklist items: allow customers to view items for their own bookings
CREATE POLICY "Customers can view own booking checklist items"
ON public.booking_checklist_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_checklist_items.booking_id
      AND b.user_id = auth.uid()
  )
);
