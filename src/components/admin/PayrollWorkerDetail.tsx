import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Clock, Loader2, Pencil, Plus, Trash2, Briefcase, CheckCircle2, XCircle, Undo2,
} from "lucide-react";
import {
  fetchShifts, formatHours, formatDecimalHours, formatMoney, payForMinutes,
  shiftMinutes, sumShiftMinutes, sumApprovedShiftMinutes, approvedShifts,
  pendingShifts, shiftApprovalStatus, setShiftApproval,
  parseHoursInput, minutesToHoursInput,
  type ShiftApprovalStatus, type ShiftRecord,
} from "@/lib/worker-pay";

import type { PayrollWorker } from "@/components/admin/AdminPayrollTab";

interface Props {
  worker: PayrollWorker;
  fromDate: string;
  toDate: string;
  onBack: () => void;
}

interface JobRow {
  id: string;
  scheduled_date: string;
  completed_at: string | null;
  actual_duration_minutes: number | null;
  duration_minutes: number | null;
  guest_name: string | null;
  status: string;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function timeLabel(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function weekKey(iso: string) {
  const d = new Date(iso);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function PayrollWorkerDetail({ worker, fromDate, toDate, onBack }: Props) {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingApproval, setUpdatingApproval] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    id: string | null;
    mode: "hours" | "times";
    date: string;
    hours: string;
    clockIn: string;
    clockOut: string;
    notes: string;
    prevMinutes: number | null;
    otherMinutes: number;
    hint: string | null;
  } | null>(null);




  const load = useCallback(async () => {
    setLoading(true);
    const [rows, { data: bookings }] = await Promise.all([
      fetchShifts({ userId: worker.user_id, fromDate, toDate }),
      supabase
        .from("bookings")
        .select(
          "id, scheduled_date, completed_at, actual_duration_minutes, duration_minutes, guest_name, status",
        )
        .eq("assigned_worker_id", worker.user_id)
        .gte("scheduled_date", fromDate)
        .lte("scheduled_date", toDate)
        .order("scheduled_date", { ascending: false }),
    ]);
    setShifts(rows);
    setJobs((bookings as JobRow[]) || []);
    setLoading(false);
  }, [worker.user_id, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  const totalMinutes = useMemo(() => sumApprovedShiftMinutes(shifts), [shifts]);
  const totalPay = payForMinutes(totalMinutes, worker.pay_rate);
  const pending = useMemo(() => pendingShifts(shifts), [shifts]);
  const pendingMinutes = useMemo(() => sumShiftMinutes(pending), [pending]);

  const changeApproval = async (ids: string[], status: ShiftApprovalStatus, key: string) => {
    if (ids.length === 0) return;
    setUpdatingApproval(key);
    const { error } = await setShiftApproval(ids, status);
    setUpdatingApproval(null);
    if (error) {
      toast.error(error || "Failed to update approval");
      return;
    }
    toast.success(
      status === "approved"
        ? `Approved ${ids.length} shift${ids.length === 1 ? "" : "s"}`
        : status === "rejected"
          ? "Shift rejected"
          : "Shift set back to pending",
    );
    load();
  };

  const byDay = useMemo(() => {
    const map = new Map<string, ShiftRecord[]>();
    [...shifts]
      .sort((a, b) => (a.clock_in_at < b.clock_in_at ? 1 : -1))
      .forEach((s) => {
        const key = s.clock_in_at.slice(0, 10);
        map.set(key, [...(map.get(key) || []), s]);
      });
    return [...map.entries()];
  }, [shifts]);

  const byWeek = useMemo(() => {
    const map = new Map<string, number>();
    approvedShifts(shifts).forEach((s) => {
      const key = weekKey(s.clock_in_at);
      map.set(key, (map.get(key) || 0) + shiftMinutes(s));
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [shifts]);

  const jobMinutesTotal = useMemo(
    () => jobs.reduce((sum, j) => sum + (Number(j.actual_duration_minutes) || 0), 0),
    [jobs],
  );

  const openEditor = (shift?: ShiftRecord) => {
    const minutes = shift ? shiftMinutes(shift) : 0;
    setEditing({
      id: shift?.id ?? null,
      mode: "hours",
      date: shift ? shift.clock_in_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      hours: minutesToHoursInput(minutes),
      clockIn: shift ? toLocalInput(shift.clock_in_at) : toLocalInput(new Date().toISOString()),
      clockOut: shift ? toLocalInput(shift.clock_out_at) : "",
      notes: "",
      prevMinutes: shift ? minutes : null,
      otherMinutes: 0,
      hint: null,

    });
  };

  /** Quick "hours worked" edit for a whole day. */
  const openDayEditor = (day: string, dayShifts: ShiftRecord[]) => {
    const sorted = [...dayShifts].sort((a, b) => (a.clock_in_at < b.clock_in_at ? -1 : 1));
    const target = sorted[sorted.length - 1];
    const dayMinutes = sumShiftMinutes(dayShifts);
    const otherMinutes = dayMinutes - (target ? shiftMinutes(target) : 0);

    setEditing({
      id: target?.id ?? null,
      mode: "hours",
      date: day,
      hours: minutesToHoursInput(dayMinutes),
      clockIn: target ? toLocalInput(target.clock_in_at) : `${day}T08:00`,
      clockOut: target ? toLocalInput(target.clock_out_at) : "",
      notes: "",
      prevMinutes: dayMinutes || null,
      otherMinutes,

      hint:
        dayShifts.length > 1
          ? `This day has ${dayShifts.length} shifts (${formatHours(otherMinutes)} on the earlier ones). The new total is applied to the last shift of the day.`
          : dayShifts.length === 0
            ? "No shift exists for this day yet — a new one will be created."
            : null,
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    let clockIn: string | null;
    let clockOut: string | null;
    let totals: number | null;

    if (editing.mode === "hours") {
      const dayMinutes = parseHoursInput(editing.hours);
      if (dayMinutes === null || dayMinutes <= 0) {
        toast.error("Enter hours worked, e.g. 7.5 or 7h 30m");
        return;
      }
      if (dayMinutes > 24 * 60) {
        toast.error("Hours can't be more than 24 in one day");
        return;
      }
      // Keep other shifts on the day intact; the remainder goes on this shift.
      const otherMinutes = Math.max(0, (editing.prevMinutes ?? 0) - (editing.id ? 0 : 0));
      void otherMinutes;

      const baseIn =
        fromLocalInput(editing.clockIn) ||
        fromLocalInput(`${editing.date}T08:00`);
      if (!baseIn) {
        toast.error("Pick a valid date for this shift");
        return;
      }
      clockIn = baseIn;
      clockOut = new Date(new Date(baseIn).getTime() + dayMinutes * 60000).toISOString();
      totals = dayMinutes;
    } else {
      clockIn = fromLocalInput(editing.clockIn);
      if (!clockIn) {
        toast.error("Clock in time is required");
        return;
      }
      clockOut = fromLocalInput(editing.clockOut);
      if (clockOut && new Date(clockOut) <= new Date(clockIn)) {
        toast.error("Clock out must be after clock in");
        return;
      }
      totals = clockOut
        ? Math.round((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000)
        : null;
    }

    const auditNote = [
      editing.notes.trim(),
      `Admin set hours: ${formatHours(editing.prevMinutes ?? 0)} → ${formatHours(totals ?? 0)}`,
    ]
      .filter(Boolean)
      .join(" — ");

    setSaving(true);
    let error;
    let savedId = editing.id;
    if (editing.id) {
      ({ error } = await supabase
        .from("worker_shifts")
        .update({
          clock_in_at: clockIn,
          clock_out_at: clockOut,
          total_minutes: totals,
          notes: auditNote,
        })
        .eq("id", editing.id));
    } else {
      const { data, error: insertError } = await supabase
        .from("worker_shifts")
        .insert({
          user_id: worker.user_id,
          clock_in_at: clockIn,
          clock_out_at: clockOut,
          total_minutes: totals,
          notes: auditNote || "Added by admin",
        })
        .select("id")
        .maybeSingle();
      error = insertError;
      savedId = data?.id ?? null;
    }

    if (!error && savedId && totals != null) {
      // Admin-entered time is trusted, so it counts toward payroll right away.
      await setShiftApproval([savedId], "approved", editing.notes.trim() || "Hours entered by admin");
    }
    setSaving(false);

    if (error) {
      toast.error(error.message || "Failed to save shift");
      return;
    }
    toast.success(editing.id ? "Hours updated" : "Shift added");
    setEditing(null);
    load();
  };


  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("worker_shifts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete shift");
      return;
    }
    toast.success("Shift deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to payroll
        </Button>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <Button
              size="sm"
              disabled={updatingApproval !== null}
              onClick={() => changeApproval(pending.map((s) => s.id), "approved", "bulk")}
            >
              {updatingApproval === "bulk" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve {pending.length} pending
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openEditor()}>
            <Plus className="mr-2 h-4 w-4" /> Add Shift
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{worker.full_name || "Unknown"}</CardTitle>
          <CardDescription>
            {fromDate} → {toDate} · {formatMoney(worker.pay_rate)}/hr
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Approved hours</p>
            <p className="text-2xl font-bold">{formatHours(totalMinutes)}</p>
            <p className="text-xs text-muted-foreground">{formatDecimalHours(totalMinutes)} hrs</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Approved pay</p>
            <p className="text-2xl font-bold">{formatMoney(totalPay)}</p>
            <p className="text-xs text-muted-foreground">
              {pending.length > 0
                ? `${formatHours(pendingMinutes)} awaiting approval`
                : "Nothing awaiting approval"}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Time logged on jobs</p>
            <p className="text-2xl font-bold">{formatHours(jobMinutesTotal)}</p>
            <p className="text-xs text-muted-foreground">{jobs.length} jobs assigned</p>
          </div>
        </CardContent>
      </Card>

      {byWeek.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byWeek.map(([wk, minutes]) => (
              <div key={wk} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Week of {dayLabel(`${wk}T12:00:00`)}</span>
                <span className="font-medium">
                  {formatHours(minutes)} · {formatMoney(payForMinutes(minutes, worker.pay_rate))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Shifts
          </CardTitle>
          <CardDescription>
            Approve shifts so they count toward payroll, or edit clock in/out times to correct hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : byDay.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No shifts recorded in this range
            </p>
          ) : (
            byDay.map(([day, dayShifts]) => {
              const dayMinutes = sumApprovedShiftMinutes(dayShifts);
              return (
                <div key={day} className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <p className="text-sm font-medium">{dayLabel(`${day}T12:00:00`)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatHours(dayMinutes)} · {formatMoney(payForMinutes(dayMinutes, worker.pay_rate))}
                    </p>
                  </div>
                  {dayShifts.map((s) => {
                    const minutes = shiftMinutes(s);
                    const status = shiftApprovalStatus(s);
                    return (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                      >
                        <div className="text-sm">
                          <p className="font-medium">
                            {timeLabel(s.clock_in_at)} → {timeLabel(s.clock_out_at)}
                            {!s.clock_out_at && (
                              <Badge variant="outline" className="ml-2">
                                Open
                              </Badge>
                            )}
                            <Badge
                              variant={
                                status === "approved"
                                  ? "default"
                                  : status === "rejected"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="ml-2"
                            >
                              {status === "approved"
                                ? "Approved"
                                : status === "rejected"
                                  ? "Rejected"
                                  : "Pending"}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatHours(minutes)} · {formatMoney(payForMinutes(minutes, worker.pay_rate))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {status !== "approved" ? (
                            <Button
                              size="sm"
                              disabled={updatingApproval !== null}
                              onClick={() => changeApproval([s.id], "approved", s.id)}
                            >
                              {updatingApproval === s.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1">Approve</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingApproval !== null}
                              onClick={() => changeApproval([s.id], "pending", s.id)}
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              <span className="ml-1">Unapprove</span>
                            </Button>
                          )}
                          {status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingApproval !== null}
                              onClick={() => changeApproval([s.id], "rejected", s.id)}
                            >
                              <XCircle className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEditor(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" /> Jobs in range
          </CardTitle>
          <CardDescription>Cross-check clocked hours against time logged per job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted-foreground">No jobs assigned in this range</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{j.guest_name || "Customer"}</p>
                  <p className="text-xs text-muted-foreground">
                    {j.scheduled_date} · {j.status}
                  </p>
                </div>
                <span className="text-muted-foreground">
                  {j.actual_duration_minutes
                    ? formatHours(Number(j.actual_duration_minutes))
                    : "no time logged"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Shift" : "Add Shift"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Clock In *</Label>
              <Input
                type="datetime-local"
                value={editing?.clockIn || ""}
                onChange={(e) => setEditing((p) => (p ? { ...p, clockIn: e.target.value } : p))}
              />
            </div>
            <div className="space-y-2">
              <Label>Clock Out</Label>
              <Input
                type="datetime-local"
                value={editing?.clockOut || ""}
                onChange={(e) => setEditing((p) => (p ? { ...p, clockOut: e.target.value } : p))}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to keep the shift open (still clocked in).
              </p>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                rows={2}
                placeholder="Reason for the manual change"
                value={editing?.notes || ""}
                onChange={(e) => setEditing((p) => (p ? { ...p, notes: e.target.value } : p))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
