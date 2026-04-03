
-- 1. Fix membership_signups: add user-scoped SELECT policy
CREATE POLICY "Users can view own membership signup"
ON public.membership_signups
FOR SELECT
TO authenticated
USING (created_user_id = auth.uid());
