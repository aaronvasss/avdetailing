-- Add stripe_customer_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create stripe_prices table for storing Stripe price mappings
CREATE TABLE public.stripe_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text NOT NULL,
  stripe_price_id text NOT NULL UNIQUE,
  service_type text NOT NULL, -- 'car-detailing', 'paint-correction', etc.
  package_name text NOT NULL, -- 'exterior-only', 'basic', 'silver', 'gold', '1-step', etc.
  vehicle_type text NOT NULL, -- 'car-suv5', 'large'
  price_cents integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create payment_records table for tracking payments
CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES public.customer_memberships(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending', -- pending, succeeded, failed, refunded
  payment_type text NOT NULL, -- 'booking', 'membership', 'addon'
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for stripe_prices (public read, admin write)
CREATE POLICY "Anyone can view active stripe prices"
ON public.stripe_prices FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage stripe prices"
ON public.stripe_prices FOR ALL
USING (is_admin());

-- RLS policies for payment_records
CREATE POLICY "Users can view own payment records"
ON public.payment_records FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage payment records"
ON public.payment_records FOR ALL
USING (is_admin());

-- Service role can insert payment records (for webhooks)
CREATE POLICY "Service role can insert payment records"
ON public.payment_records FOR INSERT
WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');

-- Update membership_plans with stripe_price_id if not exists
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add stripe fields to bookings if not exists
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

-- Create updated_at trigger for new tables
CREATE TRIGGER update_stripe_prices_updated_at
  BEFORE UPDATE ON public.stripe_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();