
-- Referral codes table - each user gets a unique referral code
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Referral rewards table - tracks each referral and credit usage
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  reward_amount numeric NOT NULL DEFAULT 10,
  is_redeemed boolean NOT NULL DEFAULT false,
  redeemed_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Referral codes policies
CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON public.referral_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can look up referral codes" ON public.referral_codes
  FOR SELECT TO public USING (true);

-- Referral rewards policies
CREATE POLICY "Users can view own rewards" ON public.referral_rewards
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Users can update own rewards" ON public.referral_rewards
  FOR UPDATE TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Service role can manage rewards" ON public.referral_rewards
  FOR ALL TO public USING (current_setting('request.jwt.claim.role', true) = 'service_role') 
  WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');

CREATE POLICY "Admins can manage all rewards" ON public.referral_rewards
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can insert rewards" ON public.referral_rewards
  FOR INSERT TO public WITH CHECK (true);
