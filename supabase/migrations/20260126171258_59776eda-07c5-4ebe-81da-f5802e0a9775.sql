-- Drop the existing status check constraint and recreate with updated values
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add updated check constraint that includes all valid status values
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));