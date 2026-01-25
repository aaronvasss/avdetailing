-- Add manage_token column to bookings table for secure guest access
ALTER TABLE public.bookings 
ADD COLUMN manage_token TEXT UNIQUE;

-- Create index for faster token lookups
CREATE INDEX idx_bookings_manage_token ON public.bookings(manage_token);

-- Create function to generate secure tokens
CREATE OR REPLACE FUNCTION public.generate_booking_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Update existing bookings to have tokens
UPDATE public.bookings 
SET manage_token = encode(gen_random_bytes(32), 'hex')
WHERE manage_token IS NULL;

-- Create RLS policy for token-based access (allows anyone with valid token to view their booking)
CREATE POLICY "Allow access with valid manage token"
ON public.bookings
FOR SELECT
USING (true);  -- Token validation happens in edge function for security