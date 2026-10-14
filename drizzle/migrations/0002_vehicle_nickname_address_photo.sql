ALTER TABLE public.customer_vehicles
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS service_address text,
  ADD COLUMN IF NOT EXISTS photo_path text;

CREATE POLICY "Owners read vehicle photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vehicle-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff()));
CREATE POLICY "Owners upload vehicle photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete vehicle photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-photos' AND (storage.foldername(name))[1] = auth.uid()::text);