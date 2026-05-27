
-- Fix: Allow staff to SELECT booking_add_ons
CREATE POLICY "Staff can view all booking add-ons"
ON public.booking_add_ons
FOR SELECT
TO authenticated
USING (public.is_staff());

-- Fix: Explicit deny anon on payment_records (defense in depth)
CREATE POLICY "Deny anonymous access to payment_records"
ON public.payment_records
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Fix: Explicit deny INSERT/UPDATE/DELETE on user_roles for non-admins
-- (prevents privilege escalation even if policy ordering changes)
CREATE POLICY "Only admins can insert user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());
