import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CalendarRange, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import {
  fetchShifts, formatHours, formatMoney, payForMinutes, shiftMinutes,
  parseHoursInput, minutesToHoursInput, saveDayHours,
  type ShiftRecord,
} from "@/lib/worker-pay";

export interface TimesheetWorker {
  user_id: string;
  full_name: string | null;
  email: string | null;
  pay_rate: number;
}

interface Props {
  workers: TimesheetWorker[];
  /** Shifts already fetched by the parent payroll tab, reused when they cover the shown week. */
  sharedShifts?: ShiftRecord[];
  sharedFrom?: string;
  sharedTo?: string;
  /** Called after a successful save so parent payroll totals refresh. */
  onSaved: () => void;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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

function dayHeader(d: Date) {
  return {
    dow: d.toLocaleDateString([], { weekday: "short" }),
    day: d.toLocaleDateString([], { month: "numeric", day: "numeric" }),
  };
}

function longDay(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

const cellKey = (userId: string, day: string) => `${userId}|${day}`;

export function PayrollTimesheetGrid({ workers, onSaved }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"week" | "today" | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const dayKeys = useMemo(() => days.map(dateKey), [days]);
  const fromDate = dayKeys[0];
  const toDate = dayKeys[6];
  const todayKey = dateKey(new Date());
  const workerIds = useMemo(() => workers.map((w) => w.user_id).join(","), [workers]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchShifts({ fromDate, toDate });
      const ids = new Set(workerIds ? workerIds.split(",") : []);
      const mine = rows.filter((s) => ids.has(s.user_id));
      setShifts(mine);

      const byCell: Record<string, number> = {};
      mine.forEach((s) => {
        const k = cellKey(s.user_id, s.clock_in_at.slice(0, 10));
        byCell[k] = (byCell[k] || 0) + shiftMinutes(s);
      });
      const values: Record<string, string> = {};
      ids.forEach((uid) => {
        dayKeys.forEach((day) => {
          const k = cellKey(uid, day);
          values[k] = minutesToHoursInput(byCell[k] || 0);
        });
      });
      setDrafts(values);
      setInitial(values);
    } catch (e: any) {
      setLoadError(e?.message || "Could not load timesheet data");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, dayKeys, workerIds]);


  useEffect(() => {
    load();
  }, [load]);

  const shiftsForCell = useCallback(
    (userId: string, day: string) =>
      shifts.filter((s) => s.user_id === userId && s.clock_in_at.slice(0, 10) === day),
    [shifts],
  );

  const cellMinutes = (k: string) => parseHoursInput(drafts[k] || "") ?? 0;

  const isInvalid = (k: string) => {
    const raw = (drafts[k] || "").trim();
    if (!raw) return false;
    const parsed = parseHoursInput(raw);
    return parsed === null || parsed > 24 * 60;
  };

  const isChanged = (k: string) => (drafts[k] || "") !== (initial[k] || "");

  const hasOpenShift = useCallback(
    (userId: string, day: string) => shiftsForCell(userId, day).some((s) => !s.clock_out_at),
    [shiftsForCell],
  );

  const changedCells = useMemo(
    () =>
      workers.flatMap((w) =>
        dayKeys
          .map((day) => cellKey(w.user_id, day))
          .filter((k) => isChanged(k) && !isInvalid(k)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workers, dayKeys, drafts, initial],
  );

  const anyInvalid = useMemo(
    () =>
      workers.some((w) => dayKeys.some((day) => isInvalid(cellKey(w.user_id, day)))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workers, dayKeys, drafts],
  );

  const rowMinutes = (userId: string) =>
    dayKeys.reduce((sum, day) => sum + cellMinutes(cellKey(userId, day)), 0);

  const columnMinutes = (day: string) =>
    workers.reduce((sum, w) => sum + cellMinutes(cellKey(w.user_id, day)), 0);

  const weekMinutes = workers.reduce((sum, w) => sum + rowMinutes(w.user_id), 0);
  const weekPay = workers.reduce(
    (sum, w) => sum + payForMinutes(rowMinutes(w.user_id), w.pay_rate),
    0,
  );

  const save = async (cells: string[], mode: "week" | "today") => {
    if (anyInvalid) {
      toast.error("Check the highlighted cells — use 7.5, 7:30 or 7h 30m");
      return;
    }
    if (cells.length === 0) {
      toast.info("Nothing changed yet");
      return;
    }
    setSaving(mode);
    let saved = 0;
    try {
      for (const k of cells) {
        const [userId, day] = k.split("|");
        if (hasOpenShift(userId, day)) continue;
        const raw = (drafts[k] || "").trim();
        await saveDayHours({
          userId,
          dateKey: day,
          targetMinutes: raw ? parseHoursInput(raw) ?? 0 : 0,
          existingShifts: shiftsForCell(userId, day),
        });
        saved++;
      }
      toast.success(`Saved ${saved} entr${saved === 1 ? "y" : "ies"}`);
      await load();
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save hours");
      await load();
    } finally {
      setSaving(null);
    }
  };

  const todayCells = workers
    .map((w) => cellKey(w.user_id, todayKey))
    .filter((k) => isChanged(k) && !isInvalid(k));
  const todayInWeek = dayKeys.includes(todayKey);

  if (workers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="h-4 w-4" /> Weekly timesheet
            </CardTitle>
            <CardDescription>
              Type hours for any worker on any day — 7.5, 7:30 or 7h 30m. Saved time is approved right away.
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
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm font-semibold">We couldn't load these hours</p>
            <p className="text-sm text-muted-foreground max-w-md">{loadError}</p>
            <Button size="sm" variant="outline" onClick={() => load()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {todayInWeek && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Today — {longDay(new Date())}</p>
                  <Button
                    size="sm"
                    onClick={() => save(todayCells, "today")}
                    disabled={saving !== null || todayCells.length === 0}
                  >
                    {saving === "today" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save today
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {workers.map((w) => {
                    const k = cellKey(w.user_id, todayKey);
                    const open = hasOpenShift(w.user_id, todayKey);
                    const minutes = cellMinutes(k);
                    return (
                      <div key={k} className="flex items-center gap-2 rounded-md border bg-background p-2">
                        <p className="flex-1 truncate text-sm">{w.full_name || w.email || "Worker"}</p>
                        <Input
                          inputMode="decimal"
                          placeholder="0"
                          disabled={open}
                          className={`h-9 w-20 text-center ${
                            isInvalid(k)
                              ? "border-destructive"
                              : isChanged(k)
                                ? "border-primary"
                                : ""
                          }`}
                          value={drafts[k] ?? ""}
                          onChange={(e) => setDrafts((p) => ({ ...p, [k]: e.target.value }))}
                        />
                        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                          {open
                            ? "clocked in"
                            : minutes > 0
                              ? formatMoney(payForMinutes(minutes, w.pay_rate))
                              : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-background px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                      Worker
                    </th>
                    {days.map((d) => {
                      const h = dayHeader(d);
                      const isToday = dateKey(d) === todayKey;
                      return (
                        <th
                          key={dateKey(d)}
                          className={`px-1 py-2 text-center text-xs font-medium ${
                            isToday ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <span className={isToday ? "font-bold" : ""}>{h.dow}</span>
                          <br />
                          <span className="text-[10px]">{h.day}</span>
                        </th>
                      );
                    })}
                    <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => {
                    const total = rowMinutes(w.user_id);
                    return (
                      <tr key={w.user_id}>
                        <td className="sticky left-0 z-10 max-w-[160px] truncate border-t bg-background px-2 py-2">
                          {w.full_name || w.email || "Worker"}
                        </td>
                        {dayKeys.map((day) => {
                          const k = cellKey(w.user_id, day);
                          const open = hasOpenShift(w.user_id, day);
                          const multi = shiftsForCell(w.user_id, day).length > 1;
                          return (
                            <td key={k} className="border-t px-1 py-1.5 text-center">
                              <div className="relative">
                                <Input
                                  inputMode="decimal"
                                  placeholder="—"
                                  disabled={open}
                                  title={
                                    open
                                      ? "Worker is currently clocked in"
                                      : multi
                                        ? "Multiple shifts this day — open Hours & Shifts for detail"
                                        : undefined
                                  }
                                  className={`mx-auto h-9 w-[62px] px-1 text-center ${
                                    isInvalid(k)
                                      ? "border-destructive"
                                      : isChanged(k)
                                        ? "border-primary"
                                        : ""
                                  }`}
                                  value={drafts[k] ?? ""}
                                  onChange={(e) =>
                                    setDrafts((p) => ({ ...p, [k]: e.target.value }))
                                  }
                                />
                                {multi && (
                                  <span className="pointer-events-none absolute -right-0.5 -top-0.5 text-[10px] text-muted-foreground">
                                    *
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="border-t px-2 py-2 text-right">
                          <span className="font-semibold">{formatHours(total)}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {formatMoney(payForMinutes(total, w.pay_rate))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="sticky left-0 z-10 border-t bg-background px-2 py-2 text-xs text-muted-foreground">
                      Day totals
                    </td>
                    {dayKeys.map((day) => (
                      <td
                        key={day}
                        className="border-t px-1 py-2 text-center text-xs text-muted-foreground"
                      >
                        {columnMinutes(day) > 0 ? formatHours(columnMinutes(day)) : "—"}
                      </td>
                    ))}
                    <td className="border-t px-2 py-2 text-right text-xs font-semibold">
                      {formatHours(weekMinutes)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <p className="text-sm">
                Week total: <span className="font-semibold">{formatHours(weekMinutes)}</span>{" "}
                <span className="text-muted-foreground">· {formatMoney(weekPay)}</span>
                {changedCells.length > 0 && (
                  <span className="ml-2 text-xs text-primary">
                    {changedCells.length} unsaved change{changedCells.length === 1 ? "" : "s"}
                  </span>
                )}
              </p>
              <Button
                size="sm"
                onClick={() => save(changedCells, "week")}
                disabled={saving !== null || changedCells.length === 0}
              >
                {saving === "week" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save week
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              * day has more than one shift — the typed total adjusts the last shift. Cells for a worker
              currently clocked in are locked.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
