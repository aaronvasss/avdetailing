import { useState, useMemo } from "react";
import { parse as parseDate, format as formatDate } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Booking } from "./AppointmentCard";

interface AppointmentsCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

type ViewMode = "month" | "week";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-emerald-500",
  in_progress: "bg-blue-500",
  completed: "bg-muted-foreground",
  cancelled: "bg-destructive/50",
  no_show: "bg-destructive",
};

export function AppointmentsCalendarView({
  bookings,
  onSelectBooking,
}: AppointmentsCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const dateKey = booking.scheduled_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(booking);
    });
    return map;
  }, [bookings]);

  // Get days for the calendar view
  const calendarDays = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart);
      const end = endOfWeek(monthEnd);
      return eachDayOfInterval({ start, end });
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  const navigatePrev = () => {
    setCurrentDate(
      viewMode === "month"
        ? subMonths(currentDate, 1)
        : subWeeks(currentDate, 1)
    );
  };

  const navigateNext = () => {
    setCurrentDate(
      viewMode === "month"
        ? addMonths(currentDate, 1)
        : addWeeks(currentDate, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getBookingsForDay = (date: Date): Booking[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return bookingsByDate.get(dateKey) || [];
  };

  const renderDayCell = (day: Date) => {
    const dayBookings = getBookingsForDay(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isCurrentDay = isToday(day);

    return (
      <div
        key={day.toISOString()}
        className={cn(
          "min-h-[100px] border-r border-b border-border/30 p-1 transition-colors",
          !isCurrentMonth && "bg-muted/20",
          isCurrentDay && "bg-primary/5"
        )}
      >
        {/* Day number */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm",
              isCurrentDay && "bg-primary text-primary-foreground font-bold",
              !isCurrentMonth && "text-muted-foreground/50"
            )}
          >
            {format(day, "d")}
          </span>
        </div>

        {/* Bookings */}
        <div className="space-y-1">
          {dayBookings.slice(0, viewMode === "week" ? 5 : 2).map((booking) => {
            const customerName = booking.guest_name || "Customer";
            return (
              <button
                key={booking.id}
                onClick={() => onSelectBooking(booking)}
                className={cn(
                  "w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-all",
                  "hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
                  "bg-card border border-border/50"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      statusColors[booking.status]
                    )}
                  />
                    <span className="truncate">
                    {(() => {
                      try {
                        const t = parseDate(booking.scheduled_time, "HH:mm:ss", new Date());
                        return formatDate(t, "h:mm a");
                      } catch {
                        try {
                          const t = parseDate(booking.scheduled_time, "HH:mm", new Date());
                          return formatDate(t, "h:mm a");
                        } catch {
                          return booking.scheduled_time;
                        }
                      }
                    })()} - {customerName}
                  </span>
                </div>
                <div className="truncate text-muted-foreground pl-3.5">
                  {booking.services?.name || "Service"}
                </div>
              </button>
            );
          })}
          {dayBookings.length > (viewMode === "week" ? 5 : 2) && (
            <span className="text-xs text-muted-foreground px-2">
              +{dayBookings.length - (viewMode === "week" ? 5 : 2)} more
            </span>
          )}
        </div>
      </div>
    );
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <CardTitle className="ml-2">
              {viewMode === "month"
                ? format(currentDate, "MMMM yyyy")
                : `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
            </CardTitle>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              <List className="h-4 w-4 mr-2" />
              Week
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Completed</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Calendar Grid */}
        <div className="border-t border-border/30">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border/30">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border/30 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className={cn(
              "grid grid-cols-7",
              viewMode === "week" ? "min-h-[300px]" : ""
            )}
          >
            {calendarDays.map((day) => renderDayCell(day))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
