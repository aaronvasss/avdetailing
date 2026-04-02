import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMinutes, parse, parseISO } from "date-fns";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Car,
  DollarSign,
  CalendarPlus,
  Download,
  Loader2,
  ExternalLink,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BookingEditDialog } from "./BookingEditDialog";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total_price: number | null;
  subtotal: number | null;
  add_ons_total: number | null;
  deposit_amount: number | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_size: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  duration_minutes: number | null;
  customer_notes: string | null;
  user_id: string | null;
  service_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  assigned_worker_id: string | null;
  services: { name: string; slug: string } | null;
  profile_name?: string | null;
  profile_phone?: string | null;
  profile_email?: string | null;
}

// Service duration mappings (in minutes)
const SERVICE_DURATIONS: { [key: string]: number } = {
  "exterior-only": 45,
  "basic": 105,      // 1h45m
  "silver": 140,     // 2h20m
  "gold": 180,       // 3h
  "ceramic-coating": 480, // 8h
};

const BUFFER_MINUTES = 30;

interface AdminAppointmentsTabProps {
  isAdmin: boolean;
}

export function AdminAppointmentsTab({ isAdmin }: AdminAppointmentsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order");
    
    if (data) setServices(data);
  };

  const fetchBookings = async () => {
    setLoading(true);
    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select(`
        *,
        services:service_id(name, slug)
      `)
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      setLoading(false);
      return;
    }

    // Fetch profiles for bookings that have user_id
    const userIds = [...new Set((bookingsData || []).map(b => b.user_id).filter(Boolean))];
    let profilesMap: { [key: string]: { full_name: string | null; phone: string | null; email: string | null } } = {};
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", userIds);
      
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap[p.user_id] = { full_name: p.full_name, phone: p.phone, email: p.email };
        });
      }
    }

    // Merge profile data with bookings
    const bookingsWithProfiles = (bookingsData || []).map(booking => ({
      ...booking,
      profile_name: booking.user_id ? profilesMap[booking.user_id]?.full_name : null,
      profile_phone: booking.user_id ? profilesMap[booking.user_id]?.phone : null,
      profile_email: booking.user_id ? profilesMap[booking.user_id]?.email : null,
    }));

    setBookings(bookingsWithProfiles as Booking[]);
    setLoading(false);
  };

  const getCustomerName = (booking: Booking) => {
    return booking.guest_name || booking.profile_name || "Unknown";
  };

  const getCustomerPhone = (booking: Booking) => {
    return booking.profile_phone || booking.guest_phone || null;
  };

  const getCustomerEmail = (booking: Booking) => {
    return booking.profile_email || booking.guest_email || null;
  };

  const getServiceDuration = (booking: Booking): number => {
    // Use stored duration if available
    if (booking.duration_minutes) return booking.duration_minutes;
    
    // Fallback to service slug mapping
    const slug = booking.services?.slug || "";
    return SERVICE_DURATIONS[slug] || 120; // Default 2 hours
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      confirmed: "default",
      completed: "secondary",
      cancelled: "destructive",
      pending: "outline",
      pending_payment: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPaymentBadge = (paymentStatus: string | null) => {
    if (!paymentStatus) return null;
    const colors: { [key: string]: string } = {
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      unpaid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      <Badge className={colors[paymentStatus] || ""} variant="outline">
        {paymentStatus}
      </Badge>
    );
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const name = getCustomerName(booking).toLowerCase();
        const phone = getCustomerPhone(booking)?.toLowerCase() || "";
        const email = getCustomerEmail(booking)?.toLowerCase() || "";
        if (!name.includes(searchLower) && !phone.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }

      // Service filter
      if (serviceFilter !== "all" && booking.services?.slug !== serviceFilter) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const bookingDate = parseISO(booking.scheduled_date);
        if (dateRange.from && bookingDate < dateRange.from) return false;
        if (dateRange.to && bookingDate > dateRange.to) return false;
      }

      return true;
    });
  }, [bookings, searchTerm, statusFilter, serviceFilter, dateRange]);

  const generateGoogleCalendarLink = (booking: Booking) => {
    const startDate = parseISO(booking.scheduled_date);
    const [hours, minutes] = booking.scheduled_time.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
    
    const duration = getServiceDuration(booking);
    const endDate = addMinutes(startDate, duration + BUFFER_MINUTES);
    
     const title = `${booking.custom_service_description || booking.services?.name || "Detailing"} - ${getCustomerName(booking)}`;
    const location = [booking.service_address, booking.service_city, booking.service_state, booking.service_zip]
      .filter(Boolean)
      .join(", ");
    
    const details = [
      `Customer: ${getCustomerName(booking)}`,
      getCustomerPhone(booking) ? `Phone: ${getCustomerPhone(booking)}` : null,
      booking.vehicle_type ? `Vehicle: ${booking.vehicle_make || ""} ${booking.vehicle_model || ""} (${booking.vehicle_type})`.trim() : null,
      booking.customer_notes ? `Notes: ${booking.customer_notes}` : null,
    ].filter(Boolean).join("\n");

    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "").slice(0, -1);
    
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      location,
      details,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICSFile = (booking: Booking) => {
    const startDate = parseISO(booking.scheduled_date);
    const [hours, minutes] = booking.scheduled_time.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
    
    const duration = getServiceDuration(booking);
    const endDate = addMinutes(startDate, duration + BUFFER_MINUTES);

    const title = `${booking.custom_service_description || booking.services?.name || "Detailing"} - ${getCustomerName(booking)}`;
    const location = [booking.service_address, booking.service_city, booking.service_state, booking.service_zip]
      .filter(Boolean)
      .join(", ");
    
    const description = [
      `Customer: ${getCustomerName(booking)}`,
      getCustomerPhone(booking) ? `Phone: ${getCustomerPhone(booking)}` : null,
      booking.vehicle_type ? `Vehicle: ${booking.vehicle_make || ""} ${booking.vehicle_model || ""} (${booking.vehicle_type})`.trim() : null,
      booking.customer_notes ? `Notes: ${booking.customer_notes}` : null,
    ].filter(Boolean).join("\\n");

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "").slice(0, -1) + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AV Detailing//Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${booking.id}@avdetailing.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointment-${booking.id.slice(0, 8)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setServiceFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Customer", "Phone", "Email", "Service", "Vehicle", "Address", "Status", "Payment", "Amount"];
    const rows = filteredBookings.map(b => [
      b.scheduled_date,
      b.scheduled_time,
      getCustomerName(b),
      getCustomerPhone(b) || "",
      getCustomerEmail(b) || "",
      b.services?.name || "",
      [b.vehicle_make, b.vehicle_model, b.vehicle_type].filter(Boolean).join(" "),
      [b.service_address, b.service_city].filter(Boolean).join(", "),
      b.status,
      b.payment_status || "",
      b.total_price ? `$${b.total_price}` : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.slug}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Date Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {(searchTerm || statusFilter !== "all" || serviceFilter !== "all" || dateRange.from) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}

            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No appointments found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead>Payment</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow 
                    key={booking.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {format(parseISO(booking.scheduled_date), "MMM d, yyyy")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.scheduled_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getCustomerName(booking)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getCustomerPhone(booking) || getCustomerEmail(booking)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{booking.custom_service_description || booking.services?.name || "Detailing"}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.vehicle_type}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    {isAdmin && (
                      <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Booking"
                            onClick={() => setEditingBooking(booking)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Add to Google Calendar"
                          onClick={() => window.open(generateGoogleCalendarLink(booking), "_blank")}
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download .ics file"
                          onClick={() => generateICSFile(booking)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Date/Time */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold">
                    {format(parseISO(selectedBooking.scheduled_date), "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedBooking.scheduled_time}
                    <span className="text-xs">({getServiceDuration(selectedBooking)} min)</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </h4>
                <div className="pl-6 space-y-1">
                  <div className="font-medium">{getCustomerName(selectedBooking)}</div>
                  {getCustomerPhone(selectedBooking) && (
                    <a 
                      href={`tel:${getCustomerPhone(selectedBooking)}`} 
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {getCustomerPhone(selectedBooking)}
                    </a>
                  )}
                  {getCustomerEmail(selectedBooking) && (
                    <a 
                      href={`mailto:${getCustomerEmail(selectedBooking)}`} 
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {getCustomerEmail(selectedBooking)}
                    </a>
                  )}
                </div>
              </div>

              {/* Location */}
              {selectedBooking.service_address && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      [selectedBooking.service_address, selectedBooking.service_city, selectedBooking.service_state, selectedBooking.service_zip]
                        .filter(Boolean)
                        .join(", ")
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pl-6 text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {[selectedBooking.service_address, selectedBooking.service_city, selectedBooking.service_state, selectedBooking.service_zip]
                      .filter(Boolean)
                      .join(", ")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Service & Vehicle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Service</h4>
                  <div className="text-sm">{selectedBooking.custom_service_description || selectedBooking.services?.name || "Detailing"}</div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle
                  </h4>
                  <div className="text-sm">
                    {[selectedBooking.vehicle_make, selectedBooking.vehicle_model].filter(Boolean).join(" ") || selectedBooking.vehicle_type || "N/A"}
                  </div>
                </div>
              </div>

              {/* Status & Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Status</h4>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Payment
                    </h4>
                    <div className="flex items-center gap-2">
                      {getPaymentBadge(selectedBooking.payment_status)}
                      {selectedBooking.total_price && (
                        <span className="font-semibold">${selectedBooking.total_price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedBooking.customer_notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Customer Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedBooking.customer_notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedBooking(null);
                      setEditingBooking(selectedBooking);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={() => window.open(generateGoogleCalendarLink(selectedBooking), "_blank")}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add to Google Calendar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => generateICSFile(selectedBooking)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download .ics
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Edit Dialog */}
      <BookingEditDialog
        booking={editingBooking}
        open={!!editingBooking}
        onOpenChange={(open) => !open && setEditingBooking(null)}
        onSave={fetchBookings}
        isAdmin={isAdmin}
      />
    </div>
  );
}
