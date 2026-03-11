
CREATE TABLE public.import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  imported_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  error_rows integer NOT NULL DEFAULT 0,
  imported_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import history"
  ON public.import_history
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
