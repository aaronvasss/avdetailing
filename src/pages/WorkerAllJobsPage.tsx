import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { WorkerJobCard } from "@/components/worker/WorkerJobCard";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, Inbox } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { getBusinessDateString, getCurrentWorkerIdentity } from "@/lib/workerAssignments";
import { SEOHead } from "@/components/seo/SEOHead";

type FilterType = "today" | "week" | "upcoming" | "all";

export default function WorkerAllJobsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("today");

  const fetchBookings = useCallback(async () => {
    setLoading(true);

    const workerIdentity = await getCurrentWorkerIdentity();
    if (!workerIdentity) {
      setLoading(false);
      return;
    }

    const today = getBusinessDateString();

    let query = supabase
      .from("bookings")
      .select("*, services(name), booking_add_ons(name, price)")
      .neq("status", "cancelled")
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (!workerIdentity.isAdmin) {
      query = query.eq("assigned_worker_id", workerIdentity.authUserId);
    }

    if (filter === "today") {
      query = query.eq("scheduled_date", today);
    } else if (filter === "week") {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      query = query.gte("scheduled_date", weekStart).lte("scheduled_date", weekEnd);
    } else if (filter === "upcoming") {
      query = query.gte("scheduled_date", today);
    }

    const { data, error } = await query;
    if (!error) setBookings(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel("worker-all-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  const filters: { key: FilterType; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "upcoming", label: "Upcoming" },
    { key: "all", label: "All" },
  ];

  return (
    <WorkerLayout>
      <SEOHead title="Worker Jobs" description="Private page." path="/worker/jobs" noIndex />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">All Appointments</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={cn("shrink-0", filter === f.key && "bg-primary text-primary-foreground")}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No appointments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <WorkerJobCard
                key={booking.id}
                booking={booking}
                onStatusChange={fetchBookings}
              />
            ))}
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
