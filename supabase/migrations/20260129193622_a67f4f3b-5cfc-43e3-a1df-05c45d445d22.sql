-- Create business settings table for configuration
CREATE TABLE public.business_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (these are non-sensitive settings)
CREATE POLICY "Business settings are publicly readable" 
ON public.business_settings 
FOR SELECT 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can modify business settings" 
ON public.business_settings 
FOR ALL 
USING (public.is_admin());

-- Insert the phone number settings
INSERT INTO public.business_settings (key, value, description) VALUES
  ('public_business_phone', '(225) 521-6264', 'Public phone number displayed on website for calls'),
  ('public_business_phone_e164', '+12255216264', 'Public phone in E.164 format for tel: links'),
  ('sms_sender_phone', '+12252394617', 'Twilio phone number for sending SMS notifications');

-- Add trigger for updated_at
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();