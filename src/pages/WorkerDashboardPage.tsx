import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { WorkerJobCard } from "@/components/worker/WorkerJobCard";
import { Loader2, CalendarDays, Inbox } from "lucide-react";
import { format } from "date-fns";

export default function WorkerDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, services(name), booking_add_ons(name, price)")
      .eq("scheduled_date", today)
      .neq("status", "cancelled")
      .order("scheduled_time", { ascending: true });

    if (!error) setBookings(data || []);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    fetchTodayBookings();
  }, [fetchTodayBookings]);

  return (
    <WorkerLayout>
      <div className="space-y-4">
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
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No jobs scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <WorkerJobCard
                key={booking.id}
                booking={booking}
                onStatusChange={fetchTodayBookings}
              />
            ))}
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
