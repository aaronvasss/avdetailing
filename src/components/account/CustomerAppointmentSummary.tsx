import { format } from "date-fns";
import { Calendar, Clock, Car, CalendarClock, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime12h, parseDateString } from "@/lib/time-format";
import { paymentStatusLabel } from "@/lib/booking-payment-summary";
import type { Booking } from "./AppointmentCard";

export function CustomerAppointmentSummary({ booking, onDetails, onReschedule, onCancel }: {
  booking: Booking;
  onDetails: (booking: Booking) => void;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}) {
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || booking.vehicle_type;
  const canModify = booking.status !== "in_progress";
  return <section aria-labelledby="next-appointment-heading">
    <h2 id="next-appointment-heading" className="text-sm font-semibold text-primary mb-3">Next Appointment</h2>
    <Card className="border-primary/30">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-xl font-bold min-w-0 break-words">{booking.services?.name || "Detailing Service"}</h3>
          <span className="text-xs text-muted-foreground capitalize">{booking.status.replace(/_/g, " ")}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <p className="flex items-start gap-2"><Calendar className="h-4 w-4 shrink-0 text-primary mt-0.5" />{format(parseDateString(booking.scheduled_date), "EEEE, MMMM d, yyyy")}</p>
          <p className="flex items-start gap-2"><Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" />{formatTime12h(booking.scheduled_time)} Central Time</p>
          {vehicle && <p className="flex items-start gap-2 sm:col-span-2"><Car className="h-4 w-4 shrink-0 text-primary mt-0.5" /><span className="break-words">{vehicle}</span></p>}
        </div>
        <p className="text-xs text-muted-foreground">30-minute arrival window</p>
        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-3">
          <div><p className="text-xs text-muted-foreground">Payment status</p><p className="text-sm font-medium">{paymentStatusLabel(booking.payment_status)}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Saved total</p><p className="font-bold text-primary">{booking.total_price == null ? "Not available" : `$${Number(booking.total_price).toFixed(2)}`}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button size="sm" variant="outline" onClick={() => onDetails(booking)}><FileText className="h-4 w-4 mr-2" />Details</Button>
          {canModify && <>
            <Button size="sm" onClick={() => onReschedule(booking)}><CalendarClock className="h-4 w-4 mr-2" />Reschedule</Button>
            <Button size="sm" variant="ghost" className="col-span-2 text-destructive" onClick={() => onCancel(booking)}><XCircle className="h-4 w-4 mr-2" />Cancel appointment</Button>
          </>}
        </div>
      </CardContent>
    </Card>
  </section>;
}