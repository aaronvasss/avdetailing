CREATE POLICY "Employees can view ops media files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ops-media' AND public.is_ops_employee());

CREATE POLICY "Staff can upload ops media files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ops-media' AND (public.is_staff() OR public.is_manager()));

CREATE POLICY "Staff can update ops media files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ops-media' AND (public.is_staff() OR public.is_manager()));

CREATE POLICY "Managers can delete ops media files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ops-media' AND public.is_manager());