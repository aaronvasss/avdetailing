-- Add calendar_token column to profiles for ICS subscription authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS calendar_token TEXT;

-- Create a function to generate a unique calendar token
CREATE OR REPLACE FUNCTION public.generate_calendar_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Update existing profiles with a calendar token
UPDATE public.profiles 
SET calendar_token = encode(gen_random_bytes(32), 'hex')
WHERE calendar_token IS NULL;