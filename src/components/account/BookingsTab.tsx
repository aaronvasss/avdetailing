import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Car, Plus } from "lucide-react";
import { format } from "date-fns";

interface BookingsTabProps {
  userId: string;
}

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  total_price: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  service_address: string | null;
  service_city: string | null;
  services: {
    name: string;
  } | null;
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
        vehicle_make,
        vehicle_model,
        vehicle_type,
        service_address,
        service_city,
        services (name)
      `)
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: false });

    if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="animate-pulse">Loading bookings...</div>;
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.scheduled_date) >= new Date() && b.status !== "cancelled"
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.scheduled_date) < new Date() || b.status === "cancelled"
  );

  return (
    <div className="space-y-6">
      {/* Upcoming Bookings */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
          <Button asChild>
            <Link to="/book">
              <Plus className="mr-2 h-4 w-4" />
              Book New
            </Link>
          </Button>
        </div>

        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No upcoming appointments</p>
              <Button asChild className="mt-4">
                <Link to="/book">Book Your First Detail</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.services?.name || "Detailing Service"}
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
                        {booking.vehicle_make} {booking.vehicle_model}
                      </span>
                    )}
                    {booking.service_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {booking.service_address}, {booking.service_city}
                      </span>
                    )}
                  </div>
                  {booking.total_price && (
                    <p className="mt-2 font-semibold">
                      ${booking.total_price.toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
          <div className="grid gap-4">
            {pastBookings.slice(0, 5).map((booking) => (
              <Card key={booking.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.services?.name || "Detailing Service"}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {booking.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
