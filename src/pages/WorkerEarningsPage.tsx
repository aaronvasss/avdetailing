import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Briefcase, TrendingUp, Calendar, Star, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { getBusinessDateString, getCurrentWorkerIdentity } from "@/lib/workerAssignments";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  fetchShifts,
  shiftMinutes,
  sumShiftMinutes,
  sumApprovedShiftMinutes,
  pendingShifts,
  hourlyRateFor,
  bookingHourlyRate,
  hasHourlyOverride,
  payForMinutes,
  jobMinutes,
  jobPay,
  formatHours,
  formatDecimalHours,
  type ShiftRecord,
} from "@/lib/worker-pay";

type TimeFilter = "today" | "week" | "month" | "all";

export default function WorkerEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("month");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const workerIdentity = await getCurrentWorkerIdentity();
    if (!workerIdentity) {
      setCompletedBookings([]);
      setShifts([]);
      setWorkerProfile(null);
      setLoading(false);
      return;
    }

    const { data: wp } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("user_id", workerIdentity.authUserId)
      .maybeSingle();
    setWorkerProfile(wp);

    const shiftRows = await fetchShifts({
      userId: workerIdentity.isAdmin ? null : workerIdentity.authUserId,
    });
    setShifts(shiftRows);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("status", "completed")
      .order("scheduled_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        return {
          data: workerIdentity.isAdmin
            ? data
            : (data || []).filter((b) => b.assigned_worker_id === workerIdentity.authUserId),
          error: null,
        };
      });

    setCompletedBookings(bookings || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("worker-earnings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_shifts" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const today = getBusinessDateString();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const hourlyRate = hourlyRateFor(workerProfile);

  const inRange = (dateStr: string, from: string, to: string) => dateStr >= from && dateStr <= to;
  const shiftDay = (s: ShiftRecord) => format(parseISO(s.clock_in_at), "yyyy-MM-dd");

  const period = useCallback((from: string, to: string) => {
    const periodShifts = shifts.filter((s) => inRange(shiftDay(s), from, to));
    const periodJobs = completedBookings.filter((b) => inRange(b.scheduled_date, from, to));
    const shiftMins = sumApprovedShiftMinutes(periodShifts);
    const pendingMins = sumShiftMinutes(pendingShifts(periodShifts));
    const jobMins = periodJobs.reduce((sum, b) => sum + jobMinutes(b), 0);
    const tips = periodJobs.reduce((sum, b) => sum + (Number(b.tip_amount) || 0), 0);
    return {
      shifts: periodShifts,
      jobs: periodJobs,
      shiftMins,
      pendingMins,
      jobMins,
      tips,
      pay: payForMinutes(shiftMins, hourlyRate),
    };
  }, [shifts, completedBookings, hourlyRate]);

  const todayStats = useMemo(() => period(today, today), [period, today]);
  const weekStats = useMemo(() => period(weekStart, weekEnd), [period, weekStart, weekEnd]);
  const monthStats = useMemo(() => period(monthStart, monthEnd), [period, monthStart, monthEnd]);
  const allStats = useMemo(() => period("0000-01-01", "9999-12-31"), [period]);

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case "today": return todayStats;
      case "week": return weekStats;
      case "month": return monthStats;
      case "all": return allStats;
    }
  }, [activeFilter, todayStats, weekStats, monthStats, allStats]);

  const filterTabs: { key: TimeFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkerLayout>
    );
  }

  const MiniStat = ({
    icon: Icon,
    label,
    stats,
  }: { icon: any; label: string; stats: { shiftMins: number; pendingMins: number; pay: number; tips: number } }) => (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="text-lg font-bold mt-1.5 leading-none">{formatHours(stats.shiftMins)}</p>
      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-sm font-semibold text-primary">${stats.pay.toFixed(2)}</span>
        {stats.tips > 0 && (
          <span className="text-[11px] text-emerald-500">+${stats.tips.toFixed(2)} tips</span>
        )}
      </div>
      {stats.pendingMins > 0 && (
        <p className="text-[11px] text-amber-500 mt-1">{formatHours(stats.pendingMins)} pending</p>
      )}
    </div>
  );

  const activeLabel = filterTabs.find((t) => t.key === activeFilter)?.label ?? "";

  return (
    <WorkerLayout>
      <SEOHead title="Worker Earnings" description="Private page." path="/worker/earnings" noIndex />
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Earnings</h1>
          </div>
          <Badge variant="outline" className="text-[11px] font-medium">
            ${hourlyRate.toFixed(2)}/hr
          </Badge>
        </div>

        {/* Hero: period selector + totals */}
        <Card className="overflow-hidden border-primary/25">
          <CardContent className="p-0">
            <div className="flex gap-1 p-1 bg-muted/40">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex-1 text-[11px] sm:text-xs font-medium py-2 rounded-md transition-colors ${
                    activeFilter === tab.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="px-4 pt-4 pb-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {activeLabel} · Total Earned
              </p>
              <p className="text-4xl font-bold tracking-tight mt-1">
                ${(filtered.pay + filtered.tips).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatHours(filtered.shiftMins)} · {formatDecimalHours(filtered.shiftMins)} approved hrs
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              <div className="py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Hourly Pay</p>
                <p className="text-sm font-semibold">${filtered.pay.toFixed(2)}</p>
              </div>
              <div className="py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Tips</p>
                <p className="text-sm font-semibold text-emerald-500">${filtered.tips.toFixed(2)}</p>
              </div>
              <div className="py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">On Jobs</p>
                <p className="text-sm font-semibold">{formatHours(filtered.jobMins)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period snapshot */}
        <div className="grid grid-cols-2 gap-2.5">
          <MiniStat icon={Calendar} label="Today" stats={todayStats} />
          <MiniStat icon={Briefcase} label="This Week" stats={weekStats} />
          <MiniStat icon={TrendingUp} label="This Month" stats={monthStats} />
          <MiniStat icon={Star} label="All Time" stats={allStats} />
        </div>

        {/* Time breakdown */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold">Time Breakdown</p>
              <span className="ml-auto text-[11px] text-muted-foreground">{activeLabel}</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="text-center px-1">
                <p className="text-[11px] text-muted-foreground">Shift (paid)</p>
                <p className="text-sm font-bold">{formatHours(filtered.shiftMins)}</p>
              </div>
              <div className="text-center px-1">
                <p className="text-[11px] text-muted-foreground">On Jobs</p>
                <p className="text-sm font-bold">{formatHours(filtered.jobMins)}</p>
              </div>
              <div className="text-center px-1">
                <p className="text-[11px] text-muted-foreground">Other Time</p>
                <p className="text-sm font-bold">
                  {formatHours(Math.max(0, filtered.shiftMins - filtered.jobMins))}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2.5 leading-snug">
              Pay comes from your clock-in / clock-out shifts, including drive time.
            </p>
          </CardContent>
        </Card>

        {/* Completed jobs list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Completed Jobs</h2>
            <span className="text-[11px] text-muted-foreground">
              {activeLabel} · {filtered.jobs.length}
            </span>
          </div>
          {filtered.jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-6 text-center">
              <p className="text-sm text-muted-foreground">No completed jobs for this period</p>
            </div>
          ) : (
            filtered.jobs.slice(0, 50).map((b) => {
              const mins = jobMinutes(b);
              const rate = bookingHourlyRate(b, workerProfile);
              const tipAmount = Number(b.tip_amount) || 0;
              return (
                <Card key={b.id}>
                  <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {b.custom_service_description || (b.services as any)?.name || "Service"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(b.scheduled_date), "MMM d, yyyy")} · ${rate.toFixed(2)}/hr
                        {hasHourlyOverride(b) && (
                          <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">Custom</Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {mins > 0 ? formatHours(mins) : "—"}
                      </p>
                      {tipAmount > 0 && (
                        <p className="text-[11px] text-emerald-500 font-medium">Tip ${tipAmount.toFixed(2)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

    </WorkerLayout>
  );
}
