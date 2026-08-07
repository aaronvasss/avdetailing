import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SopTemplate, useSopTemplates } from "@/hooks/useSopTemplates";
import { SopBody } from "@/pages/OpsSopLibraryPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ListPlus } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

interface Props {
  jobId: string;
  bookingId: string | null;
  /** Existing checklist labels so we only add what is missing. */
  existingChecklist: string[];
  onChecklistAdded: () => void | Promise<void>;
  canEditChecklist: boolean;
}

/** Inline "View SOP" panel on the job screen, matched to the booked service. */
export function JobSopPanel({
  jobId,
  bookingId,
  existingChecklist,
  onChecklistAdded,
  canEditChecklist,
}: Props) {
  const { templates, loading } = useSopTemplates();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    void (async () => {
      const { data } = await db
        .from("bookings")
        .select("service_id")
        .eq("id", bookingId)
        .maybeSingle();
      setServiceId(data?.service_id ?? null);
    })();
  }, [bookingId]);

  const template: SopTemplate | null = useMemo(() => {
    const active = templates.filter((t) => t.is_active);
    return (
      active.find((t) => t.service_id && t.service_id === serviceId) ||
      active.find((t) => !t.service_id) ||
      null
    );
  }, [templates, serviceId]);

  const sopChecklist = (template?.items ?? []).filter((i) => i.item_type === "checklist");
  const missing = sopChecklist.filter(
    (i) => !existingChecklist.some((label) => label.toLowerCase() === i.label.toLowerCase()),
  );

  const addMissing = async () => {
    if (missing.length === 0) return;
    setAdding(true);
    try {
      const { error } = await db.from("ops_job_checklist").insert(
        missing.map((item, index) => ({
          job_id: jobId,
          item_text: item.label,
          is_required: item.is_required,
          sort_order: existingChecklist.length + index,
        })),
      );
      if (error) throw error;
      toast.success(`Added ${missing.length} SOP step${missing.length === 1 ? "" : "s"}`);
      await onChecklistAdded();
    } catch (e: any) {
      toast.error(e.message || "Could not add SOP steps");
    } finally {
      setAdding(false);
    }
  };

  if (loading || !template) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            SOP
          </CardTitle>
          <p className="truncate text-xs text-muted-foreground">
            {template.title} <Badge variant="outline">v{template.version}</Badge>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "View SOP"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {canEditChecklist && missing.length > 0 && (
            <Button size="sm" variant="secondary" onClick={addMissing} disabled={adding}>
              <ListPlus className="mr-2 h-4 w-4" />
              {adding ? "Adding..." : `Add ${missing.length} SOP step(s) to checklist`}
            </Button>
          )}
          <SopBody template={template} />
        </CardContent>
      )}
    </Card>
  );
}
