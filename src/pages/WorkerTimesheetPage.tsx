import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Clock, Download, Calendar as CalendarIcon } from "lucide-react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  parseISO, differenceInMinutes,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { formatHm } from "@/lib/duration-format";
import { getCurrentWorkerIdentity } from "@/lib/workerAssignments";
import { SEOHead } from "@/components/seo/SEOHead";

type Preset = "week" | "month" | "custom";

interface Row {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  guest_name: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
  actual_duration_minutes: number | null;
  total_price: number | null;
  tip_amount: number | null;
  worker_pay_type: string | null;
  worker_pay_rate: number | null;
  status: string;
}

function calcEarn(b: Row, profile: { pay_type?: string | null; pay_rate?: number | null } | null) {
  const value = Number(b.total_price) || 0;
  if (b.worker_pay_type && b.worker_pay_rate != null) {
    return b.worker_pay_type === "percentage"
      ? value * (Number(b.worker_pay_rate) / 100)
      : Number(b.worker_pay_rate);
  }
  if (!profile) return 0;
  return profile.pay_type === "percentage"
    ? value * (Number(profile.pay_rate) / 100)
    : Number(profile.pay_rate) || 0;
}

function onTimeFor(b: Row): { icon: string; label: string; diff: number | null } {
  if (!b.clock_in_at || !b.scheduled_time) return { icon: "—", label: "No data", diff: null };
  try {
    const sched = parseISO(`${b.scheduled_date}T${b.scheduled_time}`);
    const diff = differenceInMinutes(new Date(b.clock_in_at), sched);
    if (diff <= 15) return { icon: "✅", label: "On time", diff };
    if (diff <= 30) return { icon: "⚠️", label: `${diff}m late`, diff };
    return { icon: "❌", label: `${diff}m late`, diff };
  } catch {
    return { icon: "—", label: "No data", diff: null };
  }
}

export default function WorkerTimesheetPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [profile, setProfile] = useState<{ pay_type?: string | null; pay_rate?: number | null } | null>(null);
  const [preset, setPreset] = useState<Preset>("week");
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const applyPreset = (p: Preset) => {
    setPreset(p);
    const now = new Date();
    if (p === "week") setRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) });
    else if (p === "month") setRange({ from: startOfMonth(now), to: endOfMonth(now) });
  };

  useEffect(() => {
    if (!range?.from || !range?.to) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const identity = await getCurrentWorkerIdentity();
      if (!identity) {
        if (!cancelled) { setRows([]); setLoading(false); }
        return;
      }
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("pay_type, pay_rate")
        .eq("user_id", identity.authUserId)
        .maybeSingle();
      if (!cancelled) setProfile(wp || null);

      let q = supabase
        .from("bookings")
        .select("id, scheduled_date, scheduled_time, guest_name, clock_in_at, clock_out_at, actual_duration_minutes, total_price, tip_amount, worker_pay_type, worker_pay_rate, status")
        .eq("status", "completed")
        .gte("scheduled_date", format(range.from!, "yyyy-MM-dd"))
        .lte("scheduled_date", format(range.to!, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false });
      if (!identity.isAdmin) q = q.eq("assigned_worker_id", identity.authUserId);
      const { data } = await q;
      if (!cancelled) setRows(((data as Row[]) || []));
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const summary = useMemo(() => {
    let totalMin = 0, totalEarn = 0, totalTips = 0;
    for (const r of rows) {
      totalMin += Number(r.actual_duration_minutes) || 0;
      totalEarn += calcEarn(r, profile);
      totalTips += Number(r.tip_amount) || 0;
    }
    return { totalMin, totalEarn, totalTips, jobs: rows.length };
  }, [rows, profile]);

  const exportCsv = () => {
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["Date","Customer","Clock In","Clock Out","Duration","Scheduled","On-Time","Earnings","Tip"];
    const dataRows = rows.map(r => {
      const ot = onTimeFor(r);
      return [
        r.scheduled_date,
        r.guest_name || "",
        r.clock_in_at ? format(new Date(r.clock_in_at), "h:mm a") : "—",
        r.clock_out_at ? format(new Date(r.clock_out_at), "h:mm a") : "—",
        r.actual_duration_minutes != null ? formatHm(r.actual_duration_minutes) : "—",
        r.scheduled_time ? format(parseISO(`2000-01-01T${r.scheduled_time}`), "h:mm a") : "—",
        ot.label,
        calcEarn(r, profile).toFixed(2),
        (Number(r.tip_amount) || 0).toFixed(2),
      ];
    });
    const csv = [headers.map(escape).join(","), ...dataRows.map(r => r.map(escape).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-timesheet-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <WorkerLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Timesheet</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={preset === "week" ? "default" : "outline"} onClick={() => applyPreset("week")}>This Week</Button>
              <Button size="sm" variant={preset === "month" ? "default" : "outline"} onClick={() => applyPreset("month")}>This Month</Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
                    <CalendarIcon className="h-4 w-4 mr-1.5" /> Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={(r) => { if (r?.from) { setPreset("custom"); setRange(r); } }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="ml-auto text-xs text-muted-foreground">
                {range?.from && range?.to && `${format(range.from, "MMM d")} → ${format(range.to, "MMM d, yyyy")}`}
              </span>
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
                <Download className="h-4 w-4 mr-1.5" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No completed jobs in this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead className="text-center">On-Time</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead className="text-right">Tip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => {
                      const ot = onTimeFor(r);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{format(parseISO(r.scheduled_date), "MMM d")}</TableCell>
                          <TableCell className="max-w-[160px] truncate">{r.guest_name || "—"}</TableCell>
                          <TableCell>{r.clock_in_at ? format(new Date(r.clock_in_at), "h:mm a") : "—"}</TableCell>
                          <TableCell>{r.clock_out_at ? format(new Date(r.clock_out_at), "h:mm a") : "—"}</TableCell>
                          <TableCell>{r.actual_duration_minutes != null ? formatHm(r.actual_duration_minutes) : "—"}</TableCell>
                          <TableCell>{r.scheduled_time ? format(parseISO(`2000-01-01T${r.scheduled_time}`), "h:mm a") : "—"}</TableCell>
                          <TableCell className="text-center">
                            <span title={ot.label}>{ot.icon}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">${calcEarn(r, profile).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-emerald-600">${(Number(r.tip_amount) || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryStat label="Total Hours" value={formatHm(summary.totalMin)} />
          <SummaryStat label="Total Jobs" value={String(summary.jobs)} />
          <SummaryStat label="Total Earnings" value={`$${summary.totalEarn.toFixed(2)}`} accent />
          <SummaryStat label="Total Tips" value={`$${summary.totalTips.toFixed(2)}`} accent />
        </div>
      </div>
    </WorkerLayout>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <SEOHead title="Worker Timesheet" description="Private page." path="/worker/timesheet" noIndex />
      <CardContent className="p-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-lg font-bold tabular-nums", accent && "text-green-500")}>{value}</p>
      </CardContent>
    </Card>
  );
}
