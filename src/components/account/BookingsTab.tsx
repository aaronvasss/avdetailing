import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Car, Plus, ChevronRight, CalendarClock, XCircle, Eye } from "lucide-react";
import { format, isAfter, isBefore, startOfToday } from "date-fns";
import { BookingDetailsDialog } from "./BookingDetailsDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { CancelBookingDialog } from "./CancelBookingDialog";

interface BookingsTabProps {
  userId: string;
}

interface BookingAddOn {
  id: string;
  name: string;
  price: number;
}

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string | null;
  total_price: number | null;
  subtotal: number | null;
  add_ons_total: number | null;
  deposit_amount: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  vehicle_year: number | null;
  vehicle_size: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  customer_notes: string | null;
  duration_minutes: number | null;
  created_at: string;
  services: {
    name: string;
    description: string | null;
  } | null;
  booking_add_ons: BookingAddOn[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
  no_show: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function BookingsTab({ userId }: BookingsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
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
        vehicle_make,
        vehicle_model,
        vehicle_type,
        vehicle_year,
        vehicle_size,
        service_address,
        service_city,
        service_state,
        service_zip,
        customer_notes,
        duration_minutes,
        created_at,
        services (name, description),
        booking_add_ons (id, name, price)
      `)
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: false });

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
            <CardHeader className="pb-2">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const today = startOfToday();
  const upcomingBookings = bookings.filter(
    (b) => isAfter(new Date(b.scheduled_date), today) || 
           (format(new Date(b.scheduled_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd") && 
            b.status !== "cancelled" && b.status !== "completed")
  );
  const pastBookings = bookings.filter(
    (b) => (isBefore(new Date(b.scheduled_date), today) && 
            format(new Date(b.scheduled_date), "yyyy-MM-dd") !== format(today, "yyyy-MM-dd")) || 
           b.status === "cancelled" || b.status === "completed"
  );

  const renderBookingCard = (booking: Booking, isUpcoming: boolean) => {
    const canModify = isUpcoming && booking.status !== "cancelled" && booking.status !== "in_progress";

    return (
      <Card
        key={booking.id}
        className={`transition-all hover:shadow-md cursor-pointer ${
          !isUpcoming ? "opacity-75" : ""
        }`}
        onClick={() => handleViewDetails(booking)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {booking.services?.name || "Detailing Service"}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {booking.scheduled_time}
                </span>
              </CardDescription>
            </div>
            <Badge className={statusColors[booking.status]}>
              {booking.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {booking.vehicle_make && (
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}
              </span>
            )}
            {booking.service_address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {booking.service_city}, {booking.service_state}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center mt-3">
            {booking.total_price && (
              <p className="font-semibold text-primary">
                ${(booking.total_price * 1.035).toFixed(2)}
              </p>
            )}
            {canModify && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReschedule(booking)}
                >
                  <CalendarClock className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleCancel(booking)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
            {!canModify && isUpcoming && (
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary">{upcomingBookings.length}</p>
          <p className="text-sm text-muted-foreground">Upcoming</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{bookings.filter(b => b.status === "completed").length}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-yellow-500">
            {bookings.filter(b => b.status === "pending").length}
          </p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-muted-foreground">
            {bookings.length}
          </p>
          <p className="text-sm text-muted-foreground">Total Bookings</p>
        </Card>
      </div>

      {/* Tabs for Upcoming/Past */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              History ({pastBookings.length})
            </TabsTrigger>
          </TabsList>
          <Button asChild>
            <Link to="/book">
              <Plus className="mr-2 h-4 w-4" />
              Book New
            </Link>
          </Button>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Appointments</h3>
                <p className="text-muted-foreground mb-4">
                  Ready to give your vehicle the care it deserves?
                </p>
                <Button asChild>
                  <Link to="/book">Book Your Detail</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map((booking) => renderBookingCard(booking, true))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No past bookings yet</p>
              </CardContent>
            </Card>
          ) : (
            pastBookings.map((booking) => renderBookingCard(booking, false))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BookingDetailsDialog
        booking={selectedBooking}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
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
