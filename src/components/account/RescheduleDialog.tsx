import { useState, useEffect, useMemo, useRef } from "react";
import { format, addDays, isBefore } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarClock, Clock, Loader2, AlertCircle, ArrowDown, ChevronLeft } from "lucide-react";
import { generateTimeSlots, DEFAULT_DURATION, getWorkingHoursDisplay, formatDuration } from "@/lib/scheduling";
import { formatTime12h, toDbTime, toDateString, parseDateString, addMinutesTo12h, groupSlotsByPeriod } from "@/lib/time-format";
import { useSchedulingSettings } from "@/hooks/useSchedulingSettings";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number | null;
  services: { name: string; slug?: string } | null;
}

interface RescheduleDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CT = "Central Time";

/** Today's calendar date in America/Chicago, as a local Date at midnight. */
function chicagoToday(): Date {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return parseDateString(s);
}

async function readError(error: any, data: any): Promise<string> {
  if (data?.error) return data.error;
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* ignore */ }
  return "We couldn't reschedule right now. Your original appointment is unchanged.";
}

export function RescheduleDialog({ booking, open, onOpenChange, onSuccess }: RescheduleDialogProps) {
  const { config: schedulingConfig, isDateBlocked } = useSchedulingSettings();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [step, setStep] = useState<"choose" | "review">("choose");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const submitting = useRef(false);

  const serviceDuration = booking?.duration_minutes || DEFAULT_DURATION;

  useEffect(() => {
    if (booking && open) {
      setSelectedDate(undefined);
      setSelectedTime("");
      setAvailableSlots([]);
      setStep("choose");
      setErrorMsg("");
    }
  }, [booking, open]);

  useEffect(() => {
    if (selectedDate && booking) checkAvailability(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, booking, schedulingConfig]);

  const checkAvailability = async (date: Date) => {
    setLoadingSlots(true);
    setSelectedTime("");
    const dateStr = toDateString(date);
    try {
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("id, scheduled_time, duration_minutes")
        .eq("scheduled_date", dateStr)
        .neq("id", booking?.id || "")
        .in("status", ["pending", "confirmed", "in_progress"]);
      setAvailableSlots(generateTimeSlots(serviceDuration, existingBookings || [], schedulingConfig, { dateStr }));
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailableSlots(generateTimeSlots(serviceDuration, [], schedulingConfig, { dateStr }));
    } finally {
      setLoadingSlots(false);
    }
  };

  const grouped = useMemo(() => groupSlotsByPeriod(availableSlots), [availableSlots]);

  const label = (date: Date, time: string) =>
    `${format(date, "EEEE, MMM d, yyyy")} · ${formatTime12h(time)} – ${addMinutesTo12h(time, serviceDuration)} ${CT}`;
  const currentLabel = booking ? label(parseDateString(booking.scheduled_date), booking.scheduled_time) : "";
  const newLabel = selectedDate && selectedTime ? label(selectedDate, selectedTime) : "";

  const handleReschedule = async () => {
    if (submitting.current) return;
    if (!booking || !selectedDate || !selectedTime) return;
    const dbTime = toDbTime(selectedTime);
    if (!dbTime) { setErrorMsg("Please choose a valid time."); return; }

    submitting.current = true;
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("reschedule-booking", {
        body: { bookingId: booking.id, newDate: toDateString(selectedDate), newTime: dbTime },
      });
      if (error || !data?.ok) {
        const msg = await readError(error, data);
        setErrorMsg(msg);
        toast.error("Couldn't reschedule", { description: msg });
        // Refresh times so a just-taken slot disappears.
        if (selectedDate) checkAvailability(selectedDate);
        setStep("choose");
        return;
      }
      toast.success("Appointment rescheduled", { description: `New time: ${newLabel}` });
      onSuccess();
      onOpenChange(false);
    } catch {
      const msg = "We couldn't reschedule right now. Your original appointment is unchanged.";
      setErrorMsg(msg);
      toast.error("Couldn't reschedule", { description: msg });
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (!booking) return null;

  const minDate = addDays(chicagoToday(), 1); // at least one day notice

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            {step === "choose" ? "Reschedule Appointment" : "Confirm New Time"}
          </DialogTitle>
          <DialogDescription>
            {step === "choose"
              ? `Step 1 of 2 · Pick a new date and time for your ${booking.services?.name || "appointment"}. All times are ${CT}.`
              : "Step 2 of 2 · Review the change before confirming."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === "choose" ? (
          <div className="space-y-6 py-2">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current appointment</p>
              <p className="font-semibold">{currentLabel}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select new date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setErrorMsg(""); }}
                disabled={(date) => isBefore(date, minDate) || isDateBlocked(date)}
                className="rounded-md border mx-auto pointer-events-auto"
              />
            </div>

            {selectedDate && (
              <div>
                <div className="text-sm font-medium mb-3 flex flex-wrap items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Select time ({CT})
                  <span className="text-xs text-muted-foreground ml-auto">Hours: {getWorkingHoursDisplay(schedulingConfig)}</span>
                </div>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No available times for this date. This service requires {formatDuration(serviceDuration)}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grouped.map(({ period, slots }) => (
                      <div key={period}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{period}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              className="h-12 text-base font-semibold"
                              aria-pressed={selectedTime === time}
                              onClick={() => setSelectedTime(time)}
                            >
                              {formatTime12h(time)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">From</p>
              <p className="font-semibold line-through decoration-muted-foreground/60">{currentLabel}</p>
            </div>
            <ArrowDown className="h-4 w-4 text-primary mx-auto" aria-hidden />
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">To</p>
              <p className="font-semibold text-primary">{newLabel}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll double-check this time is still open before saving. Your rescheduled appointment will show as pending until we confirm it.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "choose" ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Keep current time</Button>
              <Button onClick={() => { setErrorMsg(""); setStep("review"); }} disabled={!selectedDate || !selectedTime || loadingSlots}>
                Review change
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("choose")} disabled={loading}>
                <ChevronLeft className="h-4 w-4 mr-1" />Back
              </Button>
              <Button onClick={handleReschedule} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? "Saving…" : "Confirm reschedule"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
