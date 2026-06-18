
DROP POLICY IF EXISTS "Anyone can view active stripe prices" ON public.stripe_prices;
REVOKE SELECT ON public.stripe_prices FROM anon, authenticated;
-- Admin policy and service_role grant remain in place for management and the
-- lookup-stripe-price edge function (which uses the service role).
