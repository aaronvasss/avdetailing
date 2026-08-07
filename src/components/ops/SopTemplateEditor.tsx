import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SopItemType, SopTemplate, SopTemplateItem } from "@/hooks/useSopTemplates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type DraftItem = Omit<SopTemplateItem, "id" | "template_id">;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: SopTemplate | null;
  saving: boolean;
  onSave: (
    template: Partial<SopTemplate> & { id?: string },
    items: DraftItem[],
  ) => Promise<boolean>;
}

const SECTIONS: { type: SopItemType; title: string; hint: string }[] = [
  { type: "checklist", title: "Technician checklist", hint: "Step the technician must tick" },
  { type: "photo_category", title: "Required photo categories", hint: "e.g. Front, Engine bay" },
  { type: "qc_check", title: "QC checklist", hint: "What the manager verifies" },
];

function emptyDraft(): Partial<SopTemplate> {
  return {
    title: "",
    version: "1.0",
    service_id: null,
    instructions: "",
    training_video_url: "",
    required_tools: [],
    required_chemicals: [],
    safety_warnings: "",
    aftercare_instructions: "",
    is_active: true,
  };
}

export function SopTemplateEditor({ open, onOpenChange, template, saving, onSave }: Props) {
  const [draft, setDraft] = useState<Partial<SopTemplate>>(emptyDraft());
  const [items, setItems] = useState<DraftItem[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(template ? { ...template } : emptyDraft());
    setItems(
      (template?.items ?? []).map((i) => ({
        item_type: i.item_type,
        label: i.label,
        phase: i.phase,
        is_required: i.is_required,
        sort_order: i.sort_order,
      })),
    );
  }, [open, template]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setServices((data ?? []) as { id: string; name: string }[]);
    })();
  }, []);

  const listFor = (type: SopItemType) => items.filter((i) => i.item_type === type);

  const addItem = (type: SopItemType) =>
    setItems((prev) => [
      ...prev,
      {
        item_type: type,
        label: "",
        phase: type === "photo_category" ? "before" : null,
        is_required: true,
        sort_order: prev.length,
      },
    ]);

  const updateItem = (item: DraftItem, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i === item ? { ...i, ...patch } : i)));

  const removeItem = (item: DraftItem) => setItems((prev) => prev.filter((i) => i !== item));

  const parseList = (value: string) =>
    value
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);

  const submit = async () => {
    if (!draft.title?.trim()) {
      toast.error("Give this SOP a title");
      return;
    }
    const cleaned = items.filter((i) => i.label.trim());
    const ok = await onSave({ ...draft, id: template?.id }, cleaned);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit SOP" : "New SOP"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>SOP title</Label>
              <Input
                value={draft.title ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Full interior + exterior detail"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Version</Label>
              <Input
                value={draft.version ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, version: e.target.value }))}
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Applies to service</Label>
            <Select
              value={draft.service_id ?? "none"}
              onValueChange={(v) => setDraft((d) => ({ ...d, service_id: v === "none" ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any service</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Written instructions</Label>
            <Textarea
              rows={5}
              value={draft.instructions ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))}
              placeholder="Step-by-step process for this service"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Training video URL</Label>
            <Input
              value={draft.training_video_url ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, training_video_url: e.target.value }))}
              placeholder="https://"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Required tools</Label>
              <Textarea
                rows={3}
                value={(draft.required_tools ?? []).join(", ")}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, required_tools: parseList(e.target.value) }))
                }
                placeholder="Comma separated"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Required chemicals</Label>
              <Textarea
                rows={3}
                value={(draft.required_chemicals ?? []).join(", ")}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, required_chemicals: parseList(e.target.value) }))
                }
                placeholder="Comma separated"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>PPE and safety warnings</Label>
            <Textarea
              rows={3}
              value={draft.safety_warnings ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, safety_warnings: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Customer aftercare instructions</Label>
            <Textarea
              rows={3}
              value={draft.aftercare_instructions ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, aftercare_instructions: e.target.value }))}
            />
          </div>

          {SECTIONS.map((section) => (
            <div key={section.type} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.hint}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(section.type)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              {listFor(section.type).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing added yet.</p>
              ) : (
                <div className="space-y-2">
                  {listFor(section.type).map((item, index) => (
                    <div key={`${section.type}-${index}`} className="flex items-center gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => updateItem(item, { label: e.target.value })}
                        placeholder={section.hint}
                      />
                      {section.type === "photo_category" && (
                        <Select
                          value={item.phase ?? "before"}
                          onValueChange={(v) => updateItem(item, { phase: v as DraftItem["phase"] })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="before">Before</SelectItem>
                            <SelectItem value="during">During</SelectItem>
                            <SelectItem value="after">After</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        <Switch
                          checked={item.is_required}
                          onCheckedChange={(v) => updateItem(item, { is_required: v })}
                        />
                        <span className="text-xs text-muted-foreground">Req</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Switch
              checked={draft.is_active ?? true}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
            />
            <Label>Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save SOP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
