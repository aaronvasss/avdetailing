import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { WorkerJobCard } from "@/components/worker/WorkerJobCard";
import { WeatherWidget } from "@/components/worker/WeatherWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, Inbox, UserCheck, CalendarClock, MapPin, Car, Wrench, Clock, ArrowDown, CheckCircle2, DollarSign, Wallet, Coins, Map as MapIcon, Navigation, Route as RouteIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { getBusinessDateString, getCurrentWorkerIdentity } from "@/lib/workerAssignments";
import { formatStopwatch } from "@/lib/duration-format";

const fmtMoney = (n: number) => (n > 0 ? `$${n.toFixed(n % 1 === 0 ? 0 : 2)}` : "—");
const fmtCount = (n: number) => (n > 0 ? String(n) : "—");

function calcWorkerCut(b: any, profile: any): number {
  const jobValue = Number(b.total_price) || 0;
  if (b.worker_pay_type && b.worker_pay_rate != null) {
    return b.worker_pay_type === "percentage"
      ? jobValue * (Number(b.worker_pay_rate) / 100)
      : Number(b.worker_pay_rate);
  }
  if (!profile) return 0;
  return profile.pay_type === "percentage"
    ? jobValue * (Number(profile.pay_rate) / 100)
    : Number(profile.pay_rate) || 0;
}

const formatTime12 = (time: string) => {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
};

const UPCOMING_STATUSES = ["pending", "confirmed", "in_progress"];

export default function WorkerDashboardPage() {
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [weekBookings, setWeekBookings] = useState<any[]>([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  const today = getBusinessDateString();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const fetchEarningsData = useCallback(async () => {
    const workerIdentity = await getCurrentWorkerIdentity();
    if (!workerIdentity) return;

    const { data: wp } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("user_id", workerIdentity.authUserId)
      .maybeSingle();
    setWorkerProfile(wp);

    let weekQuery = supabase
      .from("bookings")
      .select("id, total_price, tip_amount, worker_pay_type, worker_pay_rate, status, scheduled_date, assigned_worker_id")
      .eq("status", "completed")
      .gte("scheduled_date", weekStart)
      .lte("scheduled_date", weekEnd);
    if (!workerIdentity.isAdmin) {
      weekQuery = weekQuery.eq("assigned_worker_id", workerIdentity.authUserId);
    }
    const { data: weekData } = await weekQuery;
    setWeekBookings(weekData || []);
  }, [weekStart, weekEnd]);


  const fetchTodayBookings = useCallback(async () => {
    setLoading(true);

    const workerIdentity = await getCurrentWorkerIdentity();
    if (!workerIdentity) {
      setMyBookings([]);
      setLoading(false);
      return;
    }

    let todayQuery = supabase
      .from("bookings")
      .select("*, services(name), booking_add_ons(name, price)")
      .eq("scheduled_date", today)
      .neq("status", "cancelled")
      .order("scheduled_time", { ascending: true });

    if (!workerIdentity.isAdmin) {
      todayQuery = todayQuery.eq("assigned_worker_id", workerIdentity.authUserId);
    }

    const { data: todayData, error: todayError } = await todayQuery;

    if (todayError) {
      console.error("[worker-dashboard] failed to load today's jobs", {
        error: todayError,
        assignedWorkerId: workerIdentity.authUserId,
        today,
      });
    } else {
      console.log("[worker-dashboard] today's jobs query", {
        assignedWorkerId: workerIdentity.authUserId,
        isAdmin: workerIdentity.isAdmin,
        today,
        matches: todayData?.length ?? 0,
      });
      setMyBookings(todayData || []);
    }

    setLoading(false);
  }, [today]);

  const fetchUpcomingBookings = useCallback(async () => {
    setLoadingUpcoming(true);

    const workerIdentity = await getCurrentWorkerIdentity();
    if (!workerIdentity) {
      setUpcomingBookings([]);
      setLoadingUpcoming(false);
      return;
    }

    const tomorrow = getBusinessDateString(1);

    let upcomingQuery = supabase
      .from("bookings")
      .select("*, services(name), booking_add_ons(name, price)")
      .gte("scheduled_date", tomorrow)
      .in("status", UPCOMING_STATUSES)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (!workerIdentity.isAdmin) {
      upcomingQuery = upcomingQuery.eq("assigned_worker_id", workerIdentity.authUserId);
    }

    const { data: upData, error: upError } = await upcomingQuery;

    if (upError) {
      console.error("[worker-dashboard] failed to load upcoming jobs", {
        error: upError,
        assignedWorkerId: workerIdentity.authUserId,
        tomorrow,
        statuses: UPCOMING_STATUSES,
      });
    } else {
      console.log("[worker-dashboard] upcoming jobs query", {
        assignedWorkerId: workerIdentity.authUserId,
        isAdmin: workerIdentity.isAdmin,
        startDate: tomorrow,
        statuses: UPCOMING_STATUSES,
        matches: upData?.length ?? 0,
      });
      setUpcomingBookings(upData || []);
    }

    setLoadingUpcoming(false);
  }, []);

  useEffect(() => {
    fetchTodayBookings();
    fetchUpcomingBookings();
    fetchEarningsData();

    const channel = supabase
      .channel(`worker-dashboard-${today}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchTodayBookings();
          fetchUpcomingBookings();
          fetchEarningsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodayBookings, fetchUpcomingBookings, fetchEarningsData, today]);

  const todayCompleted = useMemo(
    () => myBookings.filter((b) => b.status === "completed"),
    [myBookings]
  );

  const todayStats = useMemo(() => {
    const jobs = todayCompleted.length;
    const revenue = todayCompleted.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
    const earnings = todayCompleted.reduce((s, b) => s + calcWorkerCut(b, workerProfile), 0);
    const tips = todayCompleted.reduce((s, b) => s + (Number(b.tip_amount) || 0), 0);
    return { jobs, revenue, earnings, tips };
  }, [todayCompleted, workerProfile]);

  const weekStats = useMemo(() => {
    const jobs = weekBookings.length;
    const earnings = weekBookings.reduce((s, b) => s + calcWorkerCut(b, workerProfile), 0);
    const tips = weekBookings.reduce((s, b) => s + (Number(b.tip_amount) || 0), 0);
    return { jobs, earnings, tips };
  }, [weekBookings, workerProfile]);

  const todayEstimated = useMemo(() => {
    const upcoming = myBookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status));
    return upcoming.reduce((s, b) => s + calcWorkerCut(b, workerProfile), 0) + todayStats.earnings;
  }, [myBookings, workerProfile, todayStats.earnings]);


  const activeJob = useMemo(
    () => myBookings.find((b) => b.status === "in_progress" && b.clock_in_at),
    [myBookings]
  );

  const scrollToActiveJob = () => {
    const el = document.getElementById(`job-card-${activeJob?.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <WorkerLayout>
      <div className="space-y-6">
        {activeJob && (
          <ActiveJobBanner
            startedAt={activeJob.clock_in_at}
            customerName={activeJob.guest_name || "Customer"}
            onView={scrollToActiveJob}
          />
        )}
        <WeatherWidget />

        {/* Today's Earnings */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Today's Earnings</h2>
              <span className="text-xs text-muted-foreground">{format(new Date(), "EEE, MMM d")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBlock icon={<CheckCircle2 className="h-4 w-4" />} label="Jobs Done" value={fmtCount(todayStats.jobs)} />
              <StatBlock icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={fmtMoney(todayStats.revenue)} />
              <StatBlock icon={<Wallet className="h-4 w-4" />} label="Your Pay" value={fmtMoney(todayStats.earnings)} accent />
              <StatBlock icon={<Coins className="h-4 w-4" />} label="Tips" value={fmtMoney(todayStats.tips)} accent />
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              This week: {weekStats.jobs} {weekStats.jobs === 1 ? "job" : "jobs"} · {fmtMoney(weekStats.earnings)} your pay · {fmtMoney(weekStats.tips)} tips
            </p>
          </CardContent>
        </Card>

        {/* Today's Route */}
        {!loading && myBookings.length > 0 && (
          <TodaysRoute bookings={myBookings} />
        )}

        {/* Today's Jobs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Today's Jobs</h1>
            <span className="text-muted-foreground text-sm">
              {format(new Date(), "EEE, MMM d")}
            </span>
            {myBookings.length > 0 && (
              <>
                <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
                  {myBookings.length}
                </Badge>
                {todayEstimated > 0 && (
                  <span className="text-xs text-green-500 font-medium">· Est. ${todayEstimated.toFixed(todayEstimated % 1 === 0 ? 0 : 2)}</span>
                )}
              </>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : myBookings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No jobs scheduled for today</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myBookings.map((booking) => (
                <div key={booking.id} id={`job-card-${booking.id}`} className="ring-2 ring-primary/30 rounded-lg scroll-mt-20">
                  <WorkerJobCard
                    booking={booking}
                    onStatusChange={() => { fetchTodayBookings(); fetchUpcomingBookings(); fetchEarningsData(); }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Jobs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold">Upcoming Jobs</h2>
            {upcomingBookings.length > 0 && (
              <Badge variant="outline" className="ml-auto text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                {upcomingBookings.length}
              </Badge>
            )}
          </div>

          {loadingUpcoming ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming jobs scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <UpcomingJobCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkerLayout>
  );
}

function UpcomingJobCard({ booking }: { booking: any }) {
  const serviceName = booking.custom_service_description || booking.services?.name || "Detailing Service";
  const customerName = booking.guest_name || "Customer";
  const vehicle = booking.boat_type
    ? [booking.boat_type, booking.boat_length && `${booking.boat_length}ft`, booking.boat_brand].filter(Boolean).join(" · ")
    : booking.aircraft_type
    ? [booking.aircraft_type, booking.tail_number && `Tail: ${booking.tail_number}`].filter(Boolean).join(" · ")
    : [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ");
  const address = [booking.service_address, booking.service_city]
    .filter(Boolean)
    .join(", ");
  const dateLabel = format(new Date(booking.scheduled_date + "T00:00:00"), "EEE, MMM d");
  const statusLabel = booking.status.replace("_", " ");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Date strip */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b border-border/50">
          <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            {dateLabel}
          </span>
          <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_BADGE[booking.status] || ""}`}>
            {statusLabel}
          </Badge>
        </div>

        <div className="p-4 space-y-2.5">
          {/* Time + Service */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="font-bold text-base">{formatTime12(booking.scheduled_time)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[140px]">{serviceName}</span>
            </div>
          </div>

          {/* Customer */}
          <p className="text-sm font-medium">{customerName}</p>

          {/* Vehicle */}
          {vehicle && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-3.5 w-3.5 shrink-0" />
              <span>{vehicle}{!booking.boat_type && !booking.aircraft_type && booking.vehicle_type ? ` (${booking.vehicle_type})` : ""}</span>
            </div>
          )}

          {/* Address */}
          {address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                [booking.service_address, booking.service_city, booking.service_state, booking.service_zip].filter(Boolean).join(", ")
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{address}</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveJobBanner({ startedAt, customerName, onView }: { startedAt: string; customerName: string; onView: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = now - new Date(startedAt).getTime();
  const startedLabel = format(new Date(startedAt), "h:mm a");
  return (
    <Card className="border-red-500/40 bg-red-500/10">
      <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
        <div className="flex-1 min-w-[180px]">
          <p className="text-sm font-bold text-red-500">
            Job in progress since {startedLabel} · {customerName}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            Time on Job: <span className="font-semibold">{formatStopwatch(elapsed)}</span>
          </p>
        </div>
        <Button size="sm" variant="default" onClick={onView}>
          <ArrowDown className="h-4 w-4 mr-1" /> View Job
        </Button>
      </CardContent>
    </Card>
  );
}

function StatBlock({ icon, label, value, accent = false }: { icon: ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
      <div className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${accent ? "text-green-500" : "text-muted-foreground"}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-lg font-bold tabular-nums ${accent && value !== "—" ? "text-green-500" : ""}`}>
        {value}
      </div>
    </div>
  );
}

const STOP_NUMS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"];
const stopNum = (i: number) => STOP_NUMS[i] || `(${i + 1})`;

function buildAddress(b: any): string {
  return [b.service_address, b.service_city, b.service_state, b.service_zip].filter(Boolean).join(", ");
}
function shortName(name?: string): string {
  if (!name) return "Customer";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
function navUrl(addr: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=driving`;
}
function fullRouteUrl(addrs: string[], optimize = false): string {
  if (addrs.length === 0) return "https://www.google.com/maps";
  if (addrs.length === 1) return navUrl(addrs[0]);
  const origin = encodeURIComponent(addrs[0]);
  const destination = encodeURIComponent(addrs[addrs.length - 1]);
  const middle = addrs.slice(1, -1).map((a) => encodeURIComponent(a)).join("|");
  const waypoints = middle
    ? `&waypoints=${optimize ? "optimize:true|" : ""}${middle}`
    : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
}
function parseDurationEstimateMin(s?: string | null): number {
  if (!s) return 0;
  const t = s.toLowerCase();
  const hMatch = t.match(/(\d+(?:\.\d+)?)\s*h/);
  const mMatch = t.match(/(\d+)\s*m/);
  let mins = 0;
  if (hMatch) mins += parseFloat(hMatch[1]) * 60;
  if (mMatch) mins += parseInt(mMatch[1]);
  if (!hMatch && !mMatch) {
    const range = t.match(/(\d+)\s*-\s*(\d+)/);
    if (range) mins = (parseInt(range[1]) + parseInt(range[2])) / 2 * 60;
  }
  return Math.round(mins);
}

function TodaysRoute({ bookings }: { bookings: any[] }) {
  const stops = bookings
    .filter((b) => buildAddress(b))
    .sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""));

  if (stops.length === 0) return null;

  const addresses = stops.map(buildAddress);
  const estDriveMin = Math.max(0, stops.length - 1) * 15;

  // Single job: just a Navigate button
  if (stops.length === 1) {
    const only = stops[0];
    const addr = buildAddress(only);
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <MapIcon className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold">Today's Job Location</p>
              <p className="text-xs text-muted-foreground truncate">{addr}</p>
            </div>
          </div>
          <Button asChild size="sm">
            <a href={navUrl(addr)} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4 mr-1.5" /> Navigate to Job
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">Today's Route</h2>
            <Badge variant="outline" className="text-xs">{stops.length} stops</Badge>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={fullRouteUrl(addresses, true)} target="_blank" rel="noopener noreferrer">
                <RouteIcon className="h-4 w-4 mr-1.5" /> Optimize Route
              </a>
            </Button>
            <Button asChild size="sm">
              <a href={fullRouteUrl(addresses, false)} target="_blank" rel="noopener noreferrer">
                <MapIcon className="h-4 w-4 mr-1.5" /> Open in Maps
              </a>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Estimated route: ~{estDriveMin} min driving between stops
        </p>

        <ol className="space-y-2">
          {stops.map((b, i) => {
            const addr = buildAddress(b);
            const customer = shortName(b.guest_name);
            const pkg = b.custom_service_description || b.services?.name || "Service";
            const status = (b.status || "").replace("_", " ");
            return (
              <li key={b.id} className="rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl font-bold text-primary leading-none mt-0.5 tabular-nums">
                    {stopNum(i)}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold">{formatTime12(b.scheduled_time)}</span>
                      <span className="text-sm text-muted-foreground">·</span>
                      <span className="text-sm font-medium truncate">{customer}</span>
                      <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_BADGE[b.status] || ""}`}>
                        {status}
                      </Badge>
                    </div>
                    <a
                      href={navUrl(addr)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{addr}</span>
                    </a>
                    <p className="text-xs text-muted-foreground truncate">{pkg}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <a href={navUrl(addr)} target="_blank" rel="noopener noreferrer">
                      <Navigation className="h-3.5 w-3.5 mr-1" /> Navigate
                    </a>
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
