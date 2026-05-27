-- 1. Default-deny unknown realtime topics
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'realtime.messages'::regclass
      AND polname = 'Staff only realtime for team and worker channels'
  ) THEN
    EXECUTE 'DROP POLICY "Staff only realtime for team and worker channels" ON realtime.messages';
  END IF;
END $$;

CREATE POLICY "Staff only realtime for team and worker channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() IN ('team-chat', 'worker-notifications')
      OR realtime.topic() LIKE 'team_messages%'
      OR realtime.topic() LIKE 'worker_notifications%'
    THEN public.is_staff()
    ELSE false
  END
);

-- 2. Lock down worker self-update to phone only via column-level grants
REVOKE UPDATE ON public.worker_profiles FROM authenticated;
GRANT UPDATE (phone) ON public.worker_profiles TO authenticated;
GRANT UPDATE ON public.worker_profiles TO service_role;