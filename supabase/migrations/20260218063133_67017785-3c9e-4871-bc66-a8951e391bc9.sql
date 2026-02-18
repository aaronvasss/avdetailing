
-- Add stripe_price_id column to service_add_ons
ALTER TABLE public.service_add_ons ADD COLUMN IF NOT EXISTS stripe_price_id text;
