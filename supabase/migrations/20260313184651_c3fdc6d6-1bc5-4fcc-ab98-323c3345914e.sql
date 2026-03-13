
-- Worker notifications table
CREATE TABLE public.worker_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'booking',
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own notifications" ON public.worker_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Workers can update own notifications" ON public.worker_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Staff can insert notifications" ON public.worker_notifications
  FOR INSERT TO authenticated WITH CHECK (is_staff());

CREATE POLICY "Admins can manage all notifications" ON public.worker_notifications
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Team messages table
CREATE TABLE public.team_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view team messages" ON public.team_messages
  FOR SELECT TO authenticated USING (is_staff());

CREATE POLICY "Staff can send team messages" ON public.team_messages
  FOR INSERT TO authenticated WITH CHECK (is_staff());

-- Booking ratings table
CREATE TABLE public.booking_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a rating (public rating page)
CREATE POLICY "Anyone can submit a rating" ON public.booking_ratings
  FOR INSERT TO public WITH CHECK (true);

-- Staff and admin can view ratings
CREATE POLICY "Staff can view ratings" ON public.booking_ratings
  FOR SELECT TO authenticated USING (is_staff());

-- Anon can view ratings (for thank you page)
CREATE POLICY "Anon can view own submitted rating" ON public.booking_ratings
  FOR SELECT TO anon USING (true);

-- Enable realtime for team_messages and worker_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_notifications;
