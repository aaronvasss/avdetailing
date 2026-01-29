-- Update the bookings status check constraint to include 'in_progress' and 'no_show' statuses
-- First, drop the existing constraint if it exists
DO $$ 
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_status_check' 
    AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

-- Add the updated constraint with all valid status values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));

-- Update the payment_method constraint to include additional payment methods
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_payment_method_check' 
    AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_payment_method_check;
  END IF;
END $$;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN ('online', 'in_person', 'cash', 'zelle', 'venmo', 'check'));