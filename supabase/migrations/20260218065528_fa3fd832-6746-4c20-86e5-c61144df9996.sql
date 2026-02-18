
-- Fix 1: Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('booking-photos', 'quote-photos');

-- Drop any existing public view policies on storage
DROP POLICY IF EXISTS "Anyone can view booking photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view quote photos" ON storage.objects;

-- Add authenticated read policies for booking-photos
CREATE POLICY "Staff can view booking photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'booking-photos' AND public.is_staff());

CREATE POLICY "Users can view own booking photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-photos' AND
  EXISTS (
    SELECT 1 FROM public.booking_photos bp
    JOIN public.bookings b ON b.id = bp.booking_id
    WHERE bp.storage_path = storage.objects.name
    AND b.user_id = auth.uid()
  )
);

-- Add authenticated read policies for quote-photos
CREATE POLICY "Staff can view quote photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-photos' AND public.is_staff());

CREATE POLICY "Users can view own quote photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quote-photos' AND
  EXISTS (
    SELECT 1 FROM public.quote_photos qp
    JOIN public.quotes q ON q.id = qp.quote_id
    WHERE qp.storage_path = storage.objects.name
    AND q.user_id = auth.uid()
  )
);

-- Fix 4: Remove conflicting deny-all anonymous SELECT on quotes table
-- The existing staff/admin/user policies already restrict access properly
DROP POLICY IF EXISTS "Deny anonymous access to quotes" ON public.quotes;
