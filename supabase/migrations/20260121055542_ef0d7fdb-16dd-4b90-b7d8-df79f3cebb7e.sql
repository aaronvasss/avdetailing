-- Add service-specific packages for non-car services

-- Ceramic Coating packages
INSERT INTO public.service_packages (name, slug, description, duration_estimate, vehicle_type, price, sort_order, is_popular, service_id)
VALUES 
  ('Ceramic Lite', 'ceramic-lite', '1-year protection with single-layer coating', '4-6 hours', 'car', 499, 1, false, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Lite', 'ceramic-lite', '1-year protection with single-layer coating', '4-6 hours', 'suv', 599, 1, false, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Lite', 'ceramic-lite', '1-year protection with single-layer coating', '4-6 hours', 'truck', 649, 1, false, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Pro', 'ceramic-pro', '3-year protection with dual-layer coating & paint correction', '1-2 days', 'car', 899, 2, true, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Pro', 'ceramic-pro', '3-year protection with dual-layer coating & paint correction', '1-2 days', 'suv', 1099, 2, true, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Pro', 'ceramic-pro', '3-year protection with dual-layer coating & paint correction', '1-2 days', 'truck', 1199, 2, true, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Elite', 'ceramic-elite', '5+ year protection with multi-layer system & annual maintenance', '2-3 days', 'car', 1499, 3, false, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Elite', 'ceramic-elite', '5+ year protection with multi-layer system & annual maintenance', '2-3 days', 'suv', 1799, 3, false, '5017f8e7-3046-4dc4-8254-3bf04c962818'),
  ('Ceramic Elite', 'ceramic-elite', '5+ year protection with multi-layer system & annual maintenance', '2-3 days', 'truck', 1999, 3, false, '5017f8e7-3046-4dc4-8254-3bf04c962818');

-- Paint Correction packages
INSERT INTO public.service_packages (name, slug, description, duration_estimate, vehicle_type, price, sort_order, is_popular, service_id)
VALUES 
  ('1-Step Polish', 'polish-1', 'Light correction for minor swirls', '4-5 hours', 'car', 249, 1, false, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('1-Step Polish', 'polish-1', 'Light correction for minor swirls', '5-6 hours', 'suv', 299, 1, false, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('1-Step Polish', 'polish-1', 'Light correction for minor swirls', '5-6 hours', 'truck', 329, 1, false, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('2-Step Correction', 'polish-2', 'Moderate correction for swirls & water spots', '6-8 hours', 'car', 449, 2, true, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('2-Step Correction', 'polish-2', 'Moderate correction for swirls & water spots', '7-9 hours', 'suv', 549, 2, true, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('2-Step Correction', 'polish-2', 'Moderate correction for swirls & water spots', '7-9 hours', 'truck', 599, 2, true, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('3-Step Restoration', 'polish-3', 'Full paint restoration for heavy defects', '10-12 hours', 'car', 699, 3, false, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('3-Step Restoration', 'polish-3', 'Full paint restoration for heavy defects', '12-14 hours', 'suv', 849, 3, false, '806e631d-f058-4cd7-9318-582c60b10a32'),
  ('3-Step Restoration', 'polish-3', 'Full paint restoration for heavy defects', '12-14 hours', 'truck', 949, 3, false, '806e631d-f058-4cd7-9318-582c60b10a32');

-- Boat Detailing packages
INSERT INTO public.service_packages (name, slug, description, duration_estimate, vehicle_type, price, sort_order, is_popular, service_id)
VALUES 
  ('Boat Wash & Wax', 'boat-basic', 'Exterior wash, wax, and vinyl cleaning', '2-3 hours', 'boat', 199, 1, false, 'c15abb75-415f-499e-a681-7ce59e2faaa5'),
  ('Boat Full Detail', 'boat-full', 'Complete interior & exterior detail with oxidation removal', '4-6 hours', 'boat', 399, 2, true, 'c15abb75-415f-499e-a681-7ce59e2faaa5'),
  ('Boat Premium Detail', 'boat-premium', 'Full detail + compound polish & ceramic sealant', '6-8 hours', 'boat', 649, 3, false, 'c15abb75-415f-499e-a681-7ce59e2faaa5');

-- RV Detailing packages
INSERT INTO public.service_packages (name, slug, description, duration_estimate, vehicle_type, price, sort_order, is_popular, service_id)
VALUES 
  ('RV Exterior Wash', 'rv-basic', 'Full exterior wash, roof cleaning, and tire shine', '3-4 hours', 'rv', 249, 1, false, '895a1ea3-4309-4a75-9406-555cf568b370'),
  ('RV Full Detail', 'rv-full', 'Complete interior & exterior detail', '6-8 hours', 'rv', 499, 2, true, '895a1ea3-4309-4a75-9406-555cf568b370'),
  ('RV Premium Detail', 'rv-premium', 'Full detail + oxidation removal & wax protection', '8-10 hours', 'rv', 799, 3, false, '895a1ea3-4309-4a75-9406-555cf568b370');

-- Aircraft Detailing packages
INSERT INTO public.service_packages (name, slug, description, duration_estimate, vehicle_type, price, sort_order, is_popular, service_id)
VALUES 
  ('Aircraft Exterior Wash', 'aircraft-basic', 'Exterior wash & brightwork polish', '3-4 hours', 'aircraft', 349, 1, false, '71c8e20e-4bdf-42b8-ba46-d7565121c9d9'),
  ('Aircraft Full Detail', 'aircraft-full', 'Complete interior & exterior detail', '5-7 hours', 'aircraft', 599, 2, true, '71c8e20e-4bdf-42b8-ba46-d7565121c9d9'),
  ('Aircraft Premium Detail', 'aircraft-premium', 'Full detail + leather treatment & paint correction', '8-10 hours', 'aircraft', 999, 3, false, '71c8e20e-4bdf-42b8-ba46-d7565121c9d9');