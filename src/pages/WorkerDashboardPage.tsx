import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { WorkerJobCard } from "@/components/worker/WorkerJobCard";
import { WeatherWidget } from "@/components/worker/WeatherWidget";
import { Loader2, CalendarDays, Inbox, UserCheck } from "lucide-react";
import { format } from "date-fns";

export default function WorkerDashboardPage() {
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayBookings = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    setCurrentUserId(userId);

    const { data, error } = await supabase
      .from("bookings")
      .select("*, services(name), booking_add_ons(name, price)")
      .eq("scheduled_date", today)
      .neq("status", "cancelled")
      .order("scheduled_time", { ascending: true });

    if (!error && data) {
      if (userId) {
        setMyBookings(data.filter((b: any) => b.assigned_worker_id === userId));
        setAllBookings(data.filter((b: any) => b.assigned_worker_id !== userId));
      } else {
        setMyBookings([]);
        setAllBookings(data);
      }
    }
    setLoading(false);
  }, [today]);

  useEffect(() => {
    fetchTodayBookings();
  }, [fetchTodayBookings]);

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
        ) : myBookings.length === 0 && allBookings.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No jobs scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Your assigned jobs */}
            {myBookings.length > 0 && (
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
            )}

            {/* All other jobs */}
            {allBookings.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {myBookings.length > 0 ? "All Jobs Today" : "Today's Jobs"}
                </h2>
                <div className="space-y-4">
                  {allBookings.map((booking) => (
                    <WorkerJobCard
                      key={booking.id}
                      booking={booking}
                      onStatusChange={fetchTodayBookings}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
