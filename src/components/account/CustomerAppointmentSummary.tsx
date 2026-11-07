import { format } from "date-fns";
import { Calendar, Clock, Car, CalendarClock, CalendarPlus, FileText, MapPin, Navigation, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime12h, parseDateString } from "@/lib/time-format";
import { paymentStatusLabel } from "@/lib/booking-payment-summary";
import { downloadICS, createBookingCalendarEvent } from "@/lib/calendar";
import { joinAddress, statusLabel } from "@/components/portal/portal-format";
import type { Booking } from "./AppointmentCard";

export function CustomerAppointmentSummary({ booking, onDetails, onReschedule, onCancel }: {
  booking: Booking;
  onDetails: (booking: Booking) => void;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}) {
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || booking.vehicle_type;
  const address = joinAddress([booking.service_address, booking.service_city, booking.service_state, booking.service_zip]);
  const canModify = booking.status !== "in_progress";
  return <section aria-labelledby="next-appointment-heading">
    <h2 id="next-appointment-heading" className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-primary">Next appointment</h2>
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-lg font-bold leading-tight">{booking.services?.name || "Detailing Service"}</h3>
        <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{statusLabel(booking.status)}</span>
      </div>
      <dl className="grid gap-2 text-[15px] sm:grid-cols-2">
        <div className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><dt className="sr-only">Date</dt><dd>{format(parseDateString(booking.scheduled_date), "EEE, MMM d, yyyy")}</dd></div>
        <div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><dt className="sr-only">Time</dt><dd>{formatTime12h(booking.scheduled_time)} Central · 30-min arrival window</dd></div>
        {vehicle && <div className="flex items-start gap-2"><Car className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><dt className="sr-only">Vehicle</dt><dd className="break-words">{vehicle}</dd></div>}
        {address && <div className="flex items-start gap-2 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><dt className="sr-only">Address</dt><dd className="break-words">{address}</dd></div>}
      </dl>
      <div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
        <div><p className="text-xs text-muted-foreground">Payment status</p><p className="text-sm font-medium">{paymentStatusLabel(booking.payment_status)}</p></div>
        <div className="text-right"><p className="text-xs text-muted-foreground">Saved total</p><p className="font-bold text-primary">{booking.total_price == null ? "Not available" : `$${Number(booking.total_price).toFixed(2)}`}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {canModify && <Button className="h-11" onClick={() => onReschedule(booking)}><CalendarClock className="mr-2 h-4 w-4" />Reschedule</Button>}
        <Button className="h-11" variant="outline" onClick={() => onDetails(booking)}><FileText className="mr-2 h-4 w-4" />Details</Button>
        <Button className="h-11" variant="outline" onClick={() => downloadICS(createBookingCalendarEvent(booking as any))}><CalendarPlus className="mr-2 h-4 w-4" />Add to calendar</Button>
        {address ? (
          <Button className="h-11" variant="outline" asChild>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" />Directions</a>
          </Button>
        ) : null}
        {canModify && <Button className="col-span-2 h-11 text-destructive hover:text-destructive" variant="ghost" onClick={() => onCancel(booking)}><XCircle className="mr-2 h-4 w-4" />Cancel appointment</Button>}
      </div>
    </div>
  </section>;
}
