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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon, Clock, MapPin, Phone, Mail, Bell, 
  Loader2, Search, Filter, Eye, RotateCcw, X, CheckCircle2, DollarSign, Pencil, Download, Send
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { BookingEditDialog } from "./BookingEditDialog";
import {
  getPaymentBadge as renderPaymentBadge,
  getStatusBadge as renderStatusBadge,
  getPaymentMethodIcon,
  PaymentDetailsSection,
} from "@/lib/payment-display";
import { generateBookingReceiptHTML, openReceiptPrintWindow } from "@/lib/generateReceipt";

interface Booking {
  id: string;
  service_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  total_price: number;
  subtotal: number | null;
  add_ons_total: number | null;
  tip_amount: number | null;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  service_address: string;
  service_city: string;
  address_notes: string | null;
  custom_service_description: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  user_id: string | null;
  created_at: string;
  services: { name: string; slug: string } | null;
  profiles: { full_name: string; email: string; phone: string } | null;
  package_name: string | null;
  booking_add_ons: { id: string; name: string; price: number }[];
  stripe_amount_cents: number | null;
  manage_token: string | null;
}

const getDisplayLabel = (b: Pick<Booking, "package_name" | "custom_service_description" | "services">) =>
  b.package_name || b.custom_service_description || b.services?.name || "Detailing Service";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reminderLog, setReminderLog] = useState<Record<string, string>>({});
  const [requestingPayment, setRequestingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, paymentFilter, dateRange]);

  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select(`
        id,
        service_id,
        scheduled_date,
        scheduled_time,
        status,
        payment_status,
        payment_method,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        total_price,
        subtotal,
        add_ons_total,
        tip_amount,
        vehicle_type,
        vehicle_make,
        vehicle_model,
        service_address,
        service_city,
        address_notes,
        custom_service_description,
        guest_name,
        guest_email,
        guest_phone,
        user_id,
        created_at,
        manage_token,
        services (name, slug),
        booking_add_ons (id, name, price)
      `)
      .order("scheduled_date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (paymentFilter !== "all") {
      query = query.eq("payment_status", paymentFilter);
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
      // Lookup package names by (service_id, vehicle_type)
      const serviceIds = new Set<string>();
      (data || []).forEach((b: any) => {
        if (b.service_id) serviceIds.add(b.service_id);
      });
      const packageMap: Record<string, string> = {};
      if (serviceIds.size > 0) {
        const { data: pkgs } = await supabase
          .from("service_packages")
          .select("service_id, vehicle_type, name")
          .in("service_id", Array.from(serviceIds));
        (pkgs || []).forEach((p: any) => {
          packageMap[`${p.service_id}|${p.vehicle_type}`] = p.name;
        });
      }

      // Lookup Stripe payment amounts (succeeded payments) for these bookings
      const bookingIds = (data || []).map((b: any) => b.id);
      const paymentMap: Record<string, number> = {};
      if (bookingIds.length > 0) {
        const { data: payments } = await supabase
          .from("payment_records")
          .select("booking_id, amount_cents, status")
          .in("booking_id", bookingIds)
          .in("status", ["succeeded", "paid", "completed"]);
        (payments || []).forEach((p: any) => {
          if (p.booking_id && p.amount_cents != null) {
            // Keep the largest amount if multiple records exist
            paymentMap[p.booking_id] = Math.max(paymentMap[p.booking_id] || 0, p.amount_cents);
          }
        });
      }

      const bookingsWithProfiles = await Promise.all(
        (data || []).map(async (booking: any) => {
          let profiles = null;
          if (booking.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email, phone")
              .eq("user_id", booking.user_id)
              .maybeSingle();
            profiles = profile;
          }
          const package_name = booking.service_id && booking.vehicle_type
            ? packageMap[`${booking.service_id}|${booking.vehicle_type}`] || null
            : null;
          return {
            ...booking,
            profiles,
            package_name,
            booking_add_ons: booking.booking_add_ons || [],
            stripe_amount_cents: paymentMap[booking.id] ?? null,
          } as Booking;
        })
      );
      setBookings(bookingsWithProfiles);

      // Load latest "Payment reminder sent" notes for each booking
      if (bookingIds.length > 0) {
        const { data: notes } = await supabase
          .from("booking_internal_notes")
          .select("booking_id, note, created_at")
          .in("booking_id", bookingIds)
          .ilike("note", "Payment reminder sent%")
          .order("created_at", { ascending: false });
        const log: Record<string, string> = {};
        (notes || []).forEach((n: any) => {
          if (!log[n.booking_id]) log[n.booking_id] = n.created_at;
        });
        setReminderLog(log);
      }
    }
    setLoading(false);
  };

  const requestPayment = async (booking: Booking): Promise<boolean> => {
    const name = getCustomerName(booking);
    const phone = getCustomerPhone(booking);
    const email = getCustomerEmail(booking);
    if (!phone && !email) {
      toast.error(`No phone or email on file for ${name}`);
      return false;
    }
    setRequestingPayment(booking.id);
    try {
      const pkgLabel = getDisplayLabel(booking);
      const dateStr = format(new Date(booking.scheduled_date), "MMM d");
      const amount = Number(booking.total_price || 0).toFixed(2);
      const manageLink = booking.manage_token
        ? `${window.location.origin}/booking/manage?token=${booking.manage_token}`
        : `${window.location.origin}/booking`;
      const message = `Hi ${name}! This is AV Detailing. Your ${pkgLabel} service on ${dateStr} has a balance of $${amount} due. Pay now: ${manageLink} or call us at (225) 521-6264. Thank you!`;

      const tasks: Promise<any>[] = [];
      if (phone) {
        tasks.push(supabase.functions.invoke("send-booking-sms", { body: { to: phone, message } }));
      }
      if (email) {
        tasks.push(supabase.functions.invoke("send-contact-email", {
          body: { name: "AV Detailing", email, service: "Payment Reminder", message },
        }));
      }
      await Promise.all(tasks);

      const channels = [phone && "SMS", email && "email"].filter(Boolean).join("+");
      await supabase.from("booking_internal_notes").insert({
        booking_id: booking.id,
        note: `Payment reminder sent on ${format(new Date(), "MMM d, yyyy h:mm a")} via ${channels}`,
      });

      setReminderLog(prev => ({ ...prev, [booking.id]: new Date().toISOString() }));
      toast.success(`Payment request sent to ${name}`);
      return true;
    } catch (err) {
      console.error("Payment request error:", err);
      toast.error("Failed to send payment request");
      return false;
    } finally {
      setRequestingPayment(null);
    }
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
    const updates: { status: string; payment_status?: string } = { status: newStatus };

    if (newStatus === "cancelled") {
      const current = bookings.find(b => b.id === bookingId);
      const prevPayment = current?.payment_status;
      if (prevPayment === "paid" || prevPayment === "completed") {
        updates.payment_status = "refunded";
      } else if (!prevPayment || prevPayment === "pending" || prevPayment === "unpaid") {
        updates.payment_status = "cancelled";
      }
    }

    const { error } = await supabase
      .from("bookings")
      .update(updates)
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
  const serviceTypes = [...new Set(bookings.map(b => getDisplayLabel(b)).filter(Boolean))];
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
    if (serviceFilter !== "all" && getDisplayLabel(booking) !== serviceFilter) {
      return false;
    }

    // Vehicle filter
    if (vehicleFilter !== "all" && booking.vehicle_type !== vehicleFilter) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => renderStatusBadge(status);
  const getPaymentBadge = (status: string) => renderPaymentBadge(status);

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const downloadBulkReceipts = async () => {
    const selected = filteredBookings.filter(b => selectedIds.has(b.id));
    if (selected.length === 0) return;

    // Lookup package info (name, price, slug) for each (service_id, vehicle_type)
    const serviceIds = Array.from(new Set(selected.map(b => b.service_id).filter(Boolean) as string[]));
    const pkgMap: Record<string, { name: string; price: number; slug: string }> = {};
    if (serviceIds.length > 0) {
      const { data: pkgs } = await supabase
        .from("service_packages")
        .select("service_id, vehicle_type, name, price, slug")
        .in("service_id", serviceIds);
      (pkgs || []).forEach((p: any) => {
        pkgMap[`${p.service_id}|${p.vehicle_type}`] = { name: p.name, price: Number(p.price), slug: p.slug };
      });
    }

    const html = selected.map(b => {
      const pkg = b.service_id && b.vehicle_type ? pkgMap[`${b.service_id}|${b.vehicle_type}`] : null;
      const pkgInfo = pkg || (b.package_name ? { name: b.package_name, price: Number(b.subtotal || b.total_price || 0) } : null);
      const addOns = (b.booking_add_ons || []).map(a => ({ id: a.id, name: a.name, price: Number(a.price) }));
      return generateBookingReceiptHTML(b as any, pkgInfo, addOns);
    }).join("\n");

    openReceiptPrintWindow(html, `Receipts (${selected.length})`);
    toast.success(`Opened ${selected.length} receipt${selected.length > 1 ? "s" : ""} — use Print to save as PDF`);
  };

  // Stats
  const stats = {
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    revenue: bookings.filter(b => b.status !== "cancelled" && ["paid", "completed"].includes(b.payment_status)).reduce((sum, b) => sum + (b.total_price || 0), 0),
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
            <SelectItem value="pending_payment">Awaiting Payment</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
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

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 p-3">
          <span className="text-sm font-medium">{selectedIds.size} booking{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={downloadBulkReceipts}>
              <Download className="h-4 w-4 mr-1" />
              Download Receipts
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4 mr-1" />
              Clear selection
            </Button>
          </div>
        </div>
      )}

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
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredBookings.length > 0 && selectedIds.size === filteredBookings.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service + Package</TableHead>
                  {isAdmin && <TableHead>Total</TableHead>}
                  {isAdmin && <TableHead>Payment</TableHead>}
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead>Last Reminder</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id} data-state={selectedIds.has(booking.id) ? "selected" : undefined}>
                    <TableCell className="w-10">
                      <Checkbox
                        checked={selectedIds.has(booking.id)}
                        onCheckedChange={() => toggleSelected(booking.id)}
                        aria-label={`Select booking ${booking.id}`}
                      />
                    </TableCell>
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
                        <span className="font-medium">{getDisplayLabel(booking)}</span>
                        <span className="text-sm text-muted-foreground">
                          {booking.vehicle_type} {booking.vehicle_make}
                          {booking.booking_add_ons?.length > 0 && ` • +${booking.booking_add_ons.length} add-on${booking.booking_add_ons.length > 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <span className="font-medium">${booking.total_price?.toFixed(0)}</span>
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getPaymentMethodIcon(booking.payment_method)}
                          {getPaymentBadge(booking.payment_status)}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {booking.payment_status === "unpaid" && booking.status !== "cancelled" ? (
                          reminderLog[booking.id] ? (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reminderLog[booking.id]), "MMM d, h:mm a")}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Never</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {isAdmin && booking.payment_status === "unpaid" && booking.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-yellow-500/40 text-yellow-700 hover:bg-yellow-500/10"
                            onClick={() => requestPayment(booking)}
                            disabled={requestingPayment === booking.id}
                          >
                            {requestingPayment === booking.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <><Send className="h-3.5 w-3.5 mr-1" />Request Payment</>
                            )}
                          </Button>
                        )}
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
                    <TableCell colSpan={isAdmin ? 9 : 6} className="text-center py-8 text-muted-foreground">
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
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium text-right">{getDisplayLabel(selectedBooking)}</span>
                </div>
                {selectedBooking.services?.name && selectedBooking.package_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type</span>
                    <span className="text-sm">{selectedBooking.services.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span>{selectedBooking.vehicle_type} {selectedBooking.vehicle_make} {selectedBooking.vehicle_model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                {isAdmin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    {getPaymentBadge(selectedBooking.payment_status)}
                  </div>
                )}
              </div>

              {selectedBooking.booking_add_ons?.length > 0 && (
                <div className="border-t pt-4 space-y-1">
                  <div className="text-sm font-medium mb-2">Add-ons</div>
                  {selectedBooking.booking_add_ons.map((a) => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span>{a.name}</span>
                      <span>${Number(a.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedBooking.address_notes && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-1">Customer Notes / Access Instructions</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedBooking.address_notes}</div>
                </div>
              )}

              {isAdmin && (
                <>
                  <PaymentDetailsSection
                    payment_method={selectedBooking.payment_method}
                    payment_status={selectedBooking.payment_status}
                    stripe_checkout_session_id={selectedBooking.stripe_checkout_session_id}
                    stripe_payment_intent_id={selectedBooking.stripe_payment_intent_id}
                    subtotal={selectedBooking.subtotal}
                    add_ons_total={selectedBooking.add_ons_total}
                    tip_amount={selectedBooking.tip_amount}
                    total_price={selectedBooking.total_price}
                  />
                  {selectedBooking.stripe_amount_cents != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stripe Charged</span>
                      <span className={cn(
                        "font-medium",
                        Math.abs((selectedBooking.stripe_amount_cents / 100) - (selectedBooking.total_price || 0)) < 0.01
                          ? "text-green-500"
                          : "text-yellow-500"
                      )}>
                        ${(selectedBooking.stripe_amount_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {isAdmin && selectedBooking.payment_status === "unpaid" && selectedBooking.status === "completed" && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Payment Follow-up</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-500/40 text-yellow-700 hover:bg-yellow-500/10"
                    onClick={() => requestPayment(selectedBooking)}
                    disabled={requestingPayment === selectedBooking.id}
                  >
                    {requestingPayment === selectedBooking.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    Request Payment
                  </Button>
                  {reminderLog[selectedBooking.id] && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last reminder: {format(new Date(reminderLog[selectedBooking.id]), "MMM d, yyyy h:mm a")}
                    </p>
                  )}
                </div>
              )}

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
