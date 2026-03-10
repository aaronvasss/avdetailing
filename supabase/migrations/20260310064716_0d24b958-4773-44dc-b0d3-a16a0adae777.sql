
CREATE TABLE public.membership_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  service_address text,
  service_city text,
  service_zip text,
  vehicle_type text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  membership_plan_id uuid REFERENCES public.membership_plans(id),
  stripe_checkout_session_id text,
  status text NOT NULL DEFAULT 'pending',
  created_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage membership signups"
  ON public.membership_signups
  FOR ALL
  TO public
  USING (current_setting('request.jwt.claim.role', true) = 'service_role' OR is_admin())
  WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role' OR is_admin());

CREATE POLICY "Anyone can insert membership signups"
  ON public.membership_signups
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE TRIGGER update_membership_signups_updated_at
  BEFORE UPDATE ON public.membership_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
