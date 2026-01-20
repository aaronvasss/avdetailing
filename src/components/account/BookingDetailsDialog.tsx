import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  DollarSign,
  Phone,
  Mail,
  CalendarClock,
  XCircle,
} from "lucide-react";

interface BookingAddOn {
  id: string;
  name: string;
  price: number;
}

interface Booking {
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
  services: {
    name: string;
    description: string | null;
  } | null;
  booking_add_ons?: BookingAddOn[];
}

interface BookingDetailsDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
  no_show: "bg-red-500/10 text-red-500 border-red-500/20",
};

const paymentStatusColors: Record<string, string> = {
  unpaid: "bg-red-500/10 text-red-500 border-red-500/20",
  partial: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  refunded: "bg-muted text-muted-foreground border-muted",
};

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onReschedule,
  onCancel,
}: BookingDetailsDialogProps) {
  if (!booking) return null;

  const isUpcoming =
    new Date(booking.scheduled_date) >= new Date() &&
    booking.status !== "cancelled" &&
    booking.status !== "completed";

  const canReschedule = isUpcoming && booking.status !== "in_progress";
  const canCancel = isUpcoming && booking.status !== "in_progress";

  const processingFee = booking.total_price ? booking.total_price * 0.035 : 0;
  const totalWithFee = booking.total_price
    ? booking.total_price + processingFee
    : 0;
  const remainingBalance = totalWithFee - (booking.deposit_amount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{booking.services?.name || "Detailing Service"}</span>
            <Badge className={statusColors[booking.status]}>
              {booking.status.replace("_", " ")}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date & Time */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {format(new Date(booking.scheduled_date), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {booking.scheduled_time}
                  {booking.duration_minutes && (
                    <span className="text-sm">
                      ({Math.floor(booking.duration_minutes / 60)}h
                      {booking.duration_minutes % 60 > 0
                        ? ` ${booking.duration_minutes % 60}m`
                        : ""}
                      )
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle
            </h4>
            <p className="font-medium">
              {booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {booking.vehicle_type}
              {booking.vehicle_size && ` • ${booking.vehicle_size}`}
            </p>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Service Location
            </h4>
            <p className="font-medium">{booking.service_address}</p>
            <p className="text-sm text-muted-foreground">
              {booking.service_city}, {booking.service_state} {booking.service_zip}
            </p>
          </div>

          {/* Customer Notes */}
          {booking.customer_notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Your Notes
              </h4>
              <p className="text-sm bg-muted/50 rounded-lg p-3">
                {booking.customer_notes}
              </p>
            </div>
          )}

          <Separator />

          {/* Pricing */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Summary
            </h4>
            <div className="space-y-2 text-sm">
              {booking.subtotal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span>${booking.subtotal.toFixed(2)}</span>
                </div>
              )}
              {booking.add_ons_total && booking.add_ons_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span>${booking.add_ons_total.toFixed(2)}</span>
                </div>
              )}
              {booking.booking_add_ons && booking.booking_add_ons.length > 0 && (
                <div className="pl-4 space-y-1">
                  {booking.booking_add_ons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex justify-between text-xs text-muted-foreground"
                    >
                      <span>+ {addon.name}</span>
                      <span>${addon.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Fee (3.5%)</span>
                <span>${processingFee.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="text-primary">${totalWithFee.toFixed(2)}</span>
              </div>
              {booking.deposit_amount && booking.deposit_amount > 0 && (
                <>
                  <div className="flex justify-between text-green-500">
                    <span>Deposit Paid</span>
                    <span>-${booking.deposit_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-yellow-500">
                    <span>Balance Due</span>
                    <span>${remainingBalance.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Payment:</span>
              <Badge
                className={
                  paymentStatusColors[booking.payment_status || "unpaid"]
                }
              >
                {booking.payment_status || "unpaid"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="flex gap-4">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href="tel:+12252268979">
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href="mailto:aaronvasquez@avdetailingg.com">
                <Mail className="h-4 w-4 mr-2" />
                Email Us
              </a>
            </Button>
          </div>

          {/* Actions */}
          {isUpcoming && (
            <div className="flex gap-3">
              {canReschedule && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onReschedule(booking)}
                >
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onCancel(booking)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          )}

          {/* Booking ID */}
          <p className="text-xs text-muted-foreground text-center">
            Booking ID: {booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
