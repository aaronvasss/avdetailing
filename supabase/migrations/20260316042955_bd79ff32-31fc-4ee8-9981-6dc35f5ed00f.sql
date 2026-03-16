-- Add unique constraint on booking_ratings (one rating per booking)
ALTER TABLE public.booking_ratings
  ADD CONSTRAINT booking_ratings_booking_id_unique UNIQUE (booking_id);

-- Add service-role insert policy for worker_notifications from edge functions
CREATE POLICY "Service role can insert notifications"
  ON public.worker_notifications
  FOR INSERT
  TO public
  WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');