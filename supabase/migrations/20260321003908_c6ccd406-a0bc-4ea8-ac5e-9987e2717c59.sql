
-- Add client_id column to bookings table to link bookings to client records
ALTER TABLE public.bookings ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
