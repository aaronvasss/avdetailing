import { parseDateString, businessToday } from "@/lib/time-format";
import { classifyAppointment } from '@/lib/appointment-classification';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Clock,
  Plus,
  CalendarDays,
  Car,
  DollarSign,
  MapPin,
  CalendarClock,
  CalendarPlus,
  Navigation,
  Phone,
  MessageSquare,
  RotateCcw,
  XCircle,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { downloadICS, createBookingCalendarEvent } from "@/lib/calendar";
import { format, parse as parseDate, subDays, addDays } from "date-fns";

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
import { CustomerAppointmentSummary } from "./CustomerAppointmentSummary";

interface AppointmentsTabProps {
  userId: string;
  isAdmin?: boolean;
  onAdminBook?: () => void;
  defaultView?: "list" | "calendar";
  afterNext?: ReactNode;
  /** Customer portal only: "home" shows the next visit summary, "list" the full list. */
  mode?: "home" | "list";
  initialListTab?: "upcoming" | "past";
  onSeeAll?: () => void;
  homeExtras?: (lastBookingId?: string) => ReactNode;
}

const QUICK_BOOK = [
  { label: "Car detail", to: "/car-detailing-baton-rouge" },
  { label: "Ceramic coating", to: "/ceramic-coating-baton-rouge" },
  { label: "Boat", to: "/boat-detailing-baton-rouge" },
  { label: "RV", to: "/rv-detailing-baton-rouge" },
];

export function AppointmentsTab({ userId, isAdmin, onAdminBook, defaultView = "list", afterNext, mode = "list", initialListTab, onSeeAll, homeExtras }: AppointmentsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "calendar">(defaultView);
  const [calendarRange, setCalendarRange] = useState<{ start: Date; end: Date } | null>(null);
  const [historyDaysBack, setHistoryDaysBack] = useState(60);
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [listTab, setListTab] = useState<string>(initialListTab ?? "upcoming");
  const listHeading = useRef<HTMLDivElement>(null);
  const showHistory = () => {
    setActiveView("list"); setListTab("past");
    requestAnimationFrame(() => { listHeading.current?.scrollIntoView({ block: "start", behavior: "smooth" }); listHeading.current?.focus({ preventScroll: true }); });
  };


  const fetchBookings = useCallback(async () => {
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

    if (!isAdmin) {
      // Customers only see their own bookings — small dataset, no window needed
      query = query.eq("user_id", userId);
    } else {
      // Admins: constrain by date window to avoid loading the entire history
      let start: Date;
      let end: Date;
      if (activeView === "calendar" && calendarRange) {
        // Load only the visible calendar range (month/week) with small padding
        start = subDays(calendarRange.start, 1);
        end = addDays(calendarRange.end, 1);
      } else {
        // List view: recent window by default, expandable via "Load older"
        const today = parseDateString(businessToday());
        start = subDays(today, historyDaysBack);
        end = addDays(today, 180);
      }
      query = query
        .gte("scheduled_date", format(start, "yyyy-MM-dd"))
        .lte("scheduled_date", format(end, "yyyy-MM-dd"));
    }

    setLoading(true);
    const { data } = await query;
    if (data) setBookings(data);
    setLoading(false);
    setInitialLoaded(true);
  }, [userId, isAdmin, activeView, calendarRange, historyDaysBack]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);


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

  const today = parseDateString(businessToday());
  const upcomingBookings = bookings.filter(
    (b) => classifyAppointment(b) === 'upcoming'
  );

  const pastBookings = bookings.filter(
    (b) => classifyAppointment(b) === 'past'
  );

  const vehicleLabelOf = (b: Booking) =>
    [b.vehicle_year, b.vehicle_make, b.vehicle_model]
      .filter(Boolean)
      .join(" ") || b.vehicle_type || "Vehicle not listed";

  const vehicleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    pastBookings.forEach((b) => {
      const label = vehicleLabelOf(b);
      if (!seen.has(label)) seen.set(label, label);
    });
    return Array.from(seen.keys()).sort((a, b) => a.localeCompare(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastBookings]);

  const serviceOptions = useMemo(() => {
    const seen = new Map<string, string>();
    pastBookings.forEach((b) => {
      if (b.service_id && b.services?.name && !seen.has(b.service_id)) {
        seen.set(b.service_id, b.services.name);
      }
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastBookings]);

  const filtersActive =
    filterDateRange !== "all" || filterVehicle !== "all" || filterService !== "all";

  const filteredPastBookings = pastBookings.filter((b) => {
    if (filterDateRange !== "all") {
      const cutoff = subDays(today, Number(filterDateRange));
      if (parseDateString(b.scheduled_date) < cutoff) return false;
    }
    if (filterVehicle !== "all" && vehicleLabelOf(b) !== filterVehicle) return false;
    if (filterService !== "all" && b.service_id !== filterService) return false;
    return true;
  });

  const clearFilters = () => {
    setFilterDateRange("all");
    setFilterVehicle("all");
    setFilterService("all");
  };

  // Get next appointment
  const nextAppointment = upcomingBookings[0];

  // Keep the filter hooks above every return, including the first loading render.
  if (loading && !initialLoaded) {
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

  const dialogs = (
    <>
      <BookingDetailsDialog booking={selectedBooking} open={detailsOpen} onOpenChange={setDetailsOpen} onReschedule={handleReschedule} onCancel={handleCancel} isAdmin={isAdmin} onStatusChange={handleSuccess} />
      <RescheduleDialog booking={selectedBooking} open={rescheduleOpen} onOpenChange={setRescheduleOpen} onSuccess={handleSuccess} />
      <CancelBookingDialog booking={selectedBooking} open={cancelOpen} onOpenChange={setCancelOpen} onSuccess={handleSuccess} />
    </>
  );

  if (!isAdmin && mode === "home") {
    const recent = pastBookings.filter(b => b.status === "completed").slice(-3).reverse();
    const lastBooking = pastBookings[pastBookings.length - 1] ?? nextAppointment;
    return (
      <div className="space-y-6">
        {nextAppointment ? (
          <CustomerAppointmentSummary booking={nextAppointment} onDetails={handleViewDetails} onReschedule={handleReschedule} onCancel={handleCancel} />
        ) : (
          <section aria-labelledby="no-upcoming-heading" className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="no-upcoming-heading" className="text-lg font-bold">No upcoming detail</h2>
                <p className="text-sm text-muted-foreground">Pick a service to get started.</p>
              </div>
              <Button asChild className="h-11 shrink-0"><Link to="/book"><Plus className="mr-1.5 h-4 w-4" />Book a detail</Link></Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUICK_BOOK.map(t => (
                <Link key={t.to} to={t.to} className="flex min-h-[48px] items-center justify-center rounded-xl border border-border/60 bg-background/40 px-3 text-center text-sm font-medium hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t.label}</Link>
              ))}
            </div>
          </section>
        )}
        {homeExtras?.(lastBooking?.id)}
        <section aria-labelledby="recent-visits-heading">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 id="recent-visits-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent visits</h2>
            {pastBookings.length > 0 && onSeeAll && <button type="button" onClick={onSeeAll} className="min-h-[44px] px-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">See all</button>}
          </div>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">Completed visits and receipts will show here.</p>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
              {recent.map(b => (
                <li key={b.id}>
                  <button type="button" onClick={() => handleViewDetails(b)} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{b.services?.name || "Detailing Service"}</span>
                      <span className="block text-sm text-muted-foreground">{format(parseDateString(b.scheduled_date), "MMM d, yyyy")}{b.total_price != null ? ` · $${Number(b.total_price).toFixed(2)}` : ""}</span>
                    </span>
                    <span className="text-sm font-medium text-primary">Receipt</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        {nextAppointment && afterNext && (
          <details className="group rounded-2xl border border-border/60 bg-card">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
              Before your appointment
              <span className="text-sm text-muted-foreground group-open:hidden">Show</span>
              <span className="hidden text-sm text-muted-foreground group-open:inline">Hide</span>
            </summary>
            <div className="px-4 pb-4">{afterNext}</div>
          </details>
        )}
        {dialogs}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Appointments</h1>
          <Button
            variant={activeView === "calendar" ? "secondary" : "outline"}
            size="icon"
            className="h-11 w-11"
            aria-label={activeView === "calendar" ? "Show list view" : "Show calendar view"}
            aria-pressed={activeView === "calendar"}
            onClick={() => setActiveView(v => (v === "calendar" ? "list" : "calendar"))}
          >
            <CalendarDays className="h-5 w-5" />
          </Button>
        </div>
        {activeView === "calendar" ? (
          <AppointmentsCalendarView bookings={bookings} onSelectBooking={handleViewDetails} />
        ) : (
          <Tabs value={listTab} onValueChange={setListTab} className="space-y-4">
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="upcoming" className="h-9 rounded-lg">Upcoming ({upcomingBookings.length})</TabsTrigger>
              <TabsTrigger value="past" className="h-9 rounded-lg">Past ({pastBookings.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-0 space-y-3">
              {upcomingBookings.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card p-5 text-center space-y-3">
                  <p className="font-semibold">No upcoming appointments</p>
                  <Button asChild className="h-11"><Link to="/book"><Plus className="mr-1.5 h-4 w-4" />Book a detail</Link></Button>
                </div>
              ) : upcomingBookings.map(booking => (
                <AppointmentCard key={booking.id} booking={booking} onViewDetails={handleViewDetails} onReschedule={handleReschedule} onCancel={handleCancel} />
              ))}
            </TabsContent>
            <TabsContent value="past" className="mt-0 space-y-3">
              {pastBookings.length > 1 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                    <SelectTrigger aria-label="Filter by date" className="h-11"><SelectValue placeholder="Date" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any date</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="180">Last 6 months</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                    <SelectTrigger aria-label="Filter by vehicle" className="h-11"><SelectValue placeholder="Vehicle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any vehicle</SelectItem>
                      {vehicleOptions.map(label => <SelectItem key={label} value={label}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterService} onValueChange={setFilterService}>
                    <SelectTrigger aria-label="Filter by service" className="h-11"><SelectValue placeholder="Service" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any service</SelectItem>
                      {serviceOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {filtersActive && (
                <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredPastBookings.length} of {pastBookings.length}</span>
                  <Button variant="ghost" size="sm" className="h-10" onClick={clearFilters}>Clear filters</Button>
                </div>
              )}
              {pastBookings.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card p-5 text-center space-y-3">
                  <p className="font-semibold">No past visits yet</p>
                  <p className="text-sm text-muted-foreground">Receipts and service photos appear here after each visit.</p>
                  <Button asChild variant="outline" className="h-11"><Link to="/book">Book your first detail</Link></Button>
                </div>
              ) : filteredPastBookings.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card p-5 text-center space-y-3">
                  <p className="text-muted-foreground">No past visits match these filters.</p>
                  <Button variant="outline" className="h-11" onClick={clearFilters}>Clear filters</Button>
                </div>
              ) : [...filteredPastBookings].reverse().map(booking => (
                <AppointmentCard key={booking.id} booking={booking} onViewDetails={handleViewDetails} onReschedule={handleReschedule} onCancel={handleCancel} compact />
              ))}
            </TabsContent>
          </Tabs>
        )}
        {dialogs}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Appointment Highlight */}
      {!isAdmin && (nextAppointment ?
        <CustomerAppointmentSummary booking={nextAppointment} onDetails={handleViewDetails} onReschedule={handleReschedule} onCancel={handleCancel} /> :
        <section className="py-5 border-b border-border space-y-3">
          <h2 className="text-xl font-bold">No upcoming appointments</h2>
          <p className="text-sm text-muted-foreground">Book your next detail whenever you’re ready.</p>
          <Button asChild><Link to="/book"><Plus className="h-4 w-4 mr-2" />Book a detail</Link></Button>
        </section>)}
      {!isAdmin && <Button variant="outline" onClick={showHistory}><Clock className="h-4 w-4 mr-2" />History & receipts{pastBookings.length > 0 ? ` (${pastBookings.length})` : ""}</Button>}
      {nextAppointment && afterNext}
      {isAdmin && nextAppointment && (() => {
        const b = nextAppointment;
        const addr = [b.service_address, b.service_city, b.service_state, b.service_zip].filter(Boolean).join(", ");
        const vehicle = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(" ") || b.vehicle_type;
        const price = b.total_price != null ? `$${Number(b.total_price).toFixed(2)}` : null;
        return (
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Next Appointment</p>
                  <h3 className="text-xl font-bold">{b.services?.name || "Detailing Service"}</h3>
                </div>
                <span className="text-xs uppercase tracking-wide rounded-full border border-primary/40 px-2.5 py-1 text-primary">
                  {b.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(b.scheduled_date + "T12:00:00"), "EEEE, MMMM d")}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatTime12h(b.scheduled_time)} (30 min arrival window)</span>
                {vehicle && <span className="flex items-center gap-1.5"><Car className="h-4 w-4" />{vehicle}</span>}
                {price && <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{price}</span>}
                {addr && <span className="flex items-center gap-1.5 sm:col-span-2"><MapPin className="h-4 w-4 shrink-0" />{addr}</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button size="sm" onClick={() => handleViewDetails(b)}>View Details</Button>
                <Button size="sm" variant="outline" onClick={() => handleReschedule(b)}><CalendarClock className="h-4 w-4 mr-1" />Reschedule</Button>
                <Button size="sm" variant="outline" onClick={() => downloadICS(createBookingCalendarEvent(b as any))}><CalendarPlus className="h-4 w-4 mr-1" />Add to Calendar</Button>
                {addr ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`} target="_blank" rel="noopener noreferrer"><Navigation className="h-4 w-4 mr-1" />Directions</a>
                  </Button>
                ) : <span />}
                <Button size="sm" variant="outline" asChild><a href="tel:2255216264"><Phone className="h-4 w-4 mr-1" />Call Us</a></Button>
                <Button size="sm" variant="outline" asChild><a href="sms:2255216264"><MessageSquare className="h-4 w-4 mr-1" />Text Us</a></Button>
                {!isAdmin && <Button size="sm" variant="outline" asChild><Link to={`/book?repeat=${b.id}`}><RotateCcw className="h-4 w-4 mr-1" />Book Again</Link></Button>}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(b)}><XCircle className="h-4 w-4 mr-1" />Cancel appointment</Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* View Toggle & Actions */}
      <div ref={listHeading} tabIndex={-1} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 scroll-mt-24 focus:outline-none">
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
      </div>

      {/* Calendar View */}
      {activeView === "calendar" && (
        <AppointmentsCalendarView
          bookings={bookings}
          onSelectBooking={handleViewDetails}
          onVisibleRangeChange={
            isAdmin
              ? (start, end) =>
                  setCalendarRange((prev) =>
                    prev && prev.start.getTime() === start.getTime() && prev.end.getTime() === end.getTime()
                      ? prev
                      : { start, end }
                  )
              : undefined
          }
        />
      )}

      {/* List View */}
      {activeView === "list" && (
        <Tabs value={listTab} onValueChange={setListTab} className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {isAdmin ? "History" : "History & receipts"} ({filtersActive ? filteredPastBookings.length : pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {!isAdmin && upcomingBookings.length <= 1 ? (
              <p className="text-sm text-muted-foreground py-3">{nextAppointment ? "No other upcoming appointments." : "Your upcoming appointments will appear here."}</p>
            ) : upcomingBookings.length === 0 ? (
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
              upcomingBookings.filter(booking => isAdmin || booking.id !== nextAppointment?.id).map((booking) => (
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
            {pastBookings.length > 0 && (
              <div className="rounded-lg border border-border/50 bg-card p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Find past appointments
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                    <SelectTrigger aria-label="Filter by date" className="h-10">
                      <span className="flex items-center gap-2 min-w-0">
                        <Filter className="h-4 w-4 text-primary shrink-0" />
                        <SelectValue placeholder="Date" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any date</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="180">Last 6 months</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                    <SelectTrigger aria-label="Filter by vehicle" className="h-10">
                      <span className="flex items-center gap-2 min-w-0">
                        <Car className="h-4 w-4 text-primary shrink-0" />
                        <SelectValue placeholder="Vehicle" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any vehicle</SelectItem>
                      {vehicleOptions.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterService} onValueChange={setFilterService}>
                    <SelectTrigger aria-label="Filter by service" className="h-10">
                      <span className="flex items-center gap-2 min-w-0">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <SelectValue placeholder="Service" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any service</SelectItem>
                      {serviceOptions.map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {filtersActive && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredPastBookings.length} of {pastBookings.length} past appointments
                    </p>
                    <Button variant="outline" size="sm" className="h-8" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            )}
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No service history yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Your past appointments, available receipts and completed service records will appear here.</p>
                </CardContent>
              </Card>
            ) : filteredPastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Filter className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No past appointments match your filters.
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPastBookings.map((booking) => (
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

            {isAdmin && (
              <div className="pt-2 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Showing history from the last {historyDaysBack} days
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => setHistoryDaysBack((d) => d + 180)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {loading ? "Loading…" : "Load older appointments"}
                </Button>
              </div>
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
