import { useMemo, useState } from "react";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { useAuth } from "@/hooks/useAuth";
import { SopTemplate, useSopTemplates } from "@/hooks/useSopTemplates";
import { SopTemplateEditor } from "@/components/ops/SopTemplateEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Plus, Pencil, Trash2, Video, ShieldAlert } from "lucide-react";

export default function OpsSopLibraryPage() {
  const { isManager } = useAuth();
  const { templates, loading, saving, saveTemplate, deleteTemplate } = useSopTemplates();
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SopTemplate | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.service?.name ?? "").toLowerCase().includes(q),
    );
  }, [templates, search]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (template: SopTemplate) => {
    setEditing(template);
    setEditorOpen(true);
  };

  return (
    <WorkerLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">SOP library</h1>
            <p className="text-sm text-muted-foreground">
              Standard operating procedures for every service we run.
            </p>
          </div>
          {isManager && (
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              New SOP
            </Button>
          )}
        </div>

        <Input
          placeholder="Search SOPs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No SOPs yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((template) => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">v{template.version}</Badge>
                      {template.service?.name && <span>{template.service.name}</span>}
                      {!template.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                  </div>
                  {isManager && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <SopBody template={template} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SopTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
        saving={saving}
        onSave={saveTemplate}
      />
    </WorkerLayout>
  );
}

/** Read-only rendering of an SOP, reused by the job screen panel. */
export function SopBody({ template }: { template: SopTemplate }) {
  const items = template.items ?? [];
  const checklist = items.filter((i) => i.item_type === "checklist");
  const photos = items.filter((i) => i.item_type === "photo_category");
  const qc = items.filter((i) => i.item_type === "qc_check");

  return (
    <Accordion type="multiple" className="space-y-2">
      {template.instructions && (
        <AccordionItem value="instructions" className="rounded-lg border px-3">
          <AccordionTrigger className="text-sm font-semibold">Instructions</AccordionTrigger>
          <AccordionContent className="whitespace-pre-wrap pb-3 text-sm text-muted-foreground">
            {template.instructions}
          </AccordionContent>
        </AccordionItem>
      )}

      {(template.required_tools.length > 0 || template.required_chemicals.length > 0) && (
        <AccordionItem value="supplies" className="rounded-lg border px-3">
          <AccordionTrigger className="text-sm font-semibold">Tools & chemicals</AccordionTrigger>
          <AccordionContent className="space-y-2 pb-3 text-sm">
            {template.required_tools.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {template.required_tools.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            {template.required_chemicals.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {template.required_chemicals.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      )}

      {template.safety_warnings && (
        <AccordionItem value="safety" className="rounded-lg border border-destructive/40 px-3">
          <AccordionTrigger className="text-sm font-semibold text-destructive">
            <span className="inline-flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              PPE & safety
            </span>
          </AccordionTrigger>
          <AccordionContent className="whitespace-pre-wrap pb-3 text-sm text-muted-foreground">
            {template.safety_warnings}
          </AccordionContent>
        </AccordionItem>
      )}

      {checklist.length > 0 && (
        <AccordionItem value="checklist" className="rounded-lg border px-3">
          <AccordionTrigger className="text-sm font-semibold">
            Technician checklist ({checklist.length})
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {checklist.map((i) => (
                <li key={i.id}>
                  • {i.label}
                  {!i.is_required && " (optional)"}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {photos.length > 0 && (
        <AccordionItem value="photos" className="rounded-lg border px-3">
          <AccordionTrigger className="text-sm font-semibold">
            Required photos ({photos.length})
          </AccordionTrigger>
          <AccordionContent className="flex flex-wrap gap-1.5 pb-3">
            {photos.map((i) => (
              <Badge key={i.id} variant="outline">
                {i.phase ? `${i.phase}: ` : ""}
                {i.label}
              </Badge>
            ))}
          </AccordionContent>
        </AccordionItem>
      )}

      {qc.length > 0 && (
        <AccordionItem value="qc" className="rounded-lg border px-3">
          <AccordionTrigger className="text-sm font-semibold">
            QC checklist ({qc.length})
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {qc.map((i) => (
                <li key={i.id}>• {i.label}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {template.aftercare_instructions && (
        <AccordionItem value="aftercare" className="rounded-lg border px-3">
          <AccordionTrigger className="text-sm font-semibold">Customer aftercare</AccordionTrigger>
          <AccordionContent className="whitespace-pre-wrap pb-3 text-sm text-muted-foreground">
            {template.aftercare_instructions}
          </AccordionContent>
        </AccordionItem>
      )}

      {template.training_video_url && (
        <a
          href={template.training_video_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline"
        >
          <Video className="h-4 w-4" />
          Training video
        </a>
      )}
    </Accordion>
  );
}
