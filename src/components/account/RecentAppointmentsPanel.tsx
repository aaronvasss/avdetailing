import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, History, RotateCcw, MapPin, Car } from "lucide-react";
import { formatTime12h, parseDateString } from "@/lib/time-format";
import { format } from "date-fns";
import type { PastBooking } from "@/lib/recentBookings";
import { describePastVehicle } from "@/lib/recentBookings";

interface Props {
  bookings: PastBooking[];
  loading: boolean;
  onUse: (booking: PastBooking) => void;
}

const statusTone: Record<string, string> = {
  completed: "bg-green-500/15 text-green-600 border-green-500/30",
  confirmed: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
};

export function RecentAppointmentsPanel({ bookings, loading, onUse }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading recent appointments…
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
        No previous appointments for this customer yet.
      </div>
    );
  }

  const last = bookings[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4 text-primary" />
          Recent appointments
        </div>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-10"
          onClick={() => onUse(last)}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Repeat Last Appointment
        </Button>
      </div>

      <div className="space-y-2">
        {bookings.map(b => {
          let dateLabel = b.scheduled_date;
          try {
            dateLabel = format(parseDateString(b.scheduled_date), "EEE, MMM d, yyyy");
          } catch { /* keep raw */ }
          const addressLine = [b.service_address, b.service_city, b.service_zip]
            .filter(Boolean)
            .join(", ");
          return (
            <div key={b.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {dateLabel} · {formatTime12h(b.scheduled_time)}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {b.custom_service_description || b.service_name || "Detailing Service"}
                    {b.package_name ? ` — ${b.package_name}` : ""}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={statusTone[b.status] || "bg-muted text-muted-foreground"}
                >
                  {b.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 shrink-0" />
                  {describePastVehicle(b)}
                  {b.license_plate ? ` · ${b.license_plate}` : ""}
                </p>
                {addressLine && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {addressLine}
                  </p>
                )}
                <p>
                  Add-ons:{" "}
                  {b.add_ons.length
                    ? b.add_ons.map(a => `${a.name} ($${a.price.toFixed(2)})`).join(", ")
                    : "None"}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  ${Number(b.total_price ?? 0).toFixed(2)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => onUse(b)}
                >
                  Use This Appointment
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
