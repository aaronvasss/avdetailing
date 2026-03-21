import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  CalendarClock,
  XCircle,
  CalendarPlus,
  MessageSquare,
  MoreVertical,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { downloadICS, createBookingCalendarEvent, generateGoogleCalendarUrl } from "@/lib/calendar";
import { toast } from "sonner";

interface BookingAddOn {
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string | null;
  total_price: number | null;
  subtotal: number | null;
  add_ons_total: number | null;
  deposit_amount: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  vehicle_year: number | null;
  vehicle_size: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  customer_notes: string | null;
  duration_minutes: number | null;
  created_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  payment_method: string | null;
  user_id: string | null;
  assigned_worker_id?: string | null;
  worker_pay_type?: string | null;
  worker_pay_rate?: number | null;
  service_id?: string;
  services: {
    name: string;
    description: string | null;
  } | null;
  booking_add_ons: BookingAddOn[];
}

interface AppointmentCardProps {
  booking: Booking;
  onViewDetails: (booking: Booking) => void;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-muted",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  no_show: {
    label: "No Show",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export function AppointmentCard({
  booking,
  onViewDetails,
  onReschedule,
  onCancel,
  compact = false,
}: AppointmentCardProps) {
  const isUpcoming =
    new Date(booking.scheduled_date) >= new Date() &&
    booking.status !== "cancelled" &&
    booking.status !== "completed";
  const canModify =
    isUpcoming && booking.status !== "in_progress";

  const status = statusConfig[booking.status] || statusConfig.pending;

  const handleAddToCalendar = (type: "ics" | "google") => {
    const event = createBookingCalendarEvent(booking);
    
    if (type === "ics") {
      downloadICS(event);
      toast.success("Calendar file downloaded");
    } else {
      window.open(generateGoogleCalendarUrl(event), "_blank");
    }
  };

  const handleMessage = () => {
    // Open SMS or contact
    window.location.href = "sms:+12255216264";
  };

  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model]
    .filter(Boolean)
    .join(" ");

  const address = booking.service_address
    ? `${booking.service_address}, ${booking.service_city}`
    : booking.service_city || "Location TBD";

  const isOnlinePayment = booking.payment_method === 'online' || booking.payment_method === 'stripe' || booking.payment_method === 'card';
  // Ensure displayed total is never less than subtotal + add-ons
  const computedTotal = (booking.subtotal || 0) + (booking.add_ons_total || 0);
  const effectiveTotal = Math.max(booking.total_price || 0, computedTotal);
  const displayTotal = effectiveTotal > 0
    ? isOnlinePayment
      ? (effectiveTotal * 1.035).toFixed(2)
      : effectiveTotal.toFixed(2)
    : null;

  if (compact) {
    return (
      <Card
        className="group cursor-pointer transition-all duration-200 hover:bg-accent/5 border-border/50"
        onClick={() => onViewDetails(booking)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Date Block */}
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                <span className="text-xs font-medium text-primary uppercase">
                  {format(new Date(booking.scheduled_date), "MMM")}
                </span>
                <span className="text-xl font-bold text-primary">
                  {format(new Date(booking.scheduled_date), "d")}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold truncate">
                    {booking.services?.name || "Detailing Service"}
                  </h4>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {booking.scheduled_time}
                  </span>
                  {vehicle && (
                    <span className="flex items-center gap-1 truncate">
                      <Car className="h-3 w-3" />
                      {vehicle}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {canModify && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAddToCalendar("ics")}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Download .ics (Apple)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddToCalendar("google")}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Add to Google Calendar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReschedule(booking)}>
                      <CalendarClock className="h-4 w-4 mr-2" />
                      Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMessage}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onCancel(booking)}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-border/50 overflow-hidden"
      onClick={() => onViewDetails(booking)}
    >
      {/* Status Bar */}
      <div
        className={`h-1 ${
          booking.status === "confirmed"
            ? "bg-emerald-500"
            : booking.status === "pending"
            ? "bg-yellow-500"
            : booking.status === "in_progress"
            ? "bg-blue-500"
            : "bg-muted"
        }`}
      />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {booking.services?.name || "Detailing Service"}
            </h3>
            <Badge variant="outline" className={`mt-1 ${status.className}`}>
              {status.label}
            </Badge>
          </div>
          {displayTotal && (
            <div className="text-right">
              <p className="text-xl font-bold text-primary">${displayTotal}</p>
              <p className="text-xs text-muted-foreground">{isOnlinePayment ? "Total with fees" : "Total"}</p>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary/70" />
            <span>{format(new Date(booking.scheduled_date), "EEE, MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary/70" />
            <span>{booking.scheduled_time}</span>
          </div>
          {vehicle && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4 text-primary/70" />
              <span className="truncate">{vehicle}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary/70" />
            <span className="truncate">{address}</span>
          </div>
        </div>

        {/* Actions */}
        {canModify && (
          <div
            className="flex flex-wrap gap-2 pt-4 border-t border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(booking)}
              className="flex-1"
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(booking)}
              className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAddToCalendar("ics")}>
                  Download .ics (Apple/Outlook)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddToCalendar("google")}>
                  Add to Google Calendar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleMessage}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        )}

        {/* Past booking indicator */}
        {!isUpcoming && (
          <div className="pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
            <span>Booking completed</span>
            {displayTotal && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {displayTotal}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
