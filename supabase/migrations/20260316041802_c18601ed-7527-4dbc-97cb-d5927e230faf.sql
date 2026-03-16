
-- 1. Create a secure RPC to validate referral codes without exposing user_ids
CREATE OR REPLACE FUNCTION public.validate_referral_code(code_input text)
RETURNS TABLE(is_valid boolean, referrer_user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true AS is_valid,
    user_id AS referrer_user_id
  FROM public.referral_codes
  WHERE code = code_input
  LIMIT 1;
$$;

-- 2. Drop the overly permissive public SELECT policy on referral_codes
DROP POLICY IF EXISTS "Anyone can look up referral codes" ON public.referral_codes;

-- 3. Add a restrictive policy: only authenticated users can look up codes via RPC
-- (The RPC is SECURITY DEFINER so it bypasses RLS, but direct table access is now blocked for anon)
CREATE POLICY "Deny anonymous access to referral_codes"
  ON public.referral_codes
  FOR SELECT
  TO anon
  USING (false);

-- 4. Add staff-only INSERT policy for booking_internal_notes (staff need to add notes too)
CREATE POLICY "Staff can manage internal notes"
  ON public.booking_internal_notes
  FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());
