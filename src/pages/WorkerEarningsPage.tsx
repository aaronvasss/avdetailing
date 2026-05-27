import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Briefcase, TrendingUp, Calendar, Star, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { getBusinessDateString, getCurrentWorkerIdentity } from "@/lib/workerAssignments";
import { formatHm } from "@/lib/duration-format";
import { SEOHead } from "@/components/seo/SEOHead";

type TimeFilter = "today" | "week" | "month" | "all";

export default function WorkerEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("month");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const workerIdentity = await getCurrentWorkerIdentity();
    if (!workerIdentity) {
      setCompletedBookings([]);
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const today = getBusinessDateString();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const todayJobs = useMemo(() => completedBookings.filter((b) => b.scheduled_date === today), [completedBookings, today]);
  const weekJobs = useMemo(() => completedBookings.filter((b) => b.scheduled_date >= weekStart && b.scheduled_date <= weekEnd), [completedBookings, weekStart, weekEnd]);
  const monthJobs = useMemo(() => completedBookings.filter((b) => b.scheduled_date >= monthStart && b.scheduled_date <= monthEnd), [completedBookings, monthStart, monthEnd]);

  const calcBookingEarnings = useCallback((b: any): number => {
    const jobValue = Number(b.total_price) || 0;
    if (b.worker_pay_type && b.worker_pay_rate != null) {
      return b.worker_pay_type === "percentage" ? jobValue * (Number(b.worker_pay_rate) / 100) : Number(b.worker_pay_rate);
    }
    if (!workerProfile) return 0;
    return workerProfile.pay_type === "percentage" ? jobValue * (workerProfile.pay_rate / 100) : workerProfile.pay_rate;
  }, [workerProfile]);

  const calcEarnings = useCallback((jobs: any[]) => {
    const totalValue = jobs.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const earnings = jobs.reduce((sum, b) => sum + calcBookingEarnings(b), 0);
    const tips = jobs.reduce((sum, b) => sum + (Number(b.tip_amount) || 0), 0);
    return { totalValue, earnings, tips };
  }, [calcBookingEarnings]);

  const getBookingRateLabel = (b: any): string => {
    if (b.worker_pay_type && b.worker_pay_rate != null) {
      return b.worker_pay_type === "percentage" ? `${b.worker_pay_rate}%` : `$${Number(b.worker_pay_rate).toFixed(2)} flat`;
    }
    if (!workerProfile) return "—";
    return workerProfile.pay_type === "percentage" ? `${workerProfile.pay_rate}%` : `$${workerProfile.pay_rate} flat`;
  };

  const todayEarnings = useMemo(() => calcEarnings(todayJobs), [calcEarnings, todayJobs]);
  const weekEarnings = useMemo(() => calcEarnings(weekJobs), [calcEarnings, weekJobs]);
  const monthEarnings = useMemo(() => calcEarnings(monthJobs), [calcEarnings, monthJobs]);
  const allEarnings = useMemo(() => calcEarnings(completedBookings), [calcEarnings, completedBookings]);

  const filteredJobs = useMemo(() => {
    switch (activeFilter) {
      case "today": return todayJobs;
      case "week": return weekJobs;
      case "month": return monthJobs;
      case "all": return completedBookings;
    }
  }, [activeFilter, todayJobs, weekJobs, monthJobs, completedBookings]);

  const filteredEarnings = useMemo(() => {
    switch (activeFilter) {
      case "today": return todayEarnings;
      case "week": return weekEarnings;
      case "month": return monthEarnings;
      case "all": return allEarnings;
    }
  }, [activeFilter, todayEarnings, weekEarnings, monthEarnings, allEarnings]);

  const avgDurationMinutes = useMemo(() => {
    const withDur = filteredJobs.filter((b) => b.actual_duration_minutes != null && b.actual_duration_minutes > 0);
    if (withDur.length === 0) return null;
    const total = withDur.reduce((sum, b) => sum + Number(b.actual_duration_minutes), 0);
    return total / withDur.length;
  }, [filteredJobs]);

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

  const StatCard = ({ icon: Icon, label, jobs, earnings }: { icon: any; label: string; jobs: any[]; earnings: { earnings: number; tips: number } }) => (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Icon className="h-3 w-3" /> {label}
        </div>
        <p className="text-2xl font-bold mt-1">{jobs.length}</p>
        <p className="text-xs text-muted-foreground">jobs</p>
        {workerProfile && (
          <>
            <p className="text-sm font-semibold text-primary mt-1">
              ${earnings.earnings.toFixed(2)}
            </p>
            {earnings.tips > 0 && (
              <p className="text-xs text-emerald-600 font-medium">
                +${earnings.tips.toFixed(2)} tips
              </p>
            )}
          </>
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

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Calendar} label="Today" jobs={todayJobs} earnings={todayEarnings} />
          <StatCard icon={Briefcase} label="This Week" jobs={weekJobs} earnings={weekEarnings} />
          <StatCard icon={TrendingUp} label="This Month" jobs={monthJobs} earnings={monthEarnings} />
          <StatCard icon={Star} label="All Time" jobs={completedBookings} earnings={allEarnings} />
        </div>

        {/* Pay rate info */}
        {workerProfile && (
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-sm text-muted-foreground">Your default pay rate</p>
              <p className="font-semibold">
                {workerProfile.pay_type === "percentage"
                  ? `${workerProfile.pay_rate}% per job`
                  : `$${workerProfile.pay_rate} flat per job`}
              </p>
            </CardContent>
          </Card>
        )}

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

        {/* Earnings summary bar */}
        {workerProfile && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between text-sm">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">Base Pay</p>
                  <p className="font-bold">${filteredEarnings.earnings.toFixed(2)}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">Tips</p>
                  <p className="font-bold text-emerald-600">${filteredEarnings.tips.toFixed(2)}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="font-bold text-primary">${(filteredEarnings.earnings + filteredEarnings.tips).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avg Job Duration */}
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Avg Job Duration</p>
              <p className="font-bold">
                {avgDurationMinutes != null ? formatHm(avgDurationMinutes) : "No data yet"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed jobs list */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">
            {activeFilter === "all" ? "All" : filterTabs.find((t) => t.key === activeFilter)?.label} — {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
          </h2>
          {filteredJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No completed jobs for this period</p>
          ) : (
            filteredJobs.slice(0, 50).map((b) => {
              const earnings = calcBookingEarnings(b);
              const rateLabel = getBookingRateLabel(b);
              const hasOverride = b.worker_pay_type && b.worker_pay_rate != null;
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
                        Rate: {rateLabel}
                        {hasOverride && (
                          <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">Custom</Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${(Number(b.total_price) || 0).toFixed(2)}</p>
                      <p className="text-xs text-primary font-medium">Pay: ${earnings.toFixed(2)}</p>
                      {tipAmount > 0 && (
                        <p className="text-xs text-emerald-600 font-medium">Tip: ${tipAmount.toFixed(2)}</p>
                      )}
                      <p className="text-xs font-bold mt-0.5">Total: ${(earnings + tipAmount).toFixed(2)}</p>
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
