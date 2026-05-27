
-- 1) Allow customers to read ratings on their own bookings
CREATE POLICY "Customers can view ratings on own bookings"
ON public.booking_ratings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_ratings.booking_id
      AND b.user_id = auth.uid()
  )
);

-- 2) Restrict Realtime channel subscriptions to staff for sensitive channels
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff only realtime for team and worker channels" ON realtime.messages;
CREATE POLICY "Staff only realtime for team and worker channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN (realtime.topic() IN ('team-chat', 'worker-notifications')
          OR realtime.topic() LIKE 'team_messages%'
          OR realtime.topic() LIKE 'worker_notifications%')
      THEN public.is_staff()
    ELSE true
  END
);
