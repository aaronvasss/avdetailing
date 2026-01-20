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
import { CalendarClock, Clock, Loader2 } from "lucide-react";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  services: {
    name: string;
  } | null;
}

interface RescheduleDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const timeSlots = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

export function RescheduleDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots);

  useEffect(() => {
    if (booking && open) {
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [booking, open]);

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    }
  }, [selectedDate]);

  const checkAvailability = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("time_slots")
      .select("slot_time, is_available, current_bookings, max_bookings")
      .eq("slot_date", dateStr);

    if (data && data.length > 0) {
      const available = data
        .filter((slot) => slot.is_available && slot.current_bookings < slot.max_bookings)
        .map((slot) => slot.slot_time);
      setAvailableSlots(available.length > 0 ? available : timeSlots);
    } else {
      setAvailableSlots(timeSlots);
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
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const isAvailable = availableSlots.includes(time);
                  return (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      disabled={!isAvailable}
                      onClick={() => setSelectedTime(time)}
                      className={
                        !isAvailable ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
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
