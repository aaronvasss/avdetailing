CREATE TABLE public.ops_service_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  instructions text,
  training_video_url text,
  required_tools text[] NOT NULL DEFAULT '{}',
  required_chemicals text[] NOT NULL DEFAULT '{}',
  safety_warnings text,
  aftercare_instructions text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_service_templates TO authenticated;
GRANT ALL ON public.ops_service_templates TO service_role;
ALTER TABLE public.ops_service_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view SOP templates"
ON public.ops_service_templates FOR SELECT TO authenticated
USING (public.is_ops_employee());

CREATE POLICY "Managers can create SOP templates"
ON public.ops_service_templates FOR INSERT TO authenticated
WITH CHECK (public.is_manager());

CREATE POLICY "Managers can update SOP templates"
ON public.ops_service_templates FOR UPDATE TO authenticated
USING (public.is_manager()) WITH CHECK (public.is_manager());

CREATE POLICY "Managers can delete SOP templates"
ON public.ops_service_templates FOR DELETE TO authenticated
USING (public.is_manager());

CREATE TRIGGER update_ops_service_templates_updated_at
BEFORE UPDATE ON public.ops_service_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ops_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.ops_service_templates(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('checklist','photo_category','qc_check')),
  label text NOT NULL,
  phase text CHECK (phase IN ('before','during','after')),
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ops_template_items_template_idx ON public.ops_template_items(template_id, item_type, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_template_items TO authenticated;
GRANT ALL ON public.ops_template_items TO service_role;
ALTER TABLE public.ops_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view SOP template items"
ON public.ops_template_items FOR SELECT TO authenticated
USING (public.is_ops_employee());

CREATE POLICY "Managers can create SOP template items"
ON public.ops_template_items FOR INSERT TO authenticated
WITH CHECK (public.is_manager());

CREATE POLICY "Managers can update SOP template items"
ON public.ops_template_items FOR UPDATE TO authenticated
USING (public.is_manager()) WITH CHECK (public.is_manager());

CREATE POLICY "Managers can delete SOP template items"
ON public.ops_template_items FOR DELETE TO authenticated
USING (public.is_manager());