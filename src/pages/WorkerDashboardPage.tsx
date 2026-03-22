import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { WorkerJobCard } from "@/components/worker/WorkerJobCard";
import { WeatherWidget } from "@/components/worker/WeatherWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Inbox, UserCheck, CalendarClock, MapPin, Car, Wrench, Clock } from "lucide-react";
import { format } from "date-fns";
import { getBusinessDateString, getCurrentWorkerIdentity } from "@/lib/workerAssignments";

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
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  const today = getBusinessDateString();

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

    const channel = supabase
      .channel(`worker-dashboard-${today}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchTodayBookings();
          fetchUpcomingBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodayBookings, fetchUpcomingBookings, today]);

  return (
    <WorkerLayout>
      <div className="space-y-6">
        <WeatherWidget />

        {/* Today's Jobs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Today's Jobs</h1>
            <span className="text-muted-foreground text-sm">
              {format(new Date(), "EEE, MMM d")}
            </span>
            {myBookings.length > 0 && (
              <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
                {myBookings.length}
              </Badge>
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
                <div key={booking.id} className="ring-2 ring-primary/30 rounded-lg">
                  <WorkerJobCard
                    booking={booking}
                    onStatusChange={() => { fetchTodayBookings(); fetchUpcomingBookings(); }}
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
  const serviceName = booking.services?.name || "Detailing Service";
  const customerName = booking.guest_name || "Customer";
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model]
    .filter(Boolean)
    .join(" ");
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
              <span>{vehicle}{booking.vehicle_type ? ` (${booking.vehicle_type})` : ""}</span>
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
