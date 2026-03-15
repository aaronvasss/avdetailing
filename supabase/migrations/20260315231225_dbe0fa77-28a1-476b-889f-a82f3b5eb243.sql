
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert rewards" ON public.referral_rewards;

-- Create a restrictive insert policy: only service_role can insert rewards
-- (rewards should only be created server-side when a referred booking completes)
CREATE POLICY "Only service role can insert rewards"
ON public.referral_rewards
FOR INSERT
TO public
WITH CHECK (current_setting('request.jwt.claim.role'::text, true) = 'service_role'::text);
