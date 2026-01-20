-- =============================================
-- AV Detailing Database Schema
-- =============================================

-- 1. Create role enum for admin functionality
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create customer_vehicles table
CREATE TABLE public.customer_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'suv', 'truck', 'boat', 'rv', 'aircraft')),
  make TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  license_plate TEXT,
  size_category TEXT, -- small/medium/large for cars, length for boats, class for RVs
  notes TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_vehicles ENABLE ROW LEVEL SECURITY;

-- 5. Create customer_addresses table
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT, -- e.g., "Home", "Work", "Marina"
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'LA',
  zip_code TEXT NOT NULL,
  notes TEXT, -- gate codes, parking instructions, etc.
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- 6. Create services table (catalog of available services)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- car, boat, rv, aircraft, coating, correction
  base_price NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  vehicle_types TEXT[] DEFAULT ARRAY['car', 'suv', 'truck'],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 7. Create service_add_ons table
CREATE TABLE public.service_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_add_ons ENABLE ROW LEVEL SECURITY;

-- 8. Create membership_plans table
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
  price NUMERIC(10,2) NOT NULL,
  features TEXT[],
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- 9. Create customer_memberships table (active subscriptions)
CREATE TABLE public.customer_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  membership_plan_id UUID REFERENCES public.membership_plans(id) NOT NULL,
  vehicle_id UUID REFERENCES public.customer_vehicles(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_service_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;

-- 10. Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) NOT NULL,
  vehicle_id UUID REFERENCES public.customer_vehicles(id),
  address_id UUID REFERENCES public.customer_addresses(id),
  membership_id UUID REFERENCES public.customer_memberships(id),
  -- Guest booking fields (when user_id is null)
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  -- Booking details
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER,
  -- Vehicle details (copied at booking time for guests or history)
  vehicle_type TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_size TEXT,
  -- Address details (copied at booking time)
  service_address TEXT,
  service_city TEXT,
  service_state TEXT DEFAULT 'LA',
  service_zip TEXT,
  address_notes TEXT,
  -- Pricing
  subtotal NUMERIC(10,2),
  add_ons_total NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  stripe_payment_intent_id TEXT,
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 11. Create booking_add_ons table (selected add-ons for a booking)
CREATE TABLE public.booking_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  add_on_id UUID REFERENCES public.service_add_ons(id),
  name TEXT NOT NULL, -- copied at booking time
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_add_ons ENABLE ROW LEVEL SECURITY;

-- 12. Create time_slots table for availability management
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slot_date, slot_time)
);
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Security Helper Functions
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- =============================================
-- Automatic Triggers
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_vehicles_updated_at
  BEFORE UPDATE ON public.customer_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_memberships_updated_at
  BEFORE UPDATE ON public.customer_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Row Level Security Policies
-- =============================================

-- User Roles policies (users can only see their own roles)
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Customer Vehicles policies
CREATE POLICY "Users can view own vehicles" ON public.customer_vehicles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own vehicles" ON public.customer_vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON public.customer_vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON public.customer_vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Customer Addresses policies
CREATE POLICY "Users can view own addresses" ON public.customer_addresses
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own addresses" ON public.customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.customer_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.customer_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Services policies (public read, admin write)
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (public.is_admin());

-- Service Add-ons policies
CREATE POLICY "Anyone can view active add-ons" ON public.service_add_ons
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage add-ons" ON public.service_add_ons
  FOR ALL USING (public.is_admin());

-- Membership Plans policies (public read, admin write)
CREATE POLICY "Anyone can view active plans" ON public.membership_plans
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage plans" ON public.membership_plans
  FOR ALL USING (public.is_admin());

-- Customer Memberships policies
CREATE POLICY "Users can view own memberships" ON public.customer_memberships
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own memberships" ON public.customer_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships" ON public.customer_memberships
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (public.is_admin());

-- Booking Add-ons policies
CREATE POLICY "Users can view booking add-ons" ON public.booking_add_ons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_add_ons.booking_id 
      AND (bookings.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Users can insert booking add-ons" ON public.booking_add_ons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_add_ons.booking_id 
      AND (bookings.user_id = auth.uid() OR bookings.user_id IS NULL)
    )
  );

-- Time Slots policies (public read for available slots)
CREATE POLICY "Anyone can view available slots" ON public.time_slots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage time slots" ON public.time_slots
  FOR ALL USING (public.is_admin());