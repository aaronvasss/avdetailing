-- Drop the existing check constraint and recreate with updated values
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Add updated check constraint that includes all valid payment_status values
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('unpaid', 'pending', 'pending_payment', 'paid', 'failed', 'expired'));