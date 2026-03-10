import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, MapPin, Phone, DollarSign, 
  Users, AlertCircle, CheckCircle2, XCircle,
  Loader2, MessageSquare, Eye, ChevronRight,
  CreditCard, UserCheck
} from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { toast } from "sonner";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  total_price: number;
  vehicle_type: string;
  vehicle_size: string | null;
  service_address: string;
  service_city: string;
  guest_name: string | null;
  guest_phone: string | null;
  user_id: string | null;
  services: { name: string } | null;
  profiles: { full_name: string; phone: string } | null;
}

interface AdminOverviewTabProps {
  isAdmin: boolean;
  onViewBooking: (booking: Booking) => void;
  onTextCustomer: (phone: string) => void;
}

export function AdminOverviewTab({ isAdmin, onViewBooking, onTextCustomer }: AdminOverviewTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMemberships, setActiveMemberships] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
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
        vehicle_size,
        service_address,
        service_city,
        guest_name,
        guest_phone,
        user_id,
        services (name)
      `)
      .gte("scheduled_date", format(addDays(new Date(), -30), "yyyy-MM-dd"))
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setLoading(false);
      return;
    }

    // Fetch profiles for bookings with user_id
    const bookingsWithProfiles = await Promise.all(
      (data || []).map(async (booking) => {
        let profiles = null;
        if (booking.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", booking.user_id)
            .maybeSingle();
          profiles = profile;
        }
        return { ...booking, profiles };
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
      toast.success(`Booking marked as ${newStatus}`);
      fetchBookings();
    }
  };

  const getCustomerName = (booking: Booking) => {
    return booking.profiles?.full_name || booking.guest_name || "Unknown";
  };

  const getCustomerPhone = (booking: Booking) => {
    return booking.profiles?.phone || booking.guest_phone || null;
  };

  // Calculate KPIs
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  const todaysBookings = bookings.filter(b => isToday(new Date(b.scheduled_date)));
  const thisWeekBookings = bookings.filter(b => {
    const date = new Date(b.scheduled_date);
    return date >= weekStart && date <= weekEnd;
  });
  const upcomingBookings = bookings.filter(b => {
    const date = new Date(b.scheduled_date);
    return date >= today && date <= addDays(today, 7);
  });
  const pendingBookings = bookings.filter(b => b.status === "pending");
  const unpaidBookings = bookings.filter(b => 
    b.payment_status === "unpaid" && b.status !== "cancelled"
  );
  const cancelledBookings = bookings.filter(b => 
    b.status === "cancelled" && new Date(b.scheduled_date) >= addDays(today, -7)
  );

  const weekRevenue = thisWeekBookings
    .filter(b => b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "secondary", icon: <AlertCircle className="h-3 w-3" /> },
      confirmed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      completed: { variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelled: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    };
    const { variant, icon } = config[status] || { variant: "secondary", icon: null };
    return (
      <Badge variant={variant} className="gap-1 capitalize">
        {icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">{todaysBookings.length}</div>
                <div className="text-sm text-muted-foreground">Today's Bookings</div>
              </div>
              <Calendar className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">${weekRevenue.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">This Week Revenue</div>
                </div>
                <DollarSign className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-600">{pendingBookings.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{upcomingBookings.length}</div>
                <div className="text-sm text-muted-foreground">Next 7 Days</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-600">{unpaidBookings.length}</div>
                  <div className="text-sm text-muted-foreground">Unpaid</div>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-600">{cancelledBookings.length}</div>
                <div className="text-sm text-muted-foreground">Cancellations</div>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <Badge variant="outline" className="font-normal">
              {format(today, "EEEE, MMMM d")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {todaysBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No bookings scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold text-primary">
                        {booking.scheduled_time.slice(0, 5)}
                      </div>
                    </div>
                    <div className="border-l pl-4">
                      <div className="font-medium">{getCustomerName(booking)}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.services?.name || "Detailing"} • {booking.vehicle_type}
                      </div>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.service_address}, ${booking.service_city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <MapPin className="h-3 w-3" />
                        {booking.service_address}, {booking.service_city}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(booking.status)}
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onViewBooking(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {getCustomerPhone(booking) && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onTextCustomer(getCustomerPhone(booking)!)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}

                      {booking.status === "confirmed" && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => updateStatus(booking.id, "completed")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}

                      {booking.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => updateStatus(booking.id, "confirmed")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming This Week */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming This Week
            </CardTitle>
            <Badge variant="secondary">{upcomingBookings.length} bookings</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming bookings this week</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.slice(0, 10).map((booking) => (
                <div 
                  key={booking.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onViewBooking(booking)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-medium">
                        {format(new Date(booking.scheduled_date), "EEE, MMM d")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.scheduled_time.slice(0, 5)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{getCustomerName(booking)}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.services?.name || "Detailing"} • {booking.service_city}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <span className="text-sm font-medium">${booking.total_price?.toFixed(0)}</span>
                    )}
                    {getStatusBadge(booking.status)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
