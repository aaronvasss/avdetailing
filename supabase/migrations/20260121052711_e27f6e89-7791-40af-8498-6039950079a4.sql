-- Create sms_messages table for storing message history
CREATE TABLE public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  message_sid TEXT,
  status TEXT DEFAULT 'sent',
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage SMS messages
CREATE POLICY "Admins can manage sms_messages"
ON public.sms_messages
FOR ALL
USING (is_admin());

-- Edge functions can insert messages (using service role key)
CREATE POLICY "Service role can insert sms_messages"
ON public.sms_messages
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_sms_messages_created_at ON public.sms_messages(created_at DESC);
CREATE INDEX idx_sms_messages_booking_id ON public.sms_messages(booking_id);