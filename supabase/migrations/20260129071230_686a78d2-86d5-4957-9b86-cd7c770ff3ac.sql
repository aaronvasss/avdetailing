-- Add structured internal notes to clients table for CRM functionality
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS gate_code text,
ADD COLUMN IF NOT EXISTS preferences text,
ADD COLUMN IF NOT EXISTS paint_sensitivity text,
ADD COLUMN IF NOT EXISTS total_lifetime_spend numeric DEFAULT 0;

-- Create quotes table for Boat, RV, Aircraft quote requests
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  
  -- Contact info (for guests)
  guest_name text,
  guest_email text,
  guest_phone text,
  
  -- Service details
  service_type text NOT NULL CHECK (service_type IN ('boat', 'rv', 'aircraft')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'declined', 'converted', 'expired')),
  
  -- Vehicle details
  vehicle_length text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_details text,
  
  -- Location
  service_address text,
  service_city text,
  service_state text DEFAULT 'LA',
  service_zip text,
  
  -- Pricing
  estimated_hours numeric,
  quoted_price numeric,
  deposit_amount numeric,
  deposit_required boolean DEFAULT false,
  
  -- Notes
  customer_notes text,
  internal_notes text,
  
  -- Stripe
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  
  -- Linked booking after conversion
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  
  -- Timestamps
  quoted_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create quote photos table
CREATE TABLE IF NOT EXISTS public.quote_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes
CREATE POLICY "Admins can manage all quotes" ON public.quotes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Staff can view all quotes" ON public.quotes
  FOR SELECT USING (is_staff());

CREATE POLICY "Staff can update quotes" ON public.quotes
  FOR UPDATE USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "Users can view own quotes" ON public.quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Deny anonymous access to quotes" ON public.quotes
  FOR SELECT USING (false);

-- RLS Policies for quote_photos
CREATE POLICY "Admins can manage quote photos" ON public.quote_photos
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Staff can manage quote photos" ON public.quote_photos
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "Users can view own quote photos" ON public.quote_photos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.quotes WHERE id = quote_photos.quote_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can upload quote photos" ON public.quote_photos
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes WHERE id = quote_photos.quote_id AND (user_id = auth.uid() OR user_id IS NULL)
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_service_type ON public.quotes(service_type);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_photos_quote_id ON public.quote_photos(quote_id);