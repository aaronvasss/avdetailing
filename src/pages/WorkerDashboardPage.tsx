import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { WorkerJobCard } from "@/components/worker/WorkerJobCard";
import { WeatherWidget } from "@/components/worker/WeatherWidget";
import { Loader2, CalendarDays, Inbox, UserCheck } from "lucide-react";
import { format } from "date-fns";

export default function WorkerDashboardPage() {
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayBookings = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMyBookings([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*, services(name), booking_add_ons(name, price)")
      .eq("assigned_worker_id", user.id)
      .eq("scheduled_date", today)
      .neq("status", "cancelled")
      .order("scheduled_time", { ascending: true });

    if (!error) {
      setMyBookings(data || []);
    }

    setLoading(false);
  }, [today]);

  useEffect(() => {
    fetchTodayBookings();

    const channel = supabase
      .channel(`worker-dashboard-${today}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchTodayBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodayBookings, today]);

  return (
    <WorkerLayout>
      <div className="space-y-4">
        <WeatherWidget />

        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Today's Jobs</h1>
          <span className="text-muted-foreground text-sm">
            {format(new Date(), "EEEE, MMM d")}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : myBookings.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No jobs assigned to you for today</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Your Jobs</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{myBookings.length}</span>
              </div>
              <div className="space-y-4">
                {myBookings.map((booking) => (
                  <div key={booking.id} className="ring-2 ring-primary/30 rounded-lg">
                    <WorkerJobCard
                      booking={booking}
                      onStatusChange={fetchTodayBookings}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}

