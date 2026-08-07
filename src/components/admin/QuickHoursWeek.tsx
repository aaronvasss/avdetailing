import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  fetchShifts, formatHours, formatMoney, payForMinutes, shiftMinutes, sumShiftMinutes,
  parseHoursInput, minutesToHoursInput, setShiftApproval,
  type ShiftRecord,
} from "@/lib/worker-pay";

interface Props {
  userId: string;
  payRate: number;
  /** Called after a successful save so parent totals refresh. */
  onSaved: () => void;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday of the week containing `d`. */
function startOfWeek(d: Date) {
  const out = new Date(d);
  const dow = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - dow);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function shortDay(d: Date) {
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function QuickHoursWeek({ userId, payRate, onSaved }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const fromDate = dateKey(days[0]);
  const toDate = dateKey(days[6]);
  const todayKey = dateKey(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchShifts({ userId, fromDate, toDate });
    setShifts(rows);

    const byDay: Record<string, number> = {};
    rows.forEach((s) => {
      const key = s.clock_in_at.slice(0, 10);
      byDay[key] = (byDay[key] || 0) + shiftMinutes(s);
    });
    const values: Record<string, string> = {};
    for (let i = 0; i < 7; i++) {
      const key = dateKey(addDays(new Date(`${fromDate}T12:00:00`), i));
      values[key] = minutesToHoursInput(byDay[key] || 0);
    }
    setDrafts(values);
    setInitial(values);
    setLoading(false);
  }, [userId, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftsForDay = (key: string) =>
    shifts
      .filter((s) => s.clock_in_at.slice(0, 10) === key)
      .sort((a, b) => (a.clock_in_at < b.clock_in_at ? -1 : 1));

  const dayMinutes = (key: string) => {
    const parsed = parseHoursInput(drafts[key] || "");
    return parsed ?? 0;
  };

  const weekMinutes = useMemo(
    () => days.reduce((sum, d) => sum + dayMinutes(dateKey(d)), 0),
    [days, drafts],
  );

  const changedDays = days
    .map((d) => dateKey(d))
    .filter((key) => (drafts[key] || "") !== (initial[key] || ""));

  const invalidDay = days
    .map((d) => dateKey(d))
    .find((key) => {
      const raw = (drafts[key] || "").trim();
      if (!raw) return false;
      const parsed = parseHoursInput(raw);
      return parsed === null || parsed > 24 * 60;
    });

  const saveDay = async (key: string) => {
    const raw = (drafts[key] || "").trim();
    const target = raw ? parseHoursInput(raw) ?? 0 : 0;
    const existing = shiftsForDay(key);

    // Clearing / zeroing the day removes its recorded hours.
    if (target <= 0) {
      if (existing.length === 0) return;
      const { error } = await supabase
        .from("worker_shifts")
        .delete()
        .in("id", existing.map((s) => s.id));
      if (error) throw new Error(error.message);
      return;
    }

    if (existing.length === 0) {
      const clockIn = new Date(`${key}T08:00:00`);
      const clockOut = new Date(clockIn.getTime() + target * 60000);
      const { data, error } = await supabase
        .from("worker_shifts")
        .insert({
          user_id: userId,
          clock_in_at: clockIn.toISOString(),
          clock_out_at: clockOut.toISOString(),
          total_minutes: target,
          notes: `Hours entered by admin: ${formatHours(target)}`,
        })
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data?.id) await setShiftApproval([data.id], "approved", "Hours entered by admin");
      return;
    }

    // Apply the new day total to the last shift; earlier shifts keep their time.
    const last = existing[existing.length - 1];
    const others = sumShiftMinutes(existing.slice(0, -1));
    const forLast = target - others;
    if (forLast <= 0) {
      throw new Error(
        `${shortDay(new Date(`${key}T12:00:00`))}: earlier shifts already total ${formatHours(others)}`,
      );
    }
    const prevMinutes = sumShiftMinutes(existing);
    const clockIn = new Date(last.clock_in_at);
    const { error } = await supabase
      .from("worker_shifts")
      .update({
        clock_in_at: clockIn.toISOString(),
        clock_out_at: new Date(clockIn.getTime() + forLast * 60000).toISOString(),
        total_minutes: forLast,
        notes: `Admin set hours: ${formatHours(prevMinutes)} → ${formatHours(target)}`,
      })
      .eq("id", last.id);
    if (error) throw new Error(error.message);
    await setShiftApproval([last.id], "approved", "Hours entered by admin");
  };

  const saveWeek = async () => {
    if (invalidDay) {
      toast.error("Check the highlighted day — use 7.5, 7:30 or 7h 30m");
      return;
    }
    if (changedDays.length === 0) {
      toast.info("Nothing changed this week");
      return;
    }
    setSaving(true);
    try {
      for (const key of changedDays) {
        await saveDay(key);
      }
      toast.success(`Saved ${changedDays.length} day${changedDays.length === 1 ? "" : "s"}`);
      await load();
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save hours");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" /> Quick hours
            </CardTitle>
            <CardDescription>
              Just type hours per day — 7.5, 7:30 or 7h 30m. Saved time is approved right away.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
            >
              This week
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Week of {shortDay(days[0])} → {shortDay(days[6])}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {days.map((d) => {
                const key = dateKey(d);
                const minutes = dayMinutes(key);
                const isInvalid = key === invalidDay;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 rounded-md border p-2"
                  >
                    <p
                      className={
                        key === todayKey
                          ? "w-32 shrink-0 text-sm font-semibold"
                          : "w-32 shrink-0 text-sm"
                      }
                    >
                      {shortDay(d)}
                    </p>
                    <Input
                      inputMode="decimal"
                      placeholder="0"
                      className={isInvalid ? "h-9 max-w-[7rem] border-destructive" : "h-9 max-w-[7rem]"}
                      value={drafts[key] ?? ""}
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [key]: e.target.value }))
                      }
                    />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {minutes > 0
                        ? `${formatHours(minutes)} · ${formatMoney(payForMinutes(minutes, payRate))}`
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <p className="text-sm">
                Week total:{" "}
                <span className="font-semibold">{formatHours(weekMinutes)}</span>{" "}
                <span className="text-muted-foreground">
                  · {formatMoney(payForMinutes(weekMinutes, payRate))}
                </span>
              </p>
              <Button size="sm" onClick={saveWeek} disabled={saving || changedDays.length === 0}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save week
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
