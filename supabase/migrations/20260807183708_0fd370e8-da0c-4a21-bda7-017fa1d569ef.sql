CREATE POLICY "Admins create shifts for workers"
ON public.worker_shifts
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());