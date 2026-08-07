import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = supabase as any;

export type SopItemType = "checklist" | "photo_category" | "qc_check";

export interface SopTemplateItem {
  id: string;
  template_id: string;
  item_type: SopItemType;
  label: string;
  phase: "before" | "during" | "after" | null;
  is_required: boolean;
  sort_order: number;
}

export interface SopTemplate {
  id: string;
  service_id: string | null;
  title: string;
  version: string;
  instructions: string | null;
  training_video_url: string | null;
  required_tools: string[];
  required_chemicals: string[];
  safety_warnings: string | null;
  aftercare_instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items?: SopTemplateItem[];
  service?: { name: string | null } | null;
}

export function useSopTemplates() {
  const [templates, setTemplates] = useState<SopTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("ops_service_templates")
        .select("*, service:services(name), items:ops_template_items(*)")
        .order("title");
      if (error) throw error;
      const rows = (data ?? []).map((t: SopTemplate) => ({
        ...t,
        items: [...(t.items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
      setTemplates(rows as SopTemplate[]);
    } catch (e: any) {
      console.error("useSopTemplates load failed", e);
      toast.error(e.message || "Could not load the SOP library");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTemplate = useCallback(
    async (
      template: Partial<SopTemplate> & { id?: string },
      items: Omit<SopTemplateItem, "id" | "template_id">[],
    ) => {
      setSaving(true);
      try {
        const payload = {
          service_id: template.service_id || null,
          title: template.title?.trim(),
          version: template.version?.trim() || "1.0",
          instructions: template.instructions || null,
          training_video_url: template.training_video_url || null,
          required_tools: template.required_tools ?? [],
          required_chemicals: template.required_chemicals ?? [],
          safety_warnings: template.safety_warnings || null,
          aftercare_instructions: template.aftercare_instructions || null,
          is_active: template.is_active ?? true,
        };

        let templateId = template.id;
        if (templateId) {
          const { error } = await db
            .from("ops_service_templates")
            .update(payload)
            .eq("id", templateId);
          if (error) throw error;
          const { error: delError } = await db
            .from("ops_template_items")
            .delete()
            .eq("template_id", templateId);
          if (delError) throw delError;
        } else {
          const { data, error } = await db
            .from("ops_service_templates")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw error;
          templateId = data.id;
        }

        if (items.length > 0) {
          const { error } = await db.from("ops_template_items").insert(
            items.map((item, index) => ({
              template_id: templateId,
              item_type: item.item_type,
              label: item.label.trim(),
              phase: item.phase,
              is_required: item.is_required,
              sort_order: index,
            })),
          );
          if (error) throw error;
        }

        toast.success("SOP saved");
        await load();
        return true;
      } catch (e: any) {
        console.error("saveTemplate failed", e);
        toast.error(e.message || "Could not save this SOP");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      try {
        const { error } = await db.from("ops_service_templates").delete().eq("id", id);
        if (error) throw error;
        toast.success("SOP removed");
        await load();
      } catch (e: any) {
        toast.error(e.message || "Could not remove this SOP");
      }
    },
    [load],
  );

  return { templates, loading, saving, reload: load, saveTemplate, deleteTemplate };
}
