-- Create clients table for imported Wix customers
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  source TEXT DEFAULT 'wix',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on email for upsert operations (if email exists)
CREATE UNIQUE INDEX idx_clients_email ON public.clients(email) WHERE email IS NOT NULL AND email != '';

-- Create index on phone for lookup
CREATE INDEX idx_clients_phone ON public.clients(phone) WHERE phone IS NOT NULL AND phone != '';

-- Create index on full_name for search
CREATE INDEX idx_clients_full_name ON public.clients(full_name);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admin and staff can do everything with clients
CREATE POLICY "Staff can manage clients"
ON public.clients
FOR ALL
USING (is_staff())
WITH CHECK (is_staff());

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to clients"
ON public.clients
FOR SELECT
USING (false);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();