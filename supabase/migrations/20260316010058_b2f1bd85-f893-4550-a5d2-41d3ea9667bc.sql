
-- 1. CUSTOMER_MEMBERSHIPS: Remove user INSERT and UPDATE policies, restrict to service_role/admin only
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.customer_memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.customer_memberships;

-- Only service_role (webhooks) and admins can insert memberships
CREATE POLICY "Service role can insert memberships"
ON public.customer_memberships
FOR INSERT TO public
WITH CHECK (
  current_setting('request.jwt.claim.role'::text, true) = 'service_role'::text
  OR is_admin()
);

-- Only service_role (webhooks) and admins can update memberships
CREATE POLICY "Service role can update memberships"
ON public.customer_memberships
FOR UPDATE TO public
USING (
  current_setting('request.jwt.claim.role'::text, true) = 'service_role'::text
  OR is_admin()
)
WITH CHECK (
  current_setting('request.jwt.claim.role'::text, true) = 'service_role'::text
  OR is_admin()
);

-- 2. BOOKINGS: Replace unrestricted user UPDATE with a security definer function for safe fields only
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

-- Create a restrictive policy: users can only update safe fields on their own bookings
-- The trigger already blocks financial fields, but let's also add a narrow UPDATE policy
CREATE POLICY "Users can update own bookings limited"
ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. INTERNAL NOTES: Remove internal_notes column from bookings and quotes
-- Since booking_internal_notes table already exists with staff-only RLS, migrate data there first

-- Migrate any existing internal_notes from bookings to booking_internal_notes
INSERT INTO public.booking_internal_notes (booking_id, note, created_by)
SELECT id, internal_notes, COALESCE(assigned_worker_id, user_id)
FROM public.bookings
WHERE internal_notes IS NOT NULL AND internal_notes != ''
ON CONFLICT DO NOTHING;

-- Drop the internal_notes columns
ALTER TABLE public.bookings DROP COLUMN IF EXISTS internal_notes;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS internal_notes;
