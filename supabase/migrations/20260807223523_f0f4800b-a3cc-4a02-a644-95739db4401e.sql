-- 1) Additive link from customer_vehicles to clients
ALTER TABLE public.customer_vehicles
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- Allow vehicles for customers with no website login
ALTER TABLE public.customer_vehicles ALTER COLUMN user_id DROP NOT NULL;

-- Every vehicle must belong to a registered user OR a client record
ALTER TABLE public.customer_vehicles
  DROP CONSTRAINT IF EXISTS customer_vehicles_owner_present;
ALTER TABLE public.customer_vehicles
  ADD CONSTRAINT customer_vehicles_owner_present
  CHECK (user_id IS NOT NULL OR client_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS customer_vehicles_client_id_idx ON public.customer_vehicles (client_id);
CREATE INDEX IF NOT EXISTS customer_vehicles_user_id_idx ON public.customer_vehicles (user_id);

-- Prevent accidental duplicates per owner (case-insensitive year/make/model)
CREATE UNIQUE INDEX IF NOT EXISTS customer_vehicles_unique_per_client
  ON public.customer_vehicles (client_id, coalesce(year, 0), lower(coalesce(make, '')), lower(coalesce(model, '')))
  WHERE client_id IS NOT NULL;

-- 2) RLS: staff/admin manage all vehicles; customers keep own-row access
DROP POLICY IF EXISTS "Staff can view all vehicles" ON public.customer_vehicles;
CREATE POLICY "Staff can view all vehicles"
  ON public.customer_vehicles FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "Staff can insert vehicles" ON public.customer_vehicles;
CREATE POLICY "Staff can insert vehicles"
  ON public.customer_vehicles FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can update vehicles" ON public.customer_vehicles;
CREATE POLICY "Staff can update vehicles"
  ON public.customer_vehicles FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can delete vehicles" ON public.customer_vehicles;
CREATE POLICY "Staff can delete vehicles"
  ON public.customer_vehicles FOR DELETE TO authenticated
  USING (public.is_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_vehicles TO authenticated;
GRANT ALL ON public.customer_vehicles TO service_role;

-- 3) Booking-level vehicle snapshot columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS vehicle_color text,
  ADD COLUMN IF NOT EXISTS license_plate text;