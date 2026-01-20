-- Create a service_packages table to store package pricing by vehicle type
CREATE TABLE public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  duration_estimate text,
  vehicle_type text NOT NULL, -- sedan, suv-5, suv-8, truck
  price numeric NOT NULL,
  sort_order integer DEFAULT 0,
  is_popular boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(service_id, slug, vehicle_type)
);

-- Enable RLS
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active packages"
ON public.service_packages
FOR SELECT
USING (is_active = true OR is_admin());

-- Admins can manage packages
CREATE POLICY "Admins can manage packages"
ON public.service_packages
FOR ALL
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_service_packages_updated_at
BEFORE UPDATE ON public.service_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Get the car detailing service ID (Full Detail)
DO $$
DECLARE
  car_service_id uuid;
BEGIN
  SELECT id INTO car_service_id FROM public.services WHERE slug = 'full-detail';
  
  -- Insert Basic Package prices
  INSERT INTO public.service_packages (service_id, name, slug, description, duration_estimate, vehicle_type, price, sort_order, is_popular)
  VALUES
    (car_service_id, 'Basic Package', 'basic', 'Essential exterior wash and interior wipe-down', '1-2 hours', 'sedan', 79, 1, false),
    (car_service_id, 'Basic Package', 'basic', 'Essential exterior wash and interior wipe-down', '1-2 hours', 'suv-5', 99, 1, false),
    (car_service_id, 'Basic Package', 'basic', 'Essential exterior wash and interior wipe-down', '1-2 hours', 'suv-8', 119, 1, false),
    (car_service_id, 'Basic Package', 'basic', 'Essential exterior wash and interior wipe-down', '1-2 hours', 'truck', 109, 1, false),
    
    -- Insert Silver Package prices
    (car_service_id, 'Silver Package', 'silver', 'Full interior & exterior detail', '3-5 hours', 'sedan', 199, 2, true),
    (car_service_id, 'Silver Package', 'silver', 'Full interior & exterior detail', '3-5 hours', 'suv-5', 249, 2, true),
    (car_service_id, 'Silver Package', 'silver', 'Full interior & exterior detail', '3-5 hours', 'suv-8', 299, 2, true),
    (car_service_id, 'Silver Package', 'silver', 'Full interior & exterior detail', '3-5 hours', 'truck', 279, 2, true),
    
    -- Insert Gold Package prices
    (car_service_id, 'Gold Package', 'gold', 'Comprehensive detail with 2-month sealant & seat shampooing', '5-6 hours', 'sedan', 349, 3, false),
    (car_service_id, 'Gold Package', 'gold', 'Comprehensive detail with 2-month sealant & seat shampooing', '5-6 hours', 'suv-5', 429, 3, false),
    (car_service_id, 'Gold Package', 'gold', 'Comprehensive detail with 2-month sealant & seat shampooing', '5-6 hours', 'suv-8', 499, 3, false),
    (car_service_id, 'Gold Package', 'gold', 'Comprehensive detail with 2-month sealant & seat shampooing', '5-6 hours', 'truck', 469, 3, false);
END $$;