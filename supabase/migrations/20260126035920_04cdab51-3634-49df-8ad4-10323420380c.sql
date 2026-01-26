-- Create storage bucket for booking photos (before/after)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-photos',
  'booking-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Create storage bucket for quote request photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-photos',
  'quote-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- RLS policies for booking-photos bucket
-- Anyone can view booking photos (public bucket)
CREATE POLICY "Anyone can view booking photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'booking-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload booking photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking-photos' AND
  (auth.uid() IS NOT NULL OR auth.role() = 'anon')
);

-- Admin/staff can upload anywhere in booking-photos
CREATE POLICY "Staff can manage booking photos"
ON storage.objects FOR ALL
USING (bucket_id = 'booking-photos' AND public.is_staff())
WITH CHECK (bucket_id = 'booking-photos' AND public.is_staff());

-- RLS policies for quote-photos bucket
-- Anyone can view quote photos
CREATE POLICY "Anyone can view quote photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-photos');

-- Anyone can upload quote photos (for guest quote requests)
CREATE POLICY "Anyone can upload quote photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quote-photos');

-- Staff can manage all quote photos
CREATE POLICY "Staff can manage quote photos"
ON storage.objects FOR ALL
USING (bucket_id = 'quote-photos' AND public.is_staff())
WITH CHECK (bucket_id = 'quote-photos' AND public.is_staff());

-- Create table to track booking photos
CREATE TABLE public.booking_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'quote')),
  uploaded_by UUID,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on booking_photos
ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;

-- Users can view photos for their own bookings
CREATE POLICY "Users can view own booking photos"
ON public.booking_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_photos.booking_id
    AND (bookings.user_id = auth.uid() OR public.is_staff())
  )
);

-- Staff can manage all booking photos
CREATE POLICY "Staff can manage booking photos"
ON public.booking_photos FOR ALL
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Allow insert for authenticated users on their own bookings
CREATE POLICY "Users can add photos to own bookings"
ON public.booking_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_photos.booking_id
    AND bookings.user_id = auth.uid()
  )
);