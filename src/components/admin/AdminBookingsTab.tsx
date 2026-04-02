import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon, Clock, MapPin, Phone, Mail, Bell, 
  Loader2, Search, Filter, Eye, RotateCcw, X, CheckCircle2, DollarSign, Pencil
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { BookingEditDialog } from "./BookingEditDialog";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  total_price: number;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  service_address: string;
  service_city: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  user_id: string | null;
  created_at: string;
  services: { name: string; slug: string } | null;
  profiles: { full_name: string; email: string; phone: string } | null;
}

interface AdminBookingsTabProps {
  isAdmin?: boolean;
}

export function AdminBookingsTab({ isAdmin = true }: AdminBookingsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateRange]);

  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        payment_status,
        total_price,
        vehicle_type,
        vehicle_make,
        vehicle_model,
        service_address,
        service_city,
        guest_name,
        guest_email,
        guest_phone,
        user_id,
        created_at,
        services (name, slug)
      `)
      .order("scheduled_date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (dateRange?.from) {
      query = query.gte("scheduled_date", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      query = query.lte("scheduled_date", format(dateRange.to, "yyyy-MM-dd"));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } else {
      const bookingsWithProfiles = await Promise.all(
        (data || []).map(async (booking) => {
          let profiles = null;
          if (booking.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email, phone")
              .eq("user_id", booking.user_id)
              .maybeSingle();
            profiles = profile;
          }
          return { ...booking, profiles };
        })
      );
      setBookings(bookingsWithProfiles);
    }
    setLoading(false);
  };

  const sendReminder = async (booking: Booking, reminderType: "24h" | "2h") => {
    setSendingReminder(booking.id);
    try {
      const { error } = await supabase.functions.invoke("send-reminder-sms", {
        body: { bookingId: booking.id, reminderType },
      });
      if (error) throw error;
      toast.success(`${reminderType} reminder sent!`);
    } catch (err) {
      console.error("Error sending reminder:", err);
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Booking ${newStatus}`);
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

  const getCustomerEmail = (booking: Booking) => {
    return booking.profiles?.email || booking.guest_email || null;
  };

  // Get unique values for filters
  const serviceTypes = [...new Set(bookings.map(b => b.services?.name).filter(Boolean))];
  const vehicleTypes = [...new Set(bookings.map(b => b.vehicle_type).filter(Boolean))];

  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const customerName = getCustomerName(booking).toLowerCase();
      const phone = getCustomerPhone(booking)?.toLowerCase() || "";
      const email = getCustomerEmail(booking)?.toLowerCase() || "";
      const city = booking.service_city?.toLowerCase() || "";
      if (!(customerName.includes(searchLower) ||
            phone.includes(searchLower) ||
            email.includes(searchLower) ||
            city.includes(searchLower) ||
            booking.id.includes(searchLower))) {
        return false;
      }
    }

    // Service filter
    if (serviceFilter !== "all" && booking.services?.name !== serviceFilter) {
      return false;
    }

    // Vehicle filter
    if (vehicleFilter !== "all" && booking.vehicle_type !== vehicleFilter) {
      return false;
    }

    // Payment filter
    if (paymentFilter !== "all" && booking.payment_status !== paymentFilter) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      pending: { variant: "secondary" },
      confirmed: { variant: "default" },
      completed: { variant: "outline", className: "border-green-500 text-green-600" },
      cancelled: { variant: "destructive" },
    };
    const { variant, className } = config[status] || { variant: "secondary" };
    return <Badge variant={variant} className={cn("capitalize", className)}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      paid: { variant: "outline", className: "border-green-500 text-green-600" },
      unpaid: { variant: "destructive" },
      partial: { variant: "secondary" },
      refunded: { variant: "outline" },
    };
    const { variant, className } = config[status] || { variant: "secondary" };
    return <Badge variant={variant} className={cn("capitalize", className)}>{status}</Badge>;
  };

  // Stats
  const stats = {
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    revenue: bookings.filter(b => b.status !== "cancelled").reduce((sum, b) => sum + (b.total_price || 0), 0),
    unpaid: bookings.filter(b => b.payment_status === "unpaid" && b.status !== "cancelled").length,
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
      {/* Filters Row 1 */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, city, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full lg:w-auto justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Filters Row 2 */}
      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {serviceTypes.map(service => (
              <SelectItem key={service} value={service!}>{service}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicleTypes.map(type => (
              <SelectItem key={type} value={type!}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[140px]">
              <DollarSign className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        )}

        {(statusFilter !== "all" || serviceFilter !== "all" || vehicleFilter !== "all" || paymentFilter !== "all") && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setServiceFilter("all");
              setVehicleFilter("all");
              setPaymentFilter("all");
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        {isAdmin && (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">{stats.unpaid}</div>
                <div className="text-sm text-muted-foreground">Unpaid</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">${stats.revenue.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Bookings ({filteredBookings.length})</span>
            <Button variant="outline" size="sm" onClick={fetchBookings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service + Package</TableHead>
                  {isAdmin && <TableHead>Total</TableHead>}
                  {isAdmin && <TableHead>Payment</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {booking.scheduled_time.slice(0, 5)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{getCustomerName(booking)}</span>
                        {getCustomerPhone(booking) && (
                          <a href={`tel:${getCustomerPhone(booking)}`} className="text-sm text-primary hover:underline">
                            {getCustomerPhone(booking)}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{booking.custom_service_description || booking.services?.name || "Detailing"}</span>
                        <span className="text-sm text-muted-foreground">
                          {booking.vehicle_type} {booking.vehicle_make}
                        </span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <span className="font-medium">${booking.total_price?.toFixed(0)}</span>
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                    )}
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingBooking(booking as any)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, "completed")}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-8 text-muted-foreground">
                      No bookings found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedBooking.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.scheduled_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${selectedBooking.service_address}, ${selectedBooking.service_city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedBooking.service_address}, {selectedBooking.service_city}
                  </a>
                </div>
                {getCustomerPhone(selectedBooking) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${getCustomerPhone(selectedBooking)}`} className="text-primary hover:underline">
                      {getCustomerPhone(selectedBooking)}
                    </a>
                  </div>
                )}
                {getCustomerEmail(selectedBooking) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${getCustomerEmail(selectedBooking)}`} className="text-primary hover:underline">
                      {getCustomerEmail(selectedBooking)}
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{getCustomerName(selectedBooking)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedBooking.services?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span>{selectedBooking.vehicle_type} {selectedBooking.vehicle_make} {selectedBooking.vehicle_model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                {isAdmin && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment</span>
                      {getPaymentBadge(selectedBooking.payment_status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold text-lg">${selectedBooking.total_price?.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Send Reminder */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Send Reminder</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendReminder(selectedBooking, "24h")}
                    disabled={sendingReminder === selectedBooking.id}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    24h Reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendReminder(selectedBooking, "2h")}
                    disabled={sendingReminder === selectedBooking.id}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    2h Reminder
                  </Button>
                </div>
              </div>

              {/* Status Actions */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Update Status</div>
                <div className="flex gap-2 flex-wrap">
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedBooking(null);
                        setEditingBooking(selectedBooking as any);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {selectedBooking.status !== "confirmed" && (
                    <Button size="sm" onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}>
                      Confirm
                    </Button>
                  )}
                  {selectedBooking.status !== "completed" && (
                    <Button size="sm" variant="secondary" onClick={() => updateBookingStatus(selectedBooking.id, "completed")}>
                      Complete
                    </Button>
                  )}
                  {selectedBooking.status !== "cancelled" && (
                    <Button size="sm" variant="destructive" onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Edit Dialog */}
      <BookingEditDialog
        booking={editingBooking as any}
        open={!!editingBooking}
        onOpenChange={(open) => !open && setEditingBooking(null)}
        onSave={fetchBookings}
        isAdmin={isAdmin}
      />
    </div>
  );
}
