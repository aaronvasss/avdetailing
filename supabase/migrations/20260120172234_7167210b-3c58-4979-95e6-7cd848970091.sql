-- Add explicit denial policies for anonymous users on sensitive tables
-- This is defense-in-depth to prevent any data leakage to unauthenticated users

-- Profiles table - deny anonymous access
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

-- User roles table - deny anonymous access
CREATE POLICY "Deny anonymous access to user_roles" 
ON public.user_roles 
FOR SELECT 
TO anon 
USING (false);

-- Customer addresses - deny anonymous access
CREATE POLICY "Deny anonymous access to customer_addresses" 
ON public.customer_addresses 
FOR SELECT 
TO anon 
USING (false);

-- Customer vehicles - deny anonymous access
CREATE POLICY "Deny anonymous access to customer_vehicles" 
ON public.customer_vehicles 
FOR SELECT 
TO anon 
USING (false);

-- Customer memberships - deny anonymous access
CREATE POLICY "Deny anonymous access to customer_memberships" 
ON public.customer_memberships 
FOR SELECT 
TO anon 
USING (false);

-- Bookings - deny anonymous access
CREATE POLICY "Deny anonymous access to bookings" 
ON public.bookings 
FOR SELECT 
TO anon 
USING (false);

-- Booking add-ons - deny anonymous access
CREATE POLICY "Deny anonymous access to booking_add_ons" 
ON public.booking_add_ons 
FOR SELECT 
TO anon 
USING (false);

-- Booking internal notes - deny anonymous access (admin table)
CREATE POLICY "Deny anonymous access to booking_internal_notes" 
ON public.booking_internal_notes 
FOR SELECT 
TO anon 
USING (false);

-- Allow users to delete their own booking add-ons (usability fix)
CREATE POLICY "Users can delete own booking add-ons" 
ON public.booking_add_ons 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_add_ons.booking_id 
    AND bookings.user_id = auth.uid()
  )
);