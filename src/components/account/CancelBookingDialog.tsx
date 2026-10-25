import { parseDateString, businessAppointmentInstant, businessToday, formatTime12h } from "@/lib/time-format";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { cancellationProblem, cancellationConsequences } from "../../../supabase/functions/_shared/cancellation-rules";

interface Booking {
  id: string; scheduled_date: string; scheduled_time: string; status: string; deposit_amount: number | null;
  vehicle_year?: number | null; vehicle_make?: string | null; vehicle_model?: string | null; vehicle_type?: string | null;
  services: { name: string } | null;
}
interface Props { booking: Booking | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void; manageToken?: string }
export function CancelBookingDialog({ booking, open, onOpenChange, onSuccess, manageToken }: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  useEffect(() => { if (open) { setReason(""); setError(null); } }, [open, booking?.id]);
  if (!booking) return null;
  const problem = cancellationProblem(booking, businessToday());
  const hoursUntil = (businessAppointmentInstant(booking.scheduled_date, booking.scheduled_time).getTime() - Date.now()) / 3600000;
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || booking.vehicle_type || "Vehicle not listed";
  const handleCancel = async () => {
    if (submitting.current || problem) return;
    submitting.current = true; setLoading(true); setError(null);
    try {
      const { data, error: requestError } = await supabase.functions.invoke("cancel-customer-booking", {
        body: { bookingId: booking.id, expectedDate: booking.scheduled_date, expectedTime: booking.scheduled_time, reason: reason.trim(), ...(manageToken ? { manageToken } : {}) },
      });
      if (requestError || data?.error || !data?.ok) {
        let message = data?.error;
        if (!message && requestError?.context instanceof Response) {
          try { message = (await requestError.context.json()).error; } catch { /* Use safe fallback. */ }
        }
        setError(message || "We couldn't cancel right now. Your appointment is unchanged. Try again or contact us.");
        return;
      }
      toast.success("Appointment cancelled");
      onOpenChange(false); onSuccess();
    } catch {
      setError("We couldn't cancel right now. Your appointment is unchanged. Try again or contact us.");
    } finally { submitting.current = false; setLoading(false); }
  };
  return (
    <AlertDialog open={open} onOpenChange={(value) => { if (!submitting.current) onOpenChange(value); }}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" />Cancel appointment?</AlertDialogTitle>
          <AlertDialogDescription>Review your appointment before confirming cancellation.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 text-sm">
          <dl className="space-y-2 border-b border-border pb-4">
            <div><dt className="text-muted-foreground">Service</dt><dd className="font-semibold break-words">{booking.services?.name || "Detailing Service"}</dd></div>
            <div><dt className="text-muted-foreground">Vehicle</dt><dd className="break-words">{vehicle}</dd></div>
            <div><dt className="text-muted-foreground">Appointment</dt><dd>{format(parseDateString(booking.scheduled_date), "EEEE, MMMM d, yyyy")} at {formatTime12h(booking.scheduled_time)} Central Time</dd></div>
          </dl>
          <p className="text-muted-foreground">{cancellationConsequences(booking, hoursUntil)}</p>
          {(error || problem) && <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 rounded-md text-destructive">{error || problem}</p>}
          <div>
            <label htmlFor="cancellation-reason" className="font-medium block mb-2">Reason for cancellation (optional)</label>
            <Textarea id="cancellation-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} disabled={loading} />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep appointment</AlertDialogCancel>
          <Button variant="destructive" onClick={handleCancel} disabled={loading || Boolean(problem)}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirm cancellation</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
