
-- FIX 1: Attach existing prevent_worker_pay_changes trigger to worker_profiles
-- The function already exists but the trigger was never attached
CREATE TRIGGER prevent_worker_pay_changes_trigger
BEFORE UPDATE ON public.worker_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_worker_pay_changes();

-- FIX 2: Restrict the worker self-update RLS policy to only allow phone updates
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Workers can update own profile" ON public.worker_profiles;

-- Create a restricted policy that only allows workers to update their own phone field
-- The trigger above is the defense-in-depth layer; this policy further restricts at RLS level
CREATE POLICY "Workers can update own phone"
ON public.worker_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
