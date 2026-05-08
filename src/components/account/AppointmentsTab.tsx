import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Clock,
  Plus,
  CalendarDays,
} from "lucide-react";
import { format, isAfter, startOfToday, parse as parseDate } from "date-fns";

function formatTime12h(time: string): string {
  if (!time) return "";
  for (const fmt of ["HH:mm:ss", "HH:mm"]) {
    try {
      const d = parseDate(time, fmt, new Date());
      if (!isNaN(d.getTime())) return format(d, "h:mm a");
    } catch {}
  }
  return time;
}
import { AppointmentCard, Booking } from "./AppointmentCard";
import { AppointmentsCalendarView } from "./AppointmentsCalendarView";
import { BookingDetailsDialog } from "./BookingDetailsDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { CancelBookingDialog } from "./CancelBookingDialog";

interface AppointmentsTabProps {
  userId: string;
  isAdmin?: boolean;
  onAdminBook?: () => void;
  defaultView?: "list" | "calendar";
}

export function AppointmentsTab({ userId, isAdmin, onAdminBook, defaultView = "list" }: AppointmentsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "calendar">(defaultView);

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    let query = supabase
      .from("bookings")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        payment_status,
        total_price,
        subtotal,
        add_ons_total,
        deposit_amount,
        tip_amount,
        vehicle_make,
        vehicle_model,
        vehicle_type,
        vehicle_year,
        vehicle_size,
        service_id,
        service_address,
        service_city,
        service_state,
        service_zip,
        customer_notes,
        duration_minutes,
        created_at,
        guest_name,
        guest_email,
        guest_phone,
        payment_method,
        user_id,
        services (name, description),
        booking_add_ons (id, name, price)
      `)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    // Admins see ALL bookings, regular users see only their own
    if (!isAdmin) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(false);
    setRescheduleOpen(true);
  };

  const handleCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(false);
    setCancelOpen(true);
  };

  const handleSuccess = () => {
    fetchBookings();
    setSelectedBooking(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const today = startOfToday();
  const upcomingBookings = bookings.filter(
    (b) =>
      (isAfter(new Date(b.scheduled_date), today) ||
        format(new Date(b.scheduled_date), "yyyy-MM-dd") ===
          format(today, "yyyy-MM-dd")) &&
      b.status !== "cancelled" &&
      b.status !== "completed"
  );

  const pastBookings = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      b.status === "completed" ||
      new Date(b.scheduled_date) < today
  );

  // Get next appointment
  const nextAppointment = upcomingBookings[0];

  return (
    <div className="space-y-6">
      {/* Next Appointment Highlight */}
      {nextAppointment && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary mb-1">
                  Next Appointment
                </p>
                <h3 className="text-xl font-bold">
                  {nextAppointment.services?.name || "Detailing Service"}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(
                      new Date(nextAppointment.scheduled_date),
                      "EEEE, MMMM d"
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime12h(nextAppointment.scheduled_time)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => handleViewDetails(nextAppointment)}>
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveView("list")}
          >
            <Clock className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={activeView === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveView("calendar")}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
        {!isAdmin && (
          <Button asChild>
            <Link to="/book">
              <Plus className="h-4 w-4 mr-2" />
              Book New Appointment
            </Link>
          </Button>
        )}
      </div>

      {/* Calendar View */}
      {activeView === "calendar" && (
        <AppointmentsCalendarView
          bookings={bookings}
          onSelectBooking={handleViewDetails}
        />
      )}

      {/* List View */}
      {activeView === "list" && (
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              History ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Upcoming Appointments
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Ready to give your vehicle the premium care it deserves?
                  </p>
                  {isAdmin && onAdminBook ? (
                    <Button onClick={onAdminBook}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Booking
                    </Button>
                  ) : !isAdmin ? (
                    <Button asChild>
                      <Link to="/book">Book Your Detail</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <AppointmentCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={handleViewDetails}
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No past appointments yet</p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map((booking) => (
                <AppointmentCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={handleViewDetails}
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
                  compact
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <BookingDetailsDialog
        booking={selectedBooking}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        isAdmin={isAdmin}
        onStatusChange={handleSuccess}
      />

      <RescheduleDialog
        booking={selectedBooking}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={handleSuccess}
      />

      <CancelBookingDialog
        booking={selectedBooking}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
