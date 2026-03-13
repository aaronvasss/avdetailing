
CREATE TABLE public.booking_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage notification logs"
  ON public.booking_notification_log
  FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

CREATE POLICY "Service role can insert notification logs"
  ON public.booking_notification_log
  FOR INSERT
  TO public
  WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');
