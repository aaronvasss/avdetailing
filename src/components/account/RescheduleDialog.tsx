import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarClock, Clock, Loader2, AlertCircle } from "lucide-react";
import { 
  generateTimeSlots, 
  DEFAULT_DURATION,
  getWorkingHoursDisplay,
  formatDuration
} from "@/lib/scheduling";

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
}

// Time slots are now generated dynamically based on service duration and availability

export function RescheduleDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Get service duration for this booking
  const serviceDuration = booking?.duration_minutes || DEFAULT_DURATION;

  useEffect(() => {
    if (booking && open) {
      setSelectedDate(undefined);
      setSelectedTime("");
      setAvailableSlots([]);
    }
  }, [booking, open]);

  useEffect(() => {
    if (selectedDate && booking) {
      checkAvailability(selectedDate);
    }
  }, [selectedDate, booking]);

  const checkAvailability = async (date: Date) => {
    setLoadingSlots(true);
    const dateStr = format(date, "yyyy-MM-dd");
    
    try {
      // Fetch existing bookings for this date (excluding current booking)
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("id, scheduled_time, duration_minutes")
        .eq("scheduled_date", dateStr)
        .neq("id", booking?.id || "")
        .in("status", ["pending", "confirmed", "in_progress"]);

      // Generate available time slots based on service duration and existing bookings
      const slots = generateTimeSlots(
        serviceDuration,
        existingBookings || []
      );
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error checking availability:", error);
      // Generate slots without conflict checking as fallback
      setAvailableSlots(generateTimeSlots(serviceDuration, []));
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!booking || !selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          scheduled_date: format(selectedDate, "yyyy-MM-dd"),
          scheduled_time: selectedTime,
          status: "pending",
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Booking rescheduled successfully!", {
        description: `New date: ${format(selectedDate, "MMM d, yyyy")} at ${selectedTime}`,
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

  const today = startOfToday();
  const minDate = addDays(today, 1); // At least 24 hours notice

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Reschedule Booking
          </DialogTitle>
          <DialogDescription>
            Select a new date and time for your {booking.services?.name || "appointment"}.
            Current: {format(new Date(booking.scheduled_date), "MMM d, yyyy")} at{" "}
            {booking.scheduled_time}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select New Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBefore(date, minDate)}
              className="rounded-md border mx-auto"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time
                <span className="text-xs text-muted-foreground ml-auto">
                  Hours: {getWorkingHoursDisplay()}
                </span>
              </label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-4">
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
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {availableSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Duration: {formatDuration(serviceDuration)} + 30min buffer
              </p>
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
