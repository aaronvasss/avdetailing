import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Phone, Mail, Bell, Loader2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
  services: { name: string } | null;
  profiles: { full_name: string; email: string; phone: string } | null;
}

export function AdminBookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

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
        services (name)
      `)
      .order("scheduled_date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } else {
      // Fetch profiles separately for bookings with user_id
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
      const { data, error } = await supabase.functions.invoke("send-reminder-sms", {
        body: { bookingId: booking.id, reminderType },
      });

      if (error) throw error;
      toast.success(`${reminderType} reminder sent successfully!`);
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
    }
  };

  const getCustomerName = (booking: Booking) => {
    if (booking.profiles?.full_name) return booking.profiles.full_name;
    if (booking.guest_name) return booking.guest_name;
    return "Unknown";
  };

  const getCustomerPhone = (booking: Booking) => {
    if (booking.profiles?.phone) return booking.profiles.phone;
    if (booking.guest_phone) return booking.guest_phone;
    return null;
  };

  const getCustomerEmail = (booking: Booking) => {
    if (booking.profiles?.email) return booking.profiles.email;
    if (booking.guest_email) return booking.guest_email;
    return null;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const customerName = getCustomerName(booking).toLowerCase();
    const phone = getCustomerPhone(booking)?.toLowerCase() || "";
    const email = getCustomerEmail(booking)?.toLowerCase() || "";
    const city = booking.service_city?.toLowerCase() || "";
    return (
      customerName.includes(searchLower) ||
      phone.includes(searchLower) ||
      email.includes(searchLower) ||
      city.includes(searchLower) ||
      booking.id.includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{bookings.filter(b => b.status === "pending").length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{bookings.filter(b => b.status === "confirmed").length}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{bookings.filter(b => b.status === "completed").length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              ${bookings.filter(b => b.status !== "cancelled").reduce((sum, b) => sum + (b.total_price || 0), 0).toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
                        <span className="text-sm text-muted-foreground">{booking.scheduled_time}</span>
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
                        <span>{booking.services?.name || "Detailing"}</span>
                        <span className="text-sm text-muted-foreground">{booking.vehicle_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{booking.service_city}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${booking.total_price?.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(selectedBooking.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedBooking.scheduled_time}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedBooking.service_address}, {selectedBooking.service_city}</span>
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
                                    <span>Service</span>
                                    <span className="font-medium">{selectedBooking.services?.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Vehicle</span>
                                    <span>{selectedBooking.vehicle_type} {selectedBooking.vehicle_make} {selectedBooking.vehicle_model}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total</span>
                                    <span className="font-bold">${selectedBooking.total_price?.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="border-t pt-4 flex flex-col gap-2">
                                  <div className="text-sm font-medium">Send Reminder</div>
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
                                <div className="border-t pt-4 flex flex-col gap-2">
                                  <div className="text-sm font-medium">Update Status</div>
                                  <div className="flex gap-2 flex-wrap">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredBookings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
