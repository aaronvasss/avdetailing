
-- Add assigned_worker_id column to bookings table
ALTER TABLE public.bookings ADD COLUMN assigned_worker_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster worker assignment lookups
CREATE INDEX idx_bookings_assigned_worker_id ON public.bookings(assigned_worker_id);
