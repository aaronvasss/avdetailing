import { useState, useEffect, useMemo } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarClock, Clock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import {
  generateTimeSlots,
  DEFAULT_DURATION,
  getWorkingHoursDisplay,
  formatDuration,
} from "@/lib/scheduling";
import {
  formatTime12h,
  toDbTime,
  toDateString,
  parseDateString,
  addMinutesTo12h,
  groupSlotsByPeriod,
} from "@/lib/time-format";
import { useSchedulingSettings } from "@/hooks/useSchedulingSettings";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number | null;
  services: {
    name: string;
    slug?: string;
  } | null;
}

interface RescheduleDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Admin view shows the "notify customer" option */
  showNotifyOption?: boolean;
}

export function RescheduleDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
  showNotifyOption = true,
}: RescheduleDialogProps) {
  const { config: schedulingConfig, isDateBlocked } = useSchedulingSettings();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const serviceDuration = booking?.duration_minutes || DEFAULT_DURATION;

  useEffect(() => {
    if (booking && open) {
      setSelectedDate(undefined);
      setSelectedTime("");
      setAvailableSlots([]);
      setNotifyCustomer(true);
    }
  }, [booking, open]);

  useEffect(() => {
    if (selectedDate && booking) {
      checkAvailability(selectedDate);
    }
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

      setAvailableSlots(
        generateTimeSlots(serviceDuration, existingBookings || [], schedulingConfig, { dateStr })
      );
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailableSlots(
        generateTimeSlots(serviceDuration, [], schedulingConfig, { dateStr })
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const grouped = useMemo(() => groupSlotsByPeriod(availableSlots), [availableSlots]);

  const currentLabel = booking
    ? `${format(parseDateString(booking.scheduled_date), "EEEE, MMM d")} at ${formatTime12h(
        booking.scheduled_time
      )}`
    : "";

  const newLabel =
    selectedDate && selectedTime
      ? `${format(selectedDate, "EEEE, MMM d")} at ${formatTime12h(selectedTime)}`
      : "";

  const handleReschedule = async () => {
    if (!booking || !selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    const dbTime = toDbTime(selectedTime);
    if (!dbTime) {
      toast.error(`Invalid time: ${selectedTime}`);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          scheduled_date: toDateString(selectedDate),
          scheduled_time: dbTime,
          status: "pending",
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Booking rescheduled successfully!", {
        description: `Moved from ${currentLabel} to ${newLabel}`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error rescheduling:", error);
      toast.error("Failed to reschedule", {
        description: error.message || "Please try again or contact us.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const minDate = addDays(startOfToday(), 1); // at least 24 hours notice

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Reschedule Booking
          </DialogTitle>
          <DialogDescription>
            Pick a new date and time for this {booking.services?.name || "appointment"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Current appointment */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Current appointment
            </p>
            <p className="font-semibold">{currentLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDuration(serviceDuration)} · ends around{" "}
              {addMinutesTo12h(booking.scheduled_time, serviceDuration)}
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select New Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBefore(date, minDate) || isDateBlocked(date)}
              className="rounded-md border mx-auto pointer-events-auto"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <div className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time
                <span className="text-xs text-muted-foreground ml-auto">
                  Hours: {getWorkingHoursDisplay(schedulingConfig)}
                </span>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No available times for this date. This service requires{" "}
                    {formatDuration(serviceDuration)}.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map(({ period, slots }) => (
                    <div key={period}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {period}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            className="h-12 text-base font-semibold"
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

              {selectedTime && (
                <p className="text-xs text-muted-foreground mt-3">
                  {formatDuration(serviceDuration)} · ends around{" "}
                  {addMinutesTo12h(selectedTime, serviceDuration)} (+
                  {schedulingConfig.bufferMinutes} min buffer)
                </p>
              )}
            </div>
          )}

          {/* Confirmation summary */}
          {newLabel && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-sm font-medium flex flex-wrap items-center gap-2">
                Move from <span className="font-semibold">{currentLabel}</span>
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">{newLabel}</span>
              </p>
            </div>
          )}

          {showNotifyOption && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="reschedule-notify"
                checked={notifyCustomer}
                onCheckedChange={(v) => setNotifyCustomer(Boolean(v))}
              />
              <label htmlFor="reschedule-notify" className="text-sm">
                Notify the customer about this change
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={loading || !selectedDate || !selectedTime}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
