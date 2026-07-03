import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, DollarSign, TrendingUp, Users, CalendarDays, Star, CreditCard,
  MessageSquare, CalendarIcon, CheckCircle2, XCircle, Repeat, Percent, Award,
} from "lucide-react";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  PieChart as RechartsPieChart, Pie, Cell,
} from "recharts";
import {
  format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfYear, eachDayOfInterval, parseISO, differenceInDays,
} from "date-fns";

interface Booking {
  id: string;
  scheduled_date: string;
  total_price: number | null;
  subtotal: number | null;
  add_ons_total: number | null;
  tip_amount: number | null;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  guest_email: string | null;
  guest_name: string | null;
  user_id: string | null;
  client_id: string | null;
  services: { name: string; category: string } | null;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 65%, 60%)",
];

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  bookings: { label: "Bookings", color: "hsl(var(--chart-2))" },
};

type Preset = "week" | "month" | "lastMonth" | "3months" | "6months" | "ytd" | "year" | "all" | "custom";

export function AccountAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [preset, setPreset] = useState<Preset>("month");
  const [customStart, setCustomStart] = useState<Date | undefined>(subDays(new Date(), 30));
  const [customEnd, setCustomEnd] = useState<Date | undefined>(new Date());
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(true);
  const [reviewRequestsThisMonth, setReviewRequestsThisMonth] = useState(0);
  const [togglingReview, setTogglingReview] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const thisMonthStart = startOfMonth(new Date());
      const [bookingsRes, membershipsRes, clientsRes, settingsRes, reviewSmsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, scheduled_date, total_price, subtotal, add_ons_total, tip_amount, status, payment_status, payment_method, created_at, guest_email, guest_name, user_id, client_id, services (name, category)")
          .order("scheduled_date", { ascending: true }),
        supabase.from("customer_memberships").select("id, status, membership_plans (name, price)"),
        supabase.from("clients").select("id, created_at", { count: "exact" }),
        supabase.from("business_settings").select("value").eq("key", "auto_review_request_enabled").maybeSingle(),
        supabase.from("sms_messages").select("id", { count: "exact" }).ilike("body", "%Google review%").gte("created_at", format(thisMonthStart, "yyyy-MM-dd")),
      ]);
      setBookings((bookingsRes.data as any) || []);
      setMemberships((membershipsRes.data as any[]) || []);
      setTotalCustomers(clientsRes.count || 0);
      setAutoReviewEnabled(settingsRes.data?.value !== "false");
      setReviewRequestsThisMonth(reviewSmsRes.count || 0);
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Resolve preset -> [start, end]
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const now = new Date();
    let s: Date, e: Date = now, label = "";
    switch (preset) {
      case "week": s = subDays(now, 7); label = "Last 7 Days"; break;
      case "month": s = startOfMonth(now); e = endOfMonth(now); label = format(now, "MMMM yyyy"); break;
      case "lastMonth": {
        const lm = subMonths(now, 1);
        s = startOfMonth(lm); e = endOfMonth(lm); label = format(lm, "MMMM yyyy"); break;
      }
      case "3months": s = subMonths(now, 3); label = "Last 3 Months"; break;
      case "6months": s = subMonths(now, 6); label = "Last 6 Months"; break;
      case "ytd": s = startOfYear(now); label = `${now.getFullYear()} YTD`; break;
      case "year": s = subMonths(now, 12); label = "Last 12 Months"; break;
      case "all": s = new Date("2020-01-01"); label = "All Time"; break;
      case "custom":
        s = customStart || subDays(now, 30);
        e = customEnd || now;
        label = `${format(s, "MMM d, yyyy")} – ${format(e, "MMM d, yyyy")}`;
        break;
      default: s = startOfMonth(now); label = "This Month";
    }
    return { rangeStart: s, rangeEnd: e, rangeLabel: label };
  }, [preset, customStart, customEnd]);

  const inRange = (b: Booking) => {
    const d = parseISO(b.scheduled_date);
    return d >= new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate())
      && d <= new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59);
  };

  const filtered = useMemo(() => bookings.filter(inRange), [bookings, rangeStart, rangeEnd]);
  const isRevenue = (b: Booking) => ["completed", "confirmed"].includes(b.status);

  // KPIs based on filtered range
  const completed = filtered.filter(b => b.status === "completed");
  const confirmed = filtered.filter(b => b.status === "confirmed");
  const cancelled = filtered.filter(b => b.status === "cancelled");
  const revenueBookings = filtered.filter(isRevenue);

  const totalRevenue = revenueBookings.reduce((s, b) => s + (b.total_price || 0), 0);
  const totalTips = revenueBookings.reduce((s, b) => s + (b.tip_amount || 0), 0);
  const totalAddOns = revenueBookings.reduce((s, b) => s + (b.add_ons_total || 0), 0);
  const avgTicket = revenueBookings.length ? totalRevenue / revenueBookings.length : 0;
  const detailingsDone = completed.length;
  const cancelRate = filtered.length ? (cancelled.length / filtered.length) * 100 : 0;

  // Prior period comparison
  const rangeDays = Math.max(1, differenceInDays(rangeEnd, rangeStart) + 1);
  const priorStart = subDays(rangeStart, rangeDays);
  const priorEnd = subDays(rangeEnd, rangeDays);
  const priorRevenue = bookings
    .filter(b => {
      const d = parseISO(b.scheduled_date);
      return isRevenue(b) && d >= priorStart && d <= priorEnd;
    })
    .reduce((s, b) => s + (b.total_price || 0), 0);
  const revChangePct = priorRevenue > 0 ? ((totalRevenue - priorRevenue) / priorRevenue) * 100 : null;

  const activeMemberships = memberships.filter(m => m.status === "active").length;

  // New customers in range: first-ever booking scheduled_date falls in range
  const newCustomersInRange = useMemo(() => {
    const firstBooking: Record<string, string> = {};
    bookings.forEach(b => {
      const key = b.client_id || b.user_id || b.guest_email || b.guest_name;
      if (!key) return;
      if (!firstBooking[key] || b.scheduled_date < firstBooking[key]) firstBooking[key] = b.scheduled_date;
    });
    return Object.values(firstBooking).filter(d => {
      const dt = parseISO(d);
      return dt >= rangeStart && dt <= rangeEnd;
    }).length;
  }, [bookings, rangeStart, rangeEnd]);

  // Repeat customer % (in range: how many customers had >1 booking historically)
  const repeatRate = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      const key = b.client_id || b.user_id || b.guest_email || b.guest_name;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    const inRangeCustomers = new Set<string>();
    filtered.forEach(b => {
      const key = b.client_id || b.user_id || b.guest_email || b.guest_name;
      if (key) inRangeCustomers.add(key);
    });
    if (!inRangeCustomers.size) return 0;
    let repeat = 0;
    inRangeCustomers.forEach(k => { if ((counts[k] || 0) > 1) repeat++; });
    return (repeat / inRangeCustomers.size) * 100;
  }, [bookings, filtered]);

  // Revenue by service
  const serviceStats = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    revenueBookings.forEach(b => {
      const name = b.services?.name || "Unknown";
      if (!map[name]) map[name] = { revenue: 0, count: 0 };
      map[name].revenue += b.total_price || 0;
      map[name].count += 1;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue);
  }, [revenueBookings]);

  const mostBookedService = [...serviceStats].sort((a, b) => b.count - a.count)[0]?.name || "N/A";

  // Payment methods
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    revenueBookings.forEach(b => {
      const m = b.payment_method || "unspecified";
      if (!map[m]) map[m] = { amount: 0, count: 0 };
      map[m].amount += b.total_price || 0;
      map[m].count += 1;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.amount - a.amount);
  }, [revenueBookings]);

  // Day of week
  const dayOfWeek = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    filtered.filter(b => b.status !== "cancelled").forEach(b => {
      counts[parseISO(b.scheduled_date).getDay()] += 1;
    });
    const max = Math.max(...counts);
    if (!max) return "N/A";
    return days[counts.indexOf(max)];
  }, [filtered]);

  // Daily revenue chart (matches range, bucketed by day; if range > 90 days, bucket by month)
  const dailyRevenue = useMemo(() => {
    const days = differenceInDays(rangeEnd, rangeStart);
    if (days <= 92) {
      const list = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      return list.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayB = bookings.filter(b => b.scheduled_date === dayStr && isRevenue(b));
        return {
          date: format(day, "MMM d"),
          revenue: dayB.reduce((s, b) => s + (b.total_price || 0), 0),
          bookings: dayB.length,
        };
      });
    }
    // Monthly buckets
    const map: Record<string, { revenue: number; bookings: number }> = {};
    revenueBookings.forEach(b => {
      const k = format(parseISO(b.scheduled_date), "MMM yyyy");
      if (!map[k]) map[k] = { revenue: 0, bookings: 0 };
      map[k].revenue += b.total_price || 0;
      map[k].bookings += 1;
    });
    return Object.entries(map).map(([date, d]) => ({ date, ...d }));
  }, [bookings, revenueBookings, rangeStart, rangeEnd]);

  const servicePieData = serviceStats.slice(0, 6).map(s => ({ name: s.name, value: s.revenue }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Business Analytics</h2>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={v => setPreset(v as Preset)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="year">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range…</SelectItem>
            </SelectContent>
          </Select>

          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !customStart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStart ? format(customStart, "MMM d, yyyy") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart} onSelect={setCustomStart} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">–</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !customEnd && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEnd ? format(customEnd, "MMM d, yyyy") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Auto Review */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-review"
                  checked={autoReviewEnabled}
                  disabled={togglingReview}
                  onCheckedChange={async (checked) => {
                    setTogglingReview(true);
                    const { error } = await supabase
                      .from("business_settings")
                      .update({ value: checked ? "true" : "false", updated_at: new Date().toISOString() })
                      .eq("key", "auto_review_request_enabled");
                    if (error) toast.error("Failed to update setting");
                    else {
                      setAutoReviewEnabled(checked);
                      toast.success(checked ? "Auto review requests enabled" : "Auto review requests disabled");
                    }
                    setTogglingReview(false);
                  }}
                />
                <Label htmlFor="auto-review" className="text-sm font-medium cursor-pointer">Auto Google Review Request</Label>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">Sends SMS + email when a booking is marked as completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{reviewRequestsThisMonth}</span>
              <span className="text-muted-foreground">sent this month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Row 1 - Revenue */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi title="Total Revenue" icon={DollarSign} value={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} sub={revChangePct !== null ? `${revChangePct >= 0 ? "▲" : "▼"} ${Math.abs(revChangePct).toFixed(1)}% vs prior period` : "vs prior: n/a"} />
        <Kpi title="Avg Ticket" icon={TrendingUp} value={`$${avgTicket.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} sub={`${revenueBookings.length} paid jobs`} />
        <Kpi title="Tips Collected" icon={Award} value={`$${totalTips.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Kpi title="Add-Ons Revenue" icon={DollarSign} value={`$${totalAddOns.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
      </div>

      {/* KPI Row 2 - Volume */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi title="Detailings Completed" icon={CheckCircle2} value={detailingsDone.toString()} sub={`${confirmed.length} upcoming`} />
        <Kpi title="Total Bookings" icon={CalendarDays} value={filtered.length.toString()} sub={`${cancelled.length} cancelled`} />
        <Kpi title="Cancel Rate" icon={XCircle} value={`${cancelRate.toFixed(1)}%`} />
        <Kpi title="Active Memberships" icon={CreditCard} value={activeMemberships.toString()} />
      </div>

      {/* KPI Row 3 - Customers */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi title="New Customers" icon={Users} value={newCustomersInRange.toString()} sub="First booking in range" />
        <Kpi title="Repeat Rate" icon={Repeat} value={`${repeatRate.toFixed(0)}%`} sub="Customers w/ >1 booking" />
        <Kpi title="Most Booked Service" icon={Star} value={mostBookedService} large={false} />
        <Kpi title="Busiest Day" icon={CalendarDays} value={dayOfWeek} />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="font-medium">{d.date}</p>
                        <p className="text-sm text-primary">Revenue: ${d.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Bookings: {d.bookings}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Service Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue by Service</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={serviceStats.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-sm text-primary">Revenue: ${d.revenue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Bookings: {d.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Service Distribution</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RechartsPieChart>
                <Pie
                  data={servicePieData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100} paddingAngle={2}
                  dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {servicePieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-sm text-primary">${d.value.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
        <CardContent>
          {paymentBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No paid bookings in this range.</p>
          ) : (
            <div className="space-y-2">
              {paymentBreakdown.map(p => (
                <div key={p.name} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize font-medium">{p.name.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground">({p.count} jobs)</span>
                  </div>
                  <span className="font-semibold">${p.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Total customers all-time: {totalCustomers}
      </p>
    </div>
  );
}

function Kpi({
  title, value, sub, icon: Icon, large = true,
}: { title: string; value: string; sub?: string; icon: any; large?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn(large ? "text-2xl" : "text-lg", "font-bold truncate")}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
