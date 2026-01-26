-- Add payment_method column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'in_person';

-- Add comment for clarity
COMMENT ON COLUMN public.bookings.payment_method IS 'Payment method: in_person or online';