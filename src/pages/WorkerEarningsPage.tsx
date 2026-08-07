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

  const StatCard = ({
    icon: Icon,
    label,
    stats,
  }: { icon: any; label: string; stats: { shiftMins: number; pendingMins: number; pay: number; tips: number } }) => (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Icon className="h-3 w-3" /> {label}
        </div>
        <p className="text-2xl font-bold mt-1">{formatHours(stats.shiftMins)}</p>
        <p className="text-xs text-muted-foreground">{formatDecimalHours(stats.shiftMins)} approved hrs</p>
        {stats.pendingMins > 0 && (
          <p className="text-xs text-amber-500">{formatHours(stats.pendingMins)} pending approval</p>
        )}
        <p className="text-sm font-semibold text-primary mt-1">${stats.pay.toFixed(2)}</p>
        {stats.tips > 0 && (
          <p className="text-xs text-emerald-600 font-medium">+${stats.tips.toFixed(2)} tips</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <WorkerLayout>
      <SEOHead title="Worker Earnings" description="Private page." path="/worker/earnings" noIndex />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Earnings</h1>
        </div>

        {/* Hours + pay cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Calendar} label="Today" stats={todayStats} />
          <StatCard icon={Briefcase} label="This Week" stats={weekStats} />
          <StatCard icon={TrendingUp} label="This Month" stats={monthStats} />
          <StatCard icon={Star} label="All Time" stats={allStats} />
        </div>

        {/* Hourly rate */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-sm text-muted-foreground">Your hourly rate</p>
            <p className="font-semibold">${hourlyRate.toFixed(2)} / hour</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pay is calculated from your clock-in / clock-out shifts, including drive time.
            </p>
          </CardContent>
        </Card>

        {/* Time filter tabs */}
        <div className="flex gap-1 bg-card border border-border/50 rounded-lg p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-1 text-xs font-medium py-2 px-2 rounded-md transition-colors ${
                activeFilter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pay summary bar */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Hourly Pay</p>
                <p className="font-bold">${filtered.pay.toFixed(2)}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Tips</p>
                <p className="font-bold text-emerald-600">${filtered.tips.toFixed(2)}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="font-bold text-primary">${(filtered.pay + filtered.tips).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shift hours vs job hours */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold">Shift Hours vs Job Hours</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Shift (paid)</p>
                <p className="font-bold">{formatHours(filtered.shiftMins)}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">On Jobs</p>
                <p className="font-bold">{formatHours(filtered.jobMins)}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Other Time</p>
                <p className="font-bold">{formatHours(Math.max(0, filtered.shiftMins - filtered.jobMins))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed jobs list */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">
            {activeFilter === "all" ? "All" : filterTabs.find((t) => t.key === activeFilter)?.label} — {filtered.jobs.length} job{filtered.jobs.length !== 1 ? "s" : ""}
          </h2>
          {filtered.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No completed jobs for this period</p>
          ) : (
            filtered.jobs.slice(0, 50).map((b) => {
              const mins = jobMinutes(b);
              const rate = bookingHourlyRate(b, workerProfile);
              const estimate = jobPay(b, workerProfile);
              const tipAmount = Number(b.tip_amount) || 0;
              return (
                <Card key={b.id}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {b.custom_service_description || (b.services as any)?.name || "Service"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.scheduled_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rate: ${rate.toFixed(2)}/hr
                        {hasHourlyOverride(b) && (
                          <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">Custom</Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{mins > 0 ? formatHours(mins) : "No time logged"}</p>
                      <p className="text-xs text-primary font-medium">Job pay: ${estimate.toFixed(2)}</p>
                      {tipAmount > 0 && (
                        <p className="text-xs text-emerald-600 font-medium">Tip: ${tipAmount.toFixed(2)}</p>
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
