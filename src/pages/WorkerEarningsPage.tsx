import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Briefcase, TrendingUp, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default function WorkerEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get worker profile for pay rate
    const { data: wp } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setWorkerProfile(wp);

    // Get all completed bookings assigned to this worker
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("status", "completed")
      .order("scheduled_date", { ascending: false });

    setCompletedBookings(bookings || []);
    setLoading(false);
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const todayJobs = completedBookings.filter((b) => b.scheduled_date === today);
  const weekJobs = completedBookings.filter((b) => b.scheduled_date >= weekStart && b.scheduled_date <= weekEnd);
  const monthJobs = completedBookings.filter((b) => b.scheduled_date >= monthStart && b.scheduled_date <= monthEnd);

  // Calculate earnings for a single booking using per-booking override or global rate
  const calcBookingEarnings = (b: any): number => {
    if (b.worker_pay_type && b.worker_pay_rate != null) {
      // Per-booking override
      if (b.worker_pay_type === "percentage") {
        return (b.total_price || 0) * (Number(b.worker_pay_rate) / 100);
      }
      return Number(b.worker_pay_rate);
    }
    // Fall back to global worker rate
    if (!workerProfile) return 0;
    if (workerProfile.pay_type === "percentage") {
      return (b.total_price || 0) * (workerProfile.pay_rate / 100);
    }
    return workerProfile.pay_rate;
  };

  const calcEarnings = (jobs: any[]) => {
    const totalValue = jobs.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const earnings = jobs.reduce((sum, b) => sum + calcBookingEarnings(b), 0);
    return { totalValue, earnings };
  };

  const getBookingRateLabel = (b: any): string => {
    if (b.worker_pay_type && b.worker_pay_rate != null) {
      if (b.worker_pay_type === "percentage") return `${b.worker_pay_rate}%`;
      return `$${Number(b.worker_pay_rate).toFixed(2)} flat`;
    }
    if (!workerProfile) return "—";
    if (workerProfile.pay_type === "percentage") return `${workerProfile.pay_rate}%`;
    return `$${workerProfile.pay_rate} flat`;
  };

  const todayEarnings = calcEarnings(todayJobs);
  const weekEarnings = calcEarnings(weekJobs);
  const monthEarnings = calcEarnings(monthJobs);

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Earnings</h1>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Today
              </div>
              <p className="text-2xl font-bold mt-1">{todayJobs.length}</p>
              <p className="text-xs text-muted-foreground">jobs</p>
              {workerProfile && (
                <p className="text-sm font-semibold text-primary mt-1">
                  ${todayEarnings.earnings.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> This Week
              </div>
              <p className="text-2xl font-bold mt-1">{weekJobs.length}</p>
              <p className="text-xs text-muted-foreground">jobs</p>
              {workerProfile && (
                <p className="text-sm font-semibold text-primary mt-1">
                  ${weekEarnings.earnings.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> This Month
              </div>
              <p className="text-2xl font-bold mt-1">{monthJobs.length}</p>
              <p className="text-xs text-muted-foreground">jobs</p>
              {workerProfile && (
                <p className="text-sm font-semibold text-primary mt-1">
                  ${monthEarnings.earnings.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-xs text-muted-foreground">Monthly Value</div>
              <p className="text-2xl font-bold mt-1">
                ${monthEarnings.totalValue.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">total service value</p>
            </CardContent>
          </Card>
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

        {/* Completed jobs list */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">Completed Jobs</h2>
          {completedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No completed jobs yet</p>
          ) : (
            completedBookings.slice(0, 50).map((b) => {
              const earnings = calcBookingEarnings(b);
              const rateLabel = getBookingRateLabel(b);
              const hasOverride = b.worker_pay_type && b.worker_pay_rate != null;
              return (
                <Card key={b.id}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(b.services as any)?.name || "Service"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.scheduled_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rate: {rateLabel}
                        {hasOverride && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">Custom</Badge>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${(b.total_price || 0).toFixed(2)}</p>
                      <p className="text-xs text-primary font-medium">
                        ${earnings.toFixed(2)}
                      </p>
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
