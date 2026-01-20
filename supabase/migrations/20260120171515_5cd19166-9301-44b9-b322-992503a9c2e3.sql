-- Fix Guest Booking RLS: Update SELECT policy to protect guest bookings
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

-- Create new policy that protects guest bookings (only admins can see them)
CREATE POLICY "Users can view own bookings" ON public.bookings
FOR SELECT USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND is_admin()) OR 
  is_admin()
);

-- Create separate table for internal/staff notes (admin-only access)
CREATE TABLE IF NOT EXISTS public.booking_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on internal notes
ALTER TABLE public.booking_internal_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can access internal notes
CREATE POLICY "Admins can manage internal notes" ON public.booking_internal_notes
FOR ALL USING (is_admin());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_internal_notes_booking_id 
ON public.booking_internal_notes(booking_id);

-- Create trigger for updated_at
CREATE TRIGGER update_booking_internal_notes_updated_at
BEFORE UPDATE ON public.booking_internal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();