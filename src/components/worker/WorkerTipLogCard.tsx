import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Wallet, Pencil, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { getBusinessDateString } from "@/lib/workerAssignments";

export interface WorkerTipRow {
  id: string;
  user_id: string;
  tip_date: string;
  amount: number;
  payment_type: string;
  note: string | null;
}

const PAYMENT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "other", label: "Other" },
];

const tipSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Enter a tip amount" })
    .positive("Tip must be more than $0")
    .max(10000, "Tip must be $10,000 or less"),
  tip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  payment_type: z.enum(["cash", "venmo", "zelle", "other"]),
  note: z.string().trim().max(300, "Note must be under 300 characters").optional(),
});

const typeLabel = (value: string) =>
  PAYMENT_TYPES.find((t) => t.value === value)?.label || "Other";

interface Props {
  userId: string;
  rangeStart: string;
  rangeEnd: string;
  rangeLabel?: string;
  tips: WorkerTipRow[];
  onChanged: () => void;
}

export function WorkerTipLogCard({
  userId,
  rangeStart,
  rangeEnd,
  rangeLabel = "this week",
  tips,
  onChanged,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerTipRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [tipDate, setTipDate] = useState(getBusinessDateString());
  const [paymentType, setPaymentType] = useState("cash");
  const [note, setNote] = useState("");

  const rangeTips = useMemo(
    () => tips.filter((t) => t.tip_date >= rangeStart && t.tip_date <= rangeEnd),
    [tips, rangeStart, rangeEnd],
  );

  const rangeTotal = useMemo(
    () => rangeTips.reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [rangeTips],
  );

  const todayStr = getBusinessDateString();
  const todayTotal = useMemo(
    () =>
      tips
        .filter((t) => t.tip_date === todayStr)
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [tips, todayStr],
  );

  const resetForm = useCallback(() => {
    setEditing(null);
    setAmount("");
    setTipDate(getBusinessDateString());
    setPaymentType("cash");
    setNote("");
  }, []);

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (tip: WorkerTipRow) => {
    setEditing(tip);
    setAmount(String(Number(tip.amount)));
    setTipDate(tip.tip_date);
    setPaymentType(tip.payment_type || "cash");
    setNote(tip.note || "");
    setOpen(true);
  };

  const save = async () => {
    const parsed = tipSchema.safeParse({
      amount: Number(amount),
      tip_date: tipDate,
      payment_type: paymentType,
      note: note.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check the tip details");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("worker_tips")
          .update({
            amount: parsed.data.amount,
            tip_date: parsed.data.tip_date,
            payment_type: parsed.data.payment_type,
            note: parsed.data.note ?? null,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Tip updated");
      } else {
        const { error } = await supabase.from("worker_tips").insert({
          user_id: userId,
          amount: parsed.data.amount,
          tip_date: parsed.data.tip_date,
          payment_type: parsed.data.payment_type,
          note: parsed.data.note ?? null,
        });
        if (error) throw error;
        toast.success(`$${parsed.data.amount.toFixed(2)} tip logged`);
      }
      setOpen(false);
      resetForm();
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || "Could not save tip");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tip: WorkerTipRow) => {
    setDeletingId(tip.id);
    try {
      const { error } = await supabase.from("worker_tips").delete().eq("id", tip.id);
      if (error) throw error;
      toast.success("Tip removed");
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || "Could not remove tip");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-500" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">My logged tips</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              ${todayTotal.toFixed(2)} today · ${rangeTotal.toFixed(2)} {rangeLabel}
            </p>
          </div>
          <Button size="sm" className="ml-auto h-8 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Log tip
          </Button>
        </div>

        <div className="mt-2">
          {rangeTips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No cash tips logged {rangeLabel}. Tap Log tip to add one.
            </p>
          ) : (
            rangeTips
              .slice()
              .sort((a, b) => (a.tip_date < b.tip_date ? 1 : -1))
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {format(parseISO(t.tip_date), "EEE, MMM d")}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {typeLabel(t.payment_type)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <p className="text-sm font-semibold text-emerald-500 tabular-nums mr-1">
                      ${Number(t.amount).toFixed(2)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Edit tip"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      aria-label="Delete tip"
                      disabled={deletingId === t.id}
                      onClick={() => remove(t)}
                    >
                      {deletingId === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>

        <Sheet
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="text-left">
              <SheetTitle>{editing ? "Edit tip" : "Log a tip"}</SheetTitle>
              <SheetDescription>
                Record tips you received in person so they show up in your pay.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="tip-amount">Amount</Label>
                <Input
                  id="tip-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="20.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tip-date">Date</Label>
                <Input
                  id="tip-date"
                  type="date"
                  max={getBusinessDateString()}
                  value={tipDate}
                  onChange={(e) => setTipDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Paid with</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tip-note">Note (optional)</Label>
                <Textarea
                  id="tip-note"
                  rows={2}
                  maxLength={300}
                  placeholder="Customer name or job"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={saving} onClick={save}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Save changes" : "Log tip"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
