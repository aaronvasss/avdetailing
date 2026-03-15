import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendInProgressSms } from "@/lib/in-progress-sms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calendar, Clock, MapPin, Phone, DollarSign, 
  Users, AlertCircle, CheckCircle2, XCircle,
  Loader2, MessageSquare, Eye, ChevronRight,
  CreditCard, UserCheck
} from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { toast } from "sonner";

const PAID_STATUSES = ["paid", "completed"];

const formatStatusLabel = (status: string): string => {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

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
  assigned_worker_id: string | null;
  services: { name: string } | null;
  profiles: { full_name: string; phone: string } | null;
  worker_name?: string | null;
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
  const [totalTips, setTotalTips] = useState(0);

  useEffect(() => {
    fetchBookings();
    if (isAdmin) {
      fetchMemberships();
      fetchCustomerCount();
      fetchMonthRevenue();
      fetchTotalTips();
    }
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
        assigned_worker_id,
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

    // Fetch profiles for bookings with user_id, and worker names for assigned bookings
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

  const fetchMemberships = async () => {
    const { count } = await supabase
      .from("customer_memberships")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    setActiveMemberships(count || 0);
  };

  const fetchCustomerCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    setTotalCustomers(count || 0);
  };

  const fetchMonthRevenue = async () => {
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("total_price, payment_status")
      .gte("scheduled_date", monthStart)
      .lte("scheduled_date", monthEnd)
      .in("payment_status", PAID_STATUSES);
    const total = (data || []).reduce((sum, b) => sum + (b.total_price || 0), 0);
    setMonthRevenue(total);
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
      if (newStatus === "in_progress") {
        sendInProgressSms(bookingId);
      }
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
      pending_payment: { variant: "secondary", icon: <AlertCircle className="h-3 w-3" /> },
      confirmed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      in_progress: { variant: "default", icon: <Loader2 className="h-3 w-3" /> },
      completed: { variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelled: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    };
    const { variant, icon } = config[status] || { variant: "secondary", icon: null };
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {formatStatusLabel(status)}
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
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { value: todaysBookings.length, label: "Today", icon: Calendar, iconColor: "text-primary/50", cardClass: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20", valueColor: "text-primary" },
            { value: thisWeekBookings.length, label: "This Week", icon: Clock, iconColor: "text-muted-foreground/50", cardClass: "", valueColor: "" },
            ...(isAdmin ? [
              { value: `$${monthRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, label: "Revenue (MTD)", icon: DollarSign, iconColor: "text-green-500/50", cardClass: "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20", valueColor: "text-green-600" },
              { value: activeMemberships, label: "Members", icon: CreditCard, iconColor: "text-blue-500/50", cardClass: "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20", valueColor: "text-blue-600" },
            ] : []),
            { value: pendingBookings.length, label: "Pending", icon: AlertCircle, iconColor: "text-yellow-500/50", cardClass: "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20", valueColor: "text-yellow-600" },
            ...(isAdmin ? [
              { value: totalCustomers, label: "Customers", icon: UserCheck, iconColor: "text-muted-foreground/50", cardClass: "", valueColor: "" },
            ] : []),
          ].map((card, idx) => {
            const Icon = card.icon;
            const fullLabels: Record<string, string> = {
              "Revenue (MTD)": "Monthly Revenue (Month-to-Date, paid only)",
              "Members": "Active Membership Subscribers",
              "Customers": "Total Registered Customers",
            };
            const tooltip = fullLabels[card.label];
            const cardEl = (
              <Card key={idx} className={`${card.cardClass} h-full`}>
                <CardContent className="p-3 sm:p-4 h-[80px] flex items-center">
                  <div className="flex items-center justify-between w-full">
                    <div className="min-w-0">
                      <div className={`text-xl font-bold leading-tight ${card.valueColor}`}>{card.value}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{card.label}</div>
                    </div>
                    <Icon className={`h-6 w-6 flex-shrink-0 ml-2 ${card.iconColor}`} />
                  </div>
                </CardContent>
              </Card>
            );
            return tooltip ? (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>{cardEl}</TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
              </Tooltip>
            ) : (
              cardEl
            );
          })}
        </div>
      </TooltipProvider>

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
        <CardContent className="px-4">
          {todaysBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No bookings scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="relative p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {/* Status badge - top right */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="flex gap-3">
                    {/* Time - left column */}
                    <div className="flex-shrink-0 min-w-[52px] pt-0.5">
                      <div className="text-lg font-bold text-primary leading-tight">
                        {booking.scheduled_time.slice(0, 5)}
                      </div>
                    </div>

                    {/* Details - right column */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-semibold text-foreground text-base leading-tight pr-24 truncate">
                        {getCustomerName(booking)}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {booking.services?.name || "Detailing"} • {booking.vehicle_type}
                      </div>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.service_address}, ${booking.service_city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{booking.service_address}, {booking.service_city}</span>
                      </a>
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        {booking.worker_name ? (
                          <span className="text-xs text-muted-foreground">{booking.worker_name}</span>
                        ) : (
                          <span className="text-xs font-medium text-destructive">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons - bottom right */}
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/50">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onViewBooking(booking)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {getCustomerPhone(booking) && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onTextCustomer(getCustomerPhone(booking)!)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}

                    {booking.status === "confirmed" && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="h-8 text-xs"
                        onClick={() => updateStatus(booking.id, "completed")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Complete
                      </Button>
                    )}

                    {booking.status === "pending" && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="h-8 text-xs"
                        onClick={() => updateStatus(booking.id, "confirmed")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Confirm
                      </Button>
                    )}
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
        <CardContent className="px-4">
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
                  className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onViewBooking(booking)}
                >
                  {/* Date + Time - left column */}
                  <div className="flex-shrink-0 min-w-[68px] text-center">
                    <div className="text-sm font-semibold text-foreground leading-tight">
                      {format(new Date(booking.scheduled_date), "EEE, MMM d")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {booking.scheduled_time.slice(0, 5)}
                    </div>
                  </div>

                  {/* Details - middle column */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-semibold text-foreground text-sm leading-tight truncate">
                      {getCustomerName(booking)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {booking.services?.name || "Detailing"} • {booking.service_city}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {isAdmin && (
                        <span className="text-xs font-semibold text-foreground">${booking.total_price?.toFixed(0)}</span>
                      )}
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
