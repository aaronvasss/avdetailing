-- Fix RLS policies for profiles and bookings tables
-- The issue is that all policies are RESTRICTIVE (AND logic), so the "Deny anonymous" 
-- policy blocks ALL access including legitimate users. We need PERMISSIVE policies
-- for authenticated user access to work properly.

-- ====== PROFILES TABLE ======
-- Drop the existing RESTRICTIVE policies that should be PERMISSIVE
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create PERMISSIVE SELECT policy for users to view their own profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create PERMISSIVE SELECT policy for admins to view all profiles  
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin());

-- Create PERMISSIVE UPDATE policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ====== BOOKINGS TABLE ======
-- Drop the existing RESTRICTIVE policies that should be PERMISSIVE
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- Create PERMISSIVE SELECT policy for users to view their own bookings
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create PERMISSIVE SELECT policy for admins to view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (is_admin());

-- Create PERMISSIVE UPDATE policy for users to update their own bookings
CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create PERMISSIVE UPDATE policy for admins to update any booking
CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create PERMISSIVE DELETE policy for admins only
CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (is_admin());

-- The INSERT policy "Allow guest and user bookings" remains RESTRICTIVE for guest checkout support