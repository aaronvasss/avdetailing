
-- Worker profiles table
CREATE TABLE public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  phone text,
  pay_type text NOT NULL DEFAULT 'flat' CHECK (pay_type IN ('flat', 'percentage')),
  pay_rate numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

-- Admin can manage all worker profiles
CREATE POLICY "Admins can manage worker profiles" ON public.worker_profiles
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Workers can view own profile
CREATE POLICY "Workers can view own profile" ON public.worker_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Workers can update own profile (limited fields)
CREATE POLICY "Workers can update own profile" ON public.worker_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Booking checklist items table
CREATE TABLE public.booking_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_text text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_checklist_items ENABLE ROW LEVEL SECURITY;

-- Staff can manage checklist items
CREATE POLICY "Staff can manage checklist items" ON public.booking_checklist_items
  FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- Admin can manage checklist items
CREATE POLICY "Admins can manage checklist items" ON public.booking_checklist_items
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
