import { useState, useEffect } from "react";
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
  User,
  CheckCircle,
  PlayCircle,
  Loader2,
  StickyNote,
  CreditCard,
  Pencil,
  Bell,
  Send,
  MessageSquare,
  Check,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendInProgressSms } from "@/lib/in-progress-sms";
import { toast } from "sonner";
import { Booking } from "./AppointmentCard";
import { BookingEditDialog } from "@/components/admin/BookingEditDialog";

interface BookingDetailsDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  isAdmin?: boolean;
  onStatusChange?: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
};

const paymentStatusColors: Record<string, string> = {
  unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  refunded: "bg-muted text-muted-foreground border-muted",
};

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onReschedule,
  onCancel,
  isAdmin = false,
  onStatusChange,
}: BookingDetailsDialogProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [profileData, setProfileData] = useState<{ full_name: string | null; email: string | null; phone: string | null } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Resend notification states
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [sendingAdmin, setSendingAdmin] = useState(false);
  const [emailSent, setEmailSent] = useState<"success" | "error" | null>(null);
  const [smsSent, setSmsSent] = useState<"success" | "error" | null>(null);
  const [adminSent, setAdminSent] = useState<"success" | "error" | null>(null);
  const [emailError, setEmailError] = useState("");
  const [smsError, setSmsError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [notificationLog, setNotificationLog] = useState<any[]>([]);

  // Fetch profile data for logged-in users
  useEffect(() => {
    if (booking?.user_id && !booking.guest_name) {
      supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", booking.user_id)
        .maybeSingle()
        .then(({ data }) => setProfileData(data));
    } else {
      setProfileData(null);
    }
  }, [booking?.id, booking?.user_id]);

  if (!booking) return null;

  const isUpcoming =
    new Date(booking.scheduled_date) >= new Date() &&
    booking.status !== "cancelled" &&
    booking.status !== "completed";

  const canReschedule = isUpcoming && booking.status !== "in_progress";
  const canCancel = isUpcoming && booking.status !== "in_progress";

  const isOnlinePayment = booking.payment_method === 'online' || booking.payment_method === 'stripe' || booking.payment_method === 'card';
  const processingFee = isOnlinePayment && booking.total_price ? booking.total_price * 0.035 : 0;
  const totalWithFee = booking.total_price
    ? booking.total_price + processingFee
    : 0;
  const remainingBalance = totalWithFee - (booking.deposit_amount || 0);

  // Resolve customer info from profile or guest fields
  const customerName = profileData?.full_name || booking.guest_name || "Unknown";
  const customerEmail = profileData?.email || booking.guest_email;
  const customerPhone = profileData?.phone || booking.guest_phone;

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", booking.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      if (newStatus === "in_progress") {
        sendInProgressSms(booking.id);
      }
      onStatusChange?.();
      onOpenChange(false);
    }
    setUpdatingStatus(false);
  };

  const handleEditSave = () => {
    onStatusChange?.();
    setEditDialogOpen(false);
  };

  // Build edit-compatible booking object for BookingEditDialog
  const editBooking = booking ? {
    ...booking,
    payment_status: booking.payment_status || "unpaid",
    payment_method: booking.payment_method || null,
    service_id: (booking as any).service_id || "",
    user_id: (booking as any).user_id || null,
    stripe_payment_intent_id: (booking as any).stripe_payment_intent_id || null,
    stripe_checkout_session_id: (booking as any).stripe_checkout_session_id || null,
    services: booking.services ? { name: booking.services.name, slug: (booking.services as any)?.slug || "" } : null,
    profile_name: profileData?.full_name || null,
    profile_phone: profileData?.phone || null,
    profile_email: profileData?.email || null,
  } : null;

  return (
    <>
      <Dialog open={open && !editDialogOpen} onOpenChange={onOpenChange}>
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
            {/* Admin: Customer Info */}
            {isAdmin && (
              <div className="bg-accent/30 rounded-lg p-4 border border-border/50">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </h4>
                <p className="font-semibold">{customerName}</p>
                {customerEmail && (
                  <a href={`mailto:${customerEmail}`} className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-1">
                    <Mail className="h-3 w-3" /> {customerEmail}
                  </a>
                )}
                {customerPhone && (
                  <a href={`tel:${customerPhone}`} className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-1">
                    <Phone className="h-3 w-3" /> {customerPhone}
                  </a>
                )}
              </div>
            )}

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
            {booking.service_address && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Location
                </h4>
                <p className="font-medium">{booking.service_address}</p>
                {(booking.service_city || booking.service_state || booking.service_zip) && (
                  <p className="text-sm text-muted-foreground">
                    {[booking.service_city, booking.service_state].filter(Boolean).join(", ")} {booking.service_zip}
                  </p>
                )}
              </div>
            )}

            {/* Customer Notes */}
            {booking.customer_notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {isAdmin ? "Customer Notes" : "Your Notes"}
                </h4>
                <p className="text-sm bg-muted/50 rounded-lg p-3">
                  {booking.customer_notes}
                </p>
              </div>
            )}

            {/* Admin: Internal Notes */}
            {isAdmin && booking.internal_notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Internal Notes
                </h4>
                <p className="text-sm bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  {booking.internal_notes}
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
                {booking.subtotal != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span>${booking.subtotal.toFixed(2)}</span>
                  </div>
                )}
                {/* Add-ons section */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span>
                    {booking.add_ons_total && booking.add_ons_total > 0
                      ? `$${booking.add_ons_total.toFixed(2)}`
                      : "None"}
                  </span>
                </div>
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
                {isOnlinePayment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee (3.5%)</span>
                    <span>${processingFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="text-primary">${totalWithFee.toFixed(2)}</span>
                </div>
                {booking.deposit_amount && booking.deposit_amount > 0 && (
                  <>
                    <div className="flex justify-between text-emerald-500">
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
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Payment:</span>
                <Badge
                  className={
                    paymentStatusColors[booking.payment_status || "unpaid"]
                  }
                >
                  {booking.payment_status || "unpaid"}
                </Badge>
                {isAdmin && booking.payment_method && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {booking.payment_method.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Admin: Edit + Status Change */}
            {isAdmin && (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Booking
                </Button>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Update Status
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {booking.status !== "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange("confirmed")}
                        className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                      >
                        {updatingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Confirm
                      </Button>
                    )}
                    {booking.status !== "in_progress" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange("in_progress")}
                        className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                      >
                        {updatingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                        In Progress
                      </Button>
                    )}
                    {booking.status !== "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange("completed")}
                        className="border-muted-foreground/30 text-muted-foreground hover:bg-muted/50"
                      >
                        {updatingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Completed
                      </Button>
                    )}
                    {booking.status !== "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange("cancelled")}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        {updatingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact (non-admin) */}
            {!isAdmin && (
              <>
                <div className="flex gap-4">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href="tel:+12255216264">
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
              </>
            )}

            {/* Booking ID */}
            <p className="text-xs text-muted-foreground text-center">
              Booking ID: {booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      {isAdmin && (
        <BookingEditDialog
          booking={editDialogOpen ? editBooking as any : null}
          open={editDialogOpen}
          onOpenChange={(o) => {
            if (!o) setEditDialogOpen(false);
          }}
          onSave={handleEditSave}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}
