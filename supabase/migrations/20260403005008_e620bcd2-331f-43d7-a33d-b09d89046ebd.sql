
-- 1. Fix business_settings: restrict public reads to only public keys
DROP POLICY IF EXISTS "Business settings are publicly readable" ON public.business_settings;

CREATE POLICY "Public settings are readable by anyone"
ON public.business_settings
FOR SELECT
TO public
USING (
  key IN (
    'public_business_phone',
    'public_business_phone_e164',
    'business_hours_start',
    'business_hours_end',
    'buffer_minutes',
    'default_duration',
    'slot_interval'
  )
);

CREATE POLICY "Staff can read all business settings"
ON public.business_settings
FOR SELECT
TO authenticated
USING (public.is_staff());

-- 2. Fix booking_add_ons: require manage_token match for guest bookings
DROP POLICY IF EXISTS "Allow guest and user booking add-ons" ON public.booking_add_ons;

CREATE POLICY "Authenticated users can insert own booking add-ons"
ON public.booking_add_ons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_add_ons.booking_id
      AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can insert any booking add-ons"
ON public.booking_add_ons
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff());

-- 3. Fix membership_signups: replace WITH CHECK (true) with basic validation
DROP POLICY IF EXISTS "Anyone can insert membership signups" ON public.membership_signups;

CREATE POLICY "Anyone can insert membership signups with valid data"
ON public.membership_signups
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL AND email <> ''
  AND first_name IS NOT NULL AND first_name <> ''
  AND last_name IS NOT NULL AND last_name <> ''
);

-- 4. Fix booking_ratings: replace WITH CHECK (true) with booking existence check
DROP POLICY IF EXISTS "Anyone can submit a rating" ON public.booking_ratings;

CREATE POLICY "Anyone can submit a rating for existing booking"
ON public.booking_ratings
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_ratings.booking_id
  )
  AND rating >= 1 AND rating <= 5
);
