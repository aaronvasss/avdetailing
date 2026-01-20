import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  deposit_amount: number | null;
  services: {
    name: string;
  } | null;
}

interface CancelBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  // Calculate hours until appointment
  const appointmentDate = new Date(booking.scheduled_date);
  const [hours, minutes] = booking.scheduled_time.match(/(\d+):(\d+)/)?.slice(1) || ["9", "00"];
  const isPM = booking.scheduled_time.toLowerCase().includes("pm");
  let hour = parseInt(hours);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  appointmentDate.setHours(hour, parseInt(minutes), 0, 0);

  const hoursUntil = differenceInHours(appointmentDate, new Date());
  const isLastMinute = hoursUntil < 24;
  const depositForfeited = isLastMinute && booking.deposit_amount && booking.deposit_amount > 0;

  const handleCancel = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          customer_notes: booking.services?.name
            ? `${reason ? `Cancellation reason: ${reason}` : "Customer cancelled"}`
            : reason || "Customer cancelled",
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Booking cancelled", {
        description: "We're sorry to see you go. We hope to serve you again soon!",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error cancelling:", error);
      toast.error("Failed to cancel", {
        description: error.message || "Please try again or contact us.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Booking
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to cancel your{" "}
                <strong>{booking.services?.name || "appointment"}</strong> on{" "}
                <strong>
                  {format(new Date(booking.scheduled_date), "MMMM d, yyyy")}
                </strong>{" "}
                at <strong>{booking.scheduled_time}</strong>?
              </p>

              {isLastMinute && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">
                      Late Cancellation Notice
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This booking is within 24 hours.
                      {depositForfeited && (
                        <>
                          {" "}
                          Your deposit of{" "}
                          <strong>${booking.deposit_amount?.toFixed(2)}</strong> may
                          be forfeited.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Reason for cancellation (optional)
                </label>
                <Textarea
                  placeholder="Let us know why you're cancelling..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Yes, Cancel Booking
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
