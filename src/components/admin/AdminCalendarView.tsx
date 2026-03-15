import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendInProgressSms } from "@/lib/in-progress-sms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Loader2, Car, Droplets, Ship, Truck, Plane
} from "lucide-react";
import { 
  format, startOfWeek, endOfWeek, startOfDay, addDays, startOfMonth, endOfMonth,
  isSameDay, isSameMonth, addWeeks, subWeeks, addMonths, subMonths, isToday 
} from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { WORKING_HOURS, BUFFER_MINUTES, formatDuration, PACKAGE_DURATIONS } from "@/lib/scheduling";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  total_price: number;
  vehicle_type: string;
  service_address: string;
  service_city: string;
  guest_name: string | null;
  guest_phone: string | null;
  user_id: string | null;
  assigned_worker_id: string | null;
  services: { name: string; slug: string } | null;
  profiles: { full_name: string; phone: string } | null;
  worker_name?: string | null;
}

interface AdminCalendarViewProps {
  isAdmin: boolean;
}

type ViewMode = "month" | "week" | "day";

const SERVICE_FILTERS = [
  { id: "car-detailing", label: "Car", icon: Car, color: "bg-blue-500" },
  { id: "ceramic-coating", label: "Ceramic", icon: Droplets, color: "bg-purple-500" },
  { id: "boat-detailing", label: "Boat", icon: Ship, color: "bg-cyan-500" },
  { id: "rv-detailing", label: "RV", icon: Truck, color: "bg-amber-500" },
  { id: "aircraft-detailing", label: "Aircraft", icon: Plane, color: "bg-rose-500" },
];

const getServiceColor = (slug: string | undefined) => {
  const service = SERVICE_FILTERS.find(s => s.id === slug);
  return service?.color || "bg-muted";
};

const getServiceColorClass = (slug: string | undefined) => {
  switch (slug) {
    case "car-detailing": return "border-l-blue-500 bg-blue-500/10";
    case "ceramic-coating": return "border-l-purple-500 bg-purple-500/10";
    case "boat-detailing": return "border-l-cyan-500 bg-cyan-500/10";
    case "rv-detailing": return "border-l-amber-500 bg-amber-500/10";
    case "aircraft-detailing": return "border-l-rose-500 bg-rose-500/10";
    default: return "border-l-muted bg-muted/50";
  }
};

export function AdminCalendarView({ isAdmin }: AdminCalendarViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<string[]>(SERVICE_FILTERS.map(s => s.id));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  useEffect(() => {
    fetchBookings();
  }, [currentDate, viewMode]);

  const fetchBookings = async () => {
    setLoading(true);
    let rangeStart: string;
    let rangeEnd: string;
    if (viewMode === "month") {
      const ms = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const me = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      rangeStart = format(ms, "yyyy-MM-dd");
      rangeEnd = format(me, "yyyy-MM-dd");
    } else {
      rangeStart = format(subWeeks(weekStart, 1), "yyyy-MM-dd");
      rangeEnd = format(addWeeks(weekEnd, 1), "yyyy-MM-dd");
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        payment_status,
        total_price,
        vehicle_type,
        service_address,
        service_city,
        guest_name,
        guest_phone,
        user_id,
        assigned_worker_id,
        services (name, slug)
      `)
      .gte("scheduled_date", rangeStart)
      .lte("scheduled_date", rangeEnd)
      .neq("status", "cancelled")
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load calendar");
      setLoading(false);
      return;
    }

    // Collect worker IDs for name lookup
    const workerIds = new Set<string>();
    (data || []).forEach((b: any) => {
      if (b.assigned_worker_id) workerIds.add(b.assigned_worker_id);
    });

    const workerNameMap: Record<string, string> = {};
    if (workerIds.size > 0) {
      const { data: workerProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(workerIds));
      (workerProfiles || []).forEach((p) => {
        workerNameMap[p.user_id] = p.full_name || "Unknown";
      });
    }

    const bookingsWithProfiles = await Promise.all(
      (data || []).map(async (booking: any) => {
        let profiles = null;
        if (booking.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", booking.user_id)
            .maybeSingle();
          profiles = profile;
        }
        return {
          ...booking,
          profiles,
          worker_name: booking.assigned_worker_id ? workerNameMap[booking.assigned_worker_id] || null : null,
        };
      })
    );

    setBookings(bookingsWithProfiles);
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Booking ${newStatus}`);
      if (newStatus === "in_progress") {
        sendInProgressSms(bookingId);
      }
      fetchBookings();
      setSelectedBooking(null);
    }
  };

  const getCustomerName = (booking: Booking) => {
    return booking.profiles?.full_name || booking.guest_name || "Unknown";
  };

  const getCustomerPhone = (booking: Booking) => {
    return booking.profiles?.phone || booking.guest_phone || null;
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const serviceSlug = booking.services?.slug;
      return activeFilters.includes(serviceSlug || "");
    });
  }, [bookings, activeFilters]);

  const getBookingsForDay = (date: Date) => {
    return filteredBookings.filter(booking => 
      isSameDay(new Date(booking.scheduled_date), date)
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const timeSlots = useMemo(() => {
    const slots = [];
    // Use working hours from scheduling config (6:30 AM to 7:30 PM)
    const startHour = WORKING_HOURS.START_HOUR;
    const endHour = WORKING_HOURS.END_HOUR;
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  const getBookingPosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startHour = WORKING_HOURS.START_HOUR;
    const startMinute = WORKING_HOURS.START_MINUTE;
    return ((hours - startHour) * 60 + minutes - startMinute) / 60;
  };

  const navigatePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month view helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthCalendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const monthWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    let day = monthCalendarStart;
    while (day <= monthCalendarEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [currentDate]);

  const getHeaderTitle = () => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    return format(currentDate, "EEEE, MMMM d, yyyy");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
          <h2 className="text-lg font-semibold ml-2">
            {getHeaderTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === "month" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
          <Button 
            variant={viewMode === "week" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button 
            variant={viewMode === "day" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
        </div>
      </div>

      {/* Service Filters */}
      <div className="flex flex-wrap gap-2">
        {SERVICE_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilters.includes(filter.id);
          return (
            <Toggle
              key={filter.id}
              pressed={isActive}
              onPressedChange={() => toggleFilter(filter.id)}
              className={cn(
                "gap-2 data-[state=on]:text-foreground",
                isActive && filter.color.replace("bg-", "data-[state=on]:bg-").replace("500", "500/20")
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", filter.color)} />
              <Icon className="h-4 w-4" />
              {filter.label}
            </Toggle>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {viewMode === "month" ? (
            /* Month View */
            <div>
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              {/* Weeks */}
              {monthWeeks.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-cols-7 border-b last:border-b-0">
                  {week.map((day, dIdx) => {
                    const dayBookings = getBookingsForDay(day);
                    const inMonth = isSameMonth(day, currentDate);
                    return (
                      <div
                        key={dIdx}
                        className={cn(
                          "min-h-[100px] p-1 border-r last:border-r-0",
                          !inMonth && "opacity-40 bg-muted/20",
                          isToday(day) && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1 text-center",
                          isToday(day) && "text-primary"
                        )}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayBookings.slice(0, 3).map(booking => (
                            <button
                              key={booking.id}
                              onClick={() => setSelectedBooking(booking)}
                              className={cn(
                                "w-full text-left px-1 py-0.5 rounded text-[10px] leading-tight border-l-2 truncate hover:opacity-80",
                                getServiceColorClass(booking.services?.slug)
                              )}
                            >
                              {booking.scheduled_time.slice(0, 5)} {getCustomerName(booking)}
                            </button>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              +{dayBookings.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : viewMode === "week" ? (
            <div className="overflow-x-auto">
              {/* Week Header */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">
                  Time
                </div>
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-2 text-center border-r last:border-r-0",
                      isToday(day) && "bg-primary/10"
                    )}
                  >
                    <div className="text-sm font-medium">{format(day, "EEE")}</div>
                    <div className={cn(
                      "text-lg font-bold",
                      isToday(day) && "text-primary"
                    )}>
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative">
                {timeSlots.map((time, idx) => (
                  <div key={time} className="grid grid-cols-8 border-b last:border-b-0 h-16">
                    <div className="p-2 text-xs text-muted-foreground border-r flex items-start justify-center">
                      {time}
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const dayBookings = getBookingsForDay(day).filter(b => {
                        const bookingHour = parseInt(b.scheduled_time.split(':')[0]);
                        const slotHour = parseInt(time.split(':')[0]);
                        return bookingHour === slotHour;
                      });

                      return (
                        <div 
                          key={dayIdx} 
                          className={cn(
                            "p-1 border-r last:border-r-0 relative",
                            isToday(day) && "bg-primary/5"
                          )}
                        >
                          {dayBookings.map((booking) => {
                            // Calculate duration for buffer visualization
                            const duration = PACKAGE_DURATIONS[booking.services?.slug || ""] || 120;
                            const bufferHeight = 4; // Fixed small indicator for buffer
                            
                            return (
                              <div key={booking.id} className="mb-1">
                                <button
                                  onClick={() => setSelectedBooking(booking)}
                                  className={cn(
                                    "w-full text-left p-1.5 rounded text-xs border-l-2 hover:opacity-80 transition-opacity truncate",
                                    getServiceColorClass(booking.services?.slug)
                                  )}
                                >
                                  <div className="font-medium truncate">{getCustomerName(booking)}</div>
                                  <div className="text-muted-foreground truncate">
                                    {booking.scheduled_time.slice(0, 5)} • {booking.services?.name}
                                  </div>
                                </button>
                                {/* Buffer indicator */}
                                <div 
                                  className="w-full h-1 bg-amber-400/50 rounded-sm mt-0.5" 
                                  title={`30 min buffer after appointment`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Day View */
            <div className="divide-y">
              {timeSlots.map((time) => {
                const hourBookings = getBookingsForDay(currentDate).filter(b => {
                  const bookingHour = parseInt(b.scheduled_time.split(':')[0]);
                  const slotHour = parseInt(time.split(':')[0]);
                  return bookingHour === slotHour;
                });

                return (
                  <div key={time} className="flex min-h-[80px]">
                    <div className="w-20 p-3 text-sm text-muted-foreground border-r flex-shrink-0">
                      {time}
                    </div>
                    <div className="flex-1 p-2 space-y-2">
                      {hourBookings.map((booking) => {
                        const duration = PACKAGE_DURATIONS[booking.services?.slug || ""] || 120;
                        return (
                          <div key={booking.id}>
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border-l-4 hover:opacity-80 transition-opacity",
                                getServiceColorClass(booking.services?.slug)
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{getCustomerName(booking)}</div>
                                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {booking.scheduled_time.slice(0, 5)} • {booking.services?.name} • {booking.vehicle_type}
                                <span className="ml-2 text-xs">({formatDuration(duration)})</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {booking.service_address}, {booking.service_city}
                              </div>
                              <div className="text-xs mt-0.5">
                                {booking.worker_name ? (
                                  <span className="text-foreground font-medium">👷 {booking.worker_name}</span>
                                ) : (
                                  <span className="text-destructive font-medium">Unassigned</span>
                                )}
                              </div>
                              {isAdmin && (
                                <div className="text-sm font-medium text-primary mt-1">
                                  ${booking.total_price?.toFixed(0)}
                                </div>
                              )}
                            </button>
                            {/* Buffer time indicator */}
                            <div className="flex items-center gap-1 mt-1 ml-4">
                              <div className="h-1.5 w-16 bg-amber-400/60 rounded-full" />
                              <span className="text-xs text-muted-foreground">+30m buffer</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className={cn(
                "p-3 rounded-lg border-l-4",
                getServiceColorClass(selectedBooking.services?.slug)
              )}>
                <div className="font-medium">{selectedBooking.services?.name}</div>
                <div className="text-sm text-muted-foreground">{selectedBooking.vehicle_type}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{getCustomerName(selectedBooking)}</span>
                </div>
                {getCustomerPhone(selectedBooking) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <a href={`tel:${getCustomerPhone(selectedBooking)}`} className="text-primary hover:underline">
                      {getCustomerPhone(selectedBooking)}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(selectedBooking.scheduled_date), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span>{selectedBooking.scheduled_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${selectedBooking.service_address}, ${selectedBooking.service_city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-right max-w-[60%]"
                  >
                    {selectedBooking.service_address}, {selectedBooking.service_city}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={selectedBooking.status === "confirmed" ? "default" : "secondary"}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Technician</span>
                  {selectedBooking.worker_name ? (
                    <span className="font-medium">{selectedBooking.worker_name}</span>
                  ) : (
                    <span className="text-destructive font-medium">Unassigned</span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">${selectedBooking.total_price?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {selectedBooking.status === "pending" && (
                  <Button 
                    className="flex-1" 
                    onClick={() => updateStatus(selectedBooking.id, "confirmed")}
                  >
                    Confirm
                  </Button>
                )}
                {selectedBooking.status === "confirmed" && (
                  <Button 
                    className="flex-1" 
                    onClick={() => updateStatus(selectedBooking.id, "completed")}
                  >
                    Complete
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={() => updateStatus(selectedBooking.id, "cancelled")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
