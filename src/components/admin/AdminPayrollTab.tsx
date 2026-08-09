import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logAppError } from "@/lib/error-log";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, UserPlus, Loader2, Clock, Save, Download, ChevronRight, RefreshCw, CheckCircle2, CalendarPlus,
} from "lucide-react";
import {
  DEFAULT_HOURLY_RATE, fetchShifts, fetchShiftsResult, formatHours, formatDecimalHours, formatMoney,
  payForMinutes, shiftMinutes, sumShiftMinutes, sumApprovedShiftMinutes,
  pendingShifts, setShiftApproval, type ShiftRecord,
} from "@/lib/worker-pay";
import { PayrollWorkerDetail } from "@/components/admin/PayrollWorkerDetail";
import { QuickHoursWeek } from "@/components/admin/QuickHoursWeek";
import { PayrollTimesheetGrid } from "@/components/admin/PayrollTimesheetGrid";


export interface PayrollWorker {
  user_id: string;
  phone: string | null;
  pay_rate: number;
  is_active: boolean;
  full_name: string | null;
  email: string | null;
}

type PresetId = "today" | "week" | "month" | "last-month" | "custom";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const dow = (copy.getDay() + 6) % 7; // Monday start
  copy.setDate(copy.getDate() - dow);
  return copy;
}

function rangeForPreset(preset: PresetId): { from: string; to: string } {
  const now = new Date();
  if (preset === "today") return { from: toISODate(now), to: toISODate(now) };
  if (preset === "week") return { from: toISODate(startOfWeek(now)), to: toISODate(now) };
  if (preset === "month") {
    return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) };
  }
  // last month
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toISODate(first), to: toISODate(last) };
}

interface TipRow {
  worker_id: string;
  day: string;
  amount: number;
  source: "booking" | "logged";
}


export function AdminPayrollTab() {
  const [workers, setWorkers] = useState<PayrollWorker[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [tips, setTips] = useState<TipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadSeq = useRef(0);

  const [preset, setPreset] = useState<PresetId>("week");
  const initialRange = rangeForPreset("week");
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [selected, setSelected] = useState<PayrollWorker | null>(null);
  const [hoursWorker, setHoursWorker] = useState<PayrollWorker | null>(null);


  const [editingPay, setEditingPay] = useState<Record<string, string>>({});
  const [savingPay, setSavingPay] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWorker, setNewWorker] = useState({
    fullName: "", email: "", password: "", phone: "", payRate: String(DEFAULT_HOURLY_RATE),
  });

  const today = toISODate(new Date());
  const weekStart = toISODate(startOfWeek(new Date()));
  const monthStart = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // Widest window we need: selected range, current month-to-date buckets and the
  // timesheet grid's current week (so the grid can reuse this single fetch).
  const weekEnd = toISODate(new Date(startOfWeek(new Date()).getTime() + 6 * 86400000));
  const windowFrom = [fromDate, monthStart].sort()[0];
  const windowTo = [toDate, today, weekEnd].sort().slice(-1)[0];

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const isStale = () => seq !== loadSeq.current;
    setRefreshing(true);
    setLoadError(null);
    try {
      const { data: staffRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "staff");
      if (rolesError) throw rolesError;
      if (isStale()) return;

      const userIds = (staffRoles || []).map((r) => r.user_id);
      if (userIds.length === 0) {
        setWorkers([]);
        setShifts([]);
        setTips([]);
        return;
      }

      const [workerRes, profileRes, shiftRes, tipRes] = await Promise.all([
        supabase.from("worker_profiles").select("*").in("user_id", userIds),
        supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
        fetchShiftsResult({ fromDate: windowFrom, toDate: windowTo }),
        supabase
          .from("bookings")
          .select("assigned_worker_id, scheduled_date, tip_amount")
          .in("assigned_worker_id", userIds)
          .gte("scheduled_date", windowFrom)
          .lte("scheduled_date", windowTo)
          .gt("tip_amount", 0),
      ]);
      if (workerRes.error) throw workerRes.error;
      if (profileRes.error) throw profileRes.error;
      if (shiftRes.error) throw new Error(shiftRes.error);
      if (tipRes.error) throw tipRes.error;
      if (isStale()) return;
      const workerProfiles = workerRes.data;
      const profiles = profileRes.data;

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const merged: PayrollWorker[] = userIds.map((uid) => {
        const wp = workerProfiles?.find((w) => w.user_id === uid);
        const prof = profileMap.get(uid);
        const rate = Number(wp?.pay_rate);
        return {
          user_id: uid,
          phone: wp?.phone ?? null,
          pay_rate: Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_HOURLY_RATE,
          is_active: wp?.is_active ?? true,
          full_name: prof?.full_name ?? null,
          email: prof?.email ?? null,
        };
      });
      merged.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
      setWorkers(merged);
      setEditingPay(Object.fromEntries(merged.map((w) => [w.user_id, String(w.pay_rate)])));
      setShifts(shiftRes.data);
      setTips(
        (tipRes.data || [])
          .filter((b) => b.assigned_worker_id)
          .map((b) => ({
            worker_id: b.assigned_worker_id as string,
            day: b.scheduled_date as string,
            amount: Number(b.tip_amount) || 0,
          })),
      );

    } catch (e: any) {
      if (isStale()) return;
      const message = e?.message || "Could not load payroll data";
      setLoadError(message);
      void logAppError({
        message,
        code: e?.code || "payroll_load_failed",
        severity: "error",
        context: { area: "admin_payroll", windowFrom, windowTo },
        stack: e?.stack,
      });
    } finally {
      if (!isStale()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [windowFrom, windowTo]);



  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (p: PresetId) => {
    setPreset(p);
    if (p === "custom") return;
    const r = rangeForPreset(p);
    setFromDate(r.from);
    setToDate(r.to);
  };

  const shiftsInWindow = useCallback(
    (userId: string, from: string, to: string) =>
      shifts.filter((s) => {
        if (s.user_id !== userId) return false;
        const day = s.clock_in_at.slice(0, 10);
        return day >= from && day <= to;
      }),
    [shifts],
  );

  const tipsInWindow = useCallback(
    (userId: string, from: string, to: string) =>
      tips
        .filter((t) => t.worker_id === userId && t.day >= from && t.day <= to)
        .reduce((sum, t) => sum + t.amount, 0),
    [tips],
  );

  const rows = useMemo(
    () =>
      workers.map((w) => {
        const rangeShifts = shiftsInWindow(w.user_id, fromDate, toDate);
        const rangeMinutes = sumApprovedShiftMinutes(rangeShifts);
        const pending = pendingShifts(rangeShifts);
        const rangeTips = tipsInWindow(w.user_id, fromDate, toDate);
        const rangePay = payForMinutes(rangeMinutes, w.pay_rate);
        return {
          worker: w,
          todayMinutes: sumApprovedShiftMinutes(shiftsInWindow(w.user_id, today, today)),
          weekMinutes: sumApprovedShiftMinutes(shiftsInWindow(w.user_id, weekStart, today)),
          monthMinutes: sumApprovedShiftMinutes(shiftsInWindow(w.user_id, monthStart, today)),
          rangeMinutes,
          rangePay,
          rangeTips,
          rangeTotal: rangePay + rangeTips,
          weekTips: tipsInWindow(w.user_id, weekStart, today),
          monthTips: tipsInWindow(w.user_id, monthStart, today),
          openShift: rangeShifts.some((s) => !s.clock_out_at),
          pendingCount: pending.length,
          pendingMinutes: sumShiftMinutes(pending),
          pendingIds: pending.map((s) => s.id),
        };
      }),
    [workers, shiftsInWindow, tipsInWindow, fromDate, toDate, today, weekStart, monthStart],
  );

  const totals = useMemo(
    () => ({
      minutes: rows.reduce((s, r) => s + r.rangeMinutes, 0),
      pay: rows.reduce((s, r) => s + r.rangePay, 0),
      tips: rows.reduce((s, r) => s + r.rangeTips, 0),
      total: rows.reduce((s, r) => s + r.rangeTotal, 0),
      pendingCount: rows.reduce((s, r) => s + r.pendingCount, 0),
      pendingMinutes: rows.reduce((s, r) => s + r.pendingMinutes, 0),
    }),
    [rows],
  );


  const approveAll = async (userId: string | null, ids: string[]) => {
    if (ids.length === 0) return;
    setApproving(userId ?? "all");
    const { error } = await setShiftApproval(ids, "approved");
    setApproving(null);
    if (error) {
      toast.error(error || "Failed to approve shifts");
      return;
    }
    toast.success(`Approved ${ids.length} shift${ids.length === 1 ? "" : "s"}`);
    load();
  };

  const handleSavePayRate = async (userId: string) => {
    const rate = parseFloat(editingPay[userId] ?? "");
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error("Enter a valid hourly rate");
      return;
    }
    setSavingPay(userId);
    const { error } = await supabase
      .from("worker_profiles")
      .update({ pay_type: "hourly", pay_rate: rate })
      .eq("user_id", userId);
    setSavingPay(null);
    if (error) {
      toast.error("Failed to update hourly rate");
      return;
    }
    toast.success("Hourly rate updated");
    load();
  };

  const handleToggleActive = async (worker: PayrollWorker, next: boolean) => {
    const { error } = await supabase
      .from("worker_profiles")
      .update({ is_active: next })
      .eq("user_id", worker.user_id);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(next ? "Worker activated" : "Worker deactivated");
    load();
  };

  const handleCreateWorker = async () => {
    if (!newWorker.email || !newWorker.password || !newWorker.fullName) {
      toast.error("Name, email, and password are required");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-worker", {
        body: {
          email: newWorker.email,
          password: newWorker.password,
          fullName: newWorker.fullName,
          phone: newWorker.phone,
          payType: "hourly",
          payRate: parseFloat(newWorker.payRate) || DEFAULT_HOURLY_RATE,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Worker account created!");
      setCreateOpen(false);
      setNewWorker({ fullName: "", email: "", password: "", phone: "", payRate: String(DEFAULT_HOURLY_RATE) });
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create worker");
    } finally {
      setCreating(false);
    }
  };

  const exportCsv = () => {
    const header = [
      "Worker", "Email", "Hourly Rate", "Approved Hours", "Approved Pay",
      "Tips", "Total (Pay + Tips)", "Pending Hours", "Pending Shifts", "From", "To",
    ];
    const lines = rows.map((r) =>
      [
        r.worker.full_name || "Unknown",
        r.worker.email || "",
        r.worker.pay_rate.toFixed(2),
        formatDecimalHours(r.rangeMinutes),
        r.rangePay.toFixed(2),
        r.rangeTips.toFixed(2),
        r.rangeTotal.toFixed(2),
        formatDecimalHours(r.pendingMinutes),
        r.pendingCount,
        fromDate,
        toDate,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    const csv = [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selected) {
    return (
      <PayrollWorkerDetail
        worker={selected}
        fromDate={fromDate}
        toDate={toDate}
        onBack={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold">We couldn't load payroll data</p>
          <p className="text-sm text-muted-foreground max-w-md">{loadError}</p>
          <Button size="sm" variant="outline" onClick={() => load()} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Team & Payroll
              </CardTitle>
              <CardDescription>
                Approve shifts before they count toward hours and pay
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => load()} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Worker
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Worker Account</DialogTitle>
                    <DialogDescription>
                      This creates a new account with worker access to the portal at /worker
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={newWorker.fullName}
                        onChange={(e) => setNewWorker({ ...newWorker, fullName: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newWorker.email}
                        onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                        placeholder="john@avdetailing.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        value={newWorker.password}
                        onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={newWorker.phone}
                        onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                        placeholder="(225) 555-1234"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Hourly Rate ($/hr)
                      </Label>
                      <Input
                        type="number"
                        value={newWorker.payRate}
                        onChange={(e) => setNewWorker({ ...newWorker, payRate: e.target.value })}
                        min="0"
                        step="0.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default is ${DEFAULT_HOURLY_RATE.toFixed(2)}/hr. Pay is based on clocked hours.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateWorker} disabled={creating}>
                      {creating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Create Worker
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-2">
              {([
                ["today", "Today"],
                ["week", "This Week"],
                ["month", "This Month"],
                ["last-month", "Last Month"],
                ["custom", "Custom"],
              ] as [PresetId, string][]).map(([id, label]) => (
                <Button
                  key={id}
                  size="sm"
                  variant={preset === id ? "default" : "outline"}
                  onClick={() => applyPreset(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  className="h-8 w-[150px] text-xs"
                  value={fromDate}
                  onChange={(e) => {
                    setPreset("custom");
                    setFromDate(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  className="h-8 w-[150px] text-xs"
                  value={toDate}
                  onChange={(e) => {
                    setPreset("custom");
                    setToDate(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Approved hours in range</p>
              <p className="text-2xl font-bold">{formatHours(totals.minutes)}</p>
              <p className="text-xs text-muted-foreground">{formatDecimalHours(totals.minutes)} hrs</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Approved labor cost</p>
              <p className="text-2xl font-bold">{formatMoney(totals.pay)}</p>
              <p className="text-xs text-muted-foreground">
                {fromDate} → {toDate}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Tips in range</p>
              <p className="text-2xl font-bold">{formatMoney(totals.tips)}</p>
              <p className="text-xs text-muted-foreground">
                Total with pay {formatMoney(totals.total)}
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
              <p className="text-2xl font-bold">{formatHours(totals.pendingMinutes)}</p>
              <p className="text-xs text-muted-foreground">
                {totals.pendingCount} shift{totals.pendingCount === 1 ? "" : "s"} not counted yet
              </p>
              {totals.pendingCount > 0 && (
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={approving !== null}
                  onClick={() => approveAll(null, rows.flatMap((r) => r.pendingIds))}
                >
                  {approving === "all" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve all
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PayrollTimesheetGrid
        workers={workers.map((w) => ({
          user_id: w.user_id,
          full_name: w.full_name,
          email: w.email,
          pay_rate: w.pay_rate,
        }))}
        sharedShifts={shifts}
        sharedFrom={windowFrom}
        sharedTo={windowTo}
        onSaved={load}
      />


      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No workers added yet
          </CardContent>
        </Card>
      ) : (
        rows.map((r) => (
          <Card key={r.worker.user_id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.worker.full_name || "Unknown"}</p>
                    <Badge variant={r.worker.is_active ? "default" : "secondary"}>
                      {r.worker.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {r.openShift && <Badge variant="outline">Clocked in</Badge>}
                    {r.pendingCount > 0 && (
                      <Badge variant="destructive">
                        {r.pendingCount} pending approval
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.worker.email}</p>
                  {r.worker.phone && (
                    <p className="text-sm text-muted-foreground">{r.worker.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Active</Label>
                    <Switch
                      checked={r.worker.is_active}
                      onCheckedChange={(v) => handleToggleActive(r.worker, v)}
                    />
                  </div>
                  {r.pendingCount > 0 && (
                    <Button
                      size="sm"
                      disabled={approving !== null}
                      onClick={() => approveAll(r.worker.user_id, r.pendingIds)}
                    >
                      {approving === r.worker.user_id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve {formatHours(r.pendingMinutes)}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setHoursWorker(r.worker)}>
                    <CalendarPlus className="mr-2 h-4 w-4" /> Add Hours
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelected(r.worker)}>
                    Hours & Shifts <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>

                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Today (approved)", r.todayMinutes],
                  ["This Week", r.weekMinutes],
                  ["This Month", r.monthMinutes],
                  ["Selected Range", r.rangeMinutes],
                ].map(([label, minutes]) => (
                  <div key={label as string} className="rounded-md border p-2">
                    <p className="text-[11px] text-muted-foreground">{label as string}</p>
                    <p className="text-lg font-semibold">{formatHours(minutes as number)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["Tips this week", r.weekTips],
                  ["Tips this month", r.monthTips],
                  ["Tips selected range", r.rangeTips],
                ].map(([label, amount]) => (
                  <div key={label as string} className="rounded-md border p-2">
                    <p className="text-[11px] text-muted-foreground">{label as string}</p>
                    <p className="text-lg font-semibold">{formatMoney(amount as number)}</p>
                  </div>
                ))}
              </div>


              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px] space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Hourly Rate ($/hr)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    className="h-8 text-xs"
                    value={editingPay[r.worker.user_id] ?? ""}
                    onChange={(e) =>
                      setEditingPay((prev) => ({ ...prev, [r.worker.user_id]: e.target.value }))
                    }
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSavePayRate(r.worker.user_id)}
                  disabled={savingPay === r.worker.user_id}
                >
                  {savingPay === r.worker.user_id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Rate
                </Button>
                <div className="rounded-md border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Approved pay for range</p>
                  <p className="text-lg font-semibold">{formatMoney(r.rangePay)}</p>
                </div>
                <div className="rounded-md border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Pay + tips for range</p>
                  <p className="text-lg font-semibold">{formatMoney(r.rangeTotal)}</p>
                </div>

              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!hoursWorker} onOpenChange={(o) => !o && setHoursWorker(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add hours — {hoursWorker?.full_name || "Worker"}</DialogTitle>
            <DialogDescription>
              Type hours for any day of the week. Saved hours are approved right away.
            </DialogDescription>
          </DialogHeader>
          {hoursWorker && (
            <QuickHoursWeek
              userId={hoursWorker.user_id}
              payRate={hoursWorker.pay_rate}
              onSaved={load}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>

  );
}
