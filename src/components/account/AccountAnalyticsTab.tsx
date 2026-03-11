import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, TrendingUp, Users, CalendarDays, Star, BarChart3, CreditCard } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  PieChart as RechartsPieChart, Pie, Cell,
} from "recharts";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isAfter } from "date-fns";

interface Booking {
  id: string;
  scheduled_date: string;
  total_price: number | null;
  status: string;
  payment_method: string | null;
  created_at: string;
  guest_email: string | null;
  guest_name: string | null;
  user_id: string | null;
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

type DateRange = "week" | "month" | "3months" | "all";

export function AccountAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>("month");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, membershipsRes, clientsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, scheduled_date, total_price, status, payment_method, created_at, guest_email, guest_name, user_id, services (name, category)")
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("customer_memberships")
          .select("id, status, membership_plans (name, price)"),
        supabase
          .from("clients")
          .select("id, created_at", { count: "exact" }),
      ]);

      setBookings(bookingsRes.data || []);
      setMemberships((membershipsRes.data as any[]) || []);
      setTotalCustomers(clientsRes.count || 0);
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    if (dateRange === "week") return subDays(now, 7);
    if (dateRange === "month") return startOfMonth(now);
    if (dateRange === "3months") return subMonths(now, 3);
    return new Date("2020-01-01");
  };

  const filtered = useMemo(() => {
    const cutoff = getDateFilter();
    return bookings.filter(b => {
      const d = parseISO(b.scheduled_date);
      return isAfter(d, cutoff) || format(d, "yyyy-MM-dd") === format(cutoff, "yyyy-MM-dd");
    });
  }, [bookings, dateRange]);

  const completed = filtered.filter(b => b.status === "completed" || b.status === "confirmed");

  // KPIs
  const totalRevenue = completed.reduce((s, b) => s + (b.total_price || 0), 0);
  const thisMonthStart = startOfMonth(new Date());
  const thisWeekStart = startOfWeek(new Date());
  const revenueThisMonth = bookings
    .filter(b => (b.status === "completed" || b.status === "confirmed") && parseISO(b.scheduled_date) >= thisMonthStart)
    .reduce((s, b) => s + (b.total_price || 0), 0);
  const revenueThisWeek = bookings
    .filter(b => (b.status === "completed" || b.status === "confirmed") && parseISO(b.scheduled_date) >= thisWeekStart)
    .reduce((s, b) => s + (b.total_price || 0), 0);

  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
  const bookingsThisMonth = bookings.filter(b => parseISO(b.scheduled_date) >= thisMonthStart && b.status !== "cancelled").length;
  const bookingsLastMonth = bookings.filter(b => {
    const d = parseISO(b.scheduled_date);
    return d >= lastMonthStart && d <= lastMonthEnd && b.status !== "cancelled";
  }).length;

  const activeMemberships = memberships.filter(m => m.status === "active").length;

  // New customers this month
  const newCustomersThisMonth = bookings.filter(b => {
    const created = parseISO(b.created_at);
    return created >= thisMonthStart;
  }).reduce((acc, b) => {
    const key = b.guest_email || b.user_id || b.guest_name;
    if (key && !acc.has(key)) acc.add(key);
    return acc;
  }, new Set()).size;

  // Revenue by service type
  const serviceRevenue = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    completed.forEach(b => {
      const name = b.services?.name || "Unknown";
      if (!map[name]) map[name] = { revenue: 0, count: 0 };
      map[name].revenue += b.total_price || 0;
      map[name].count += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [completed]);

  // Most booked service
  const mostBookedService = serviceRevenue[0]?.name || "N/A";

  // Most booked day of week
  const dayOfWeekCounts = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    filtered.filter(b => b.status !== "cancelled").forEach(b => {
      counts[parseISO(b.scheduled_date).getDay()] += 1;
    });
    const maxIdx = counts.indexOf(Math.max(...counts));
    return days[maxIdx] || "N/A";
  }, [filtered]);

  // Revenue chart by day (last 30 days)
  const dailyRevenue = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayBookings = bookings.filter(b =>
        b.scheduled_date === dayStr && (b.status === "completed" || b.status === "confirmed")
      );
      return {
        date: format(day, "MMM d"),
        revenue: dayBookings.reduce((s, b) => s + (b.total_price || 0), 0),
        bookings: dayBookings.length,
      };
    });
  }, [bookings]);

  // Service pie chart
  const servicePieData = serviceRevenue.slice(0, 6).map(s => ({ name: s.name, value: s.revenue }));

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Business Analytics</h2>
        <Select value={dateRange} onValueChange={v => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row 1 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueThisWeek.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Memberships</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMemberships}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Last month: {bookingsLastMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Booked Service</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{mostBookedService}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busiest Day</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayOfWeekCounts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCustomersThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
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
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={serviceRevenue.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          <CardHeader>
            <CardTitle>Service Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RechartsPieChart>
                <Pie
                  data={servicePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {servicePieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
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
    </div>
  );
}