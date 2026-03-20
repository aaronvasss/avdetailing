import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths, parseISO } from "date-fns";
import { Loader2, TrendingUp, DollarSign, BarChart3, PieChart, CreditCard, Banknote, Users, AlertTriangle, Wrench } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

interface Booking {
  id: string;
  scheduled_date: string;
  total_price: number | null;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  services: { name: string; category: string } | null;
  vehicle_type: string | null;
  assigned_worker_id: string | null;
  worker_pay_type: string | null;
  worker_pay_rate: number | null;
}

interface Membership {
  id: string;
  status: string;
  membership_plans: { name: string; price: number } | null;
}

interface AdminAnalyticsTabProps {
  isAdmin: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
];

export function AdminAnalyticsTab({ isAdmin }: AdminAnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [totalTips, setTotalTips] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [workerProfiles, setWorkerProfiles] = useState<any[]>([]);
  const [workerNames, setWorkerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const [bookingsRes, membershipsRes, tipsRes, wpRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(`
            id,
            scheduled_date,
            total_price,
            status,
            payment_status,
            payment_method,
            vehicle_type,
            assigned_worker_id,
            worker_pay_type,
            worker_pay_rate,
            services (name, category)
          `)
          .gte("scheduled_date", format(sixMonthsAgo, "yyyy-MM-dd"))
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("customer_memberships")
          .select(`
            id,
            status,
            membership_plans (name, price)
          `),
        supabase
          .from("payment_records")
          .select("amount_cents")
          .eq("payment_type", "tip")
          .eq("status", "paid"),
        supabase
          .from("worker_profiles")
          .select("user_id, pay_rate, pay_type, is_active"),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (membershipsRes.error) throw membershipsRes.error;
      
      setBookings(bookingsRes.data || []);
      setMemberships((membershipsRes.data as any[]) || []);
      setWorkerProfiles(wpRes.data || []);
      
      // Fetch worker display names
      const wpData = wpRes.data || [];
      if (wpData.length > 0) {
        const userIds = wpData.map((w: any) => w.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        const names: Record<string, string> = {};
        (profiles || []).forEach((p: any) => {
          names[p.user_id] = p.full_name || p.email || "Unknown";
        });
        setWorkerNames(names);
      }
      
      const tipData = tipsRes.data || [];
      setTipCount(tipData.length);
      setTotalTips(tipData.reduce((sum, t) => sum + (t.amount_cents || 0), 0) / 100);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Only count bookings where payment has actually been collected
  const isPaidBooking = (b: Booking) => 
    b.status !== "cancelled" && 
    ["paid", "completed"].includes(b.payment_status || "");

  // Calculate revenue trends based on time range
  const getRevenueTrends = () => {
    const completedBookings = bookings.filter(isPaidBooking);
    
    if (timeRange === "daily") {
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });
      
      return last30Days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayBookings = completedBookings.filter(b => b.scheduled_date === dayStr);
        const revenue = dayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        const count = dayBookings.length;
        
        return {
          date: format(day, "MMM d"),
          revenue,
          bookings: count,
          avgTicket: count > 0 ? revenue / count : 0,
        };
      });
    } else if (timeRange === "weekly") {
      const last12Weeks = eachWeekOfInterval({
        start: subDays(new Date(), 83),
        end: new Date(),
      });
      
      return last12Weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart);
        const weekBookings = completedBookings.filter(b => {
          const date = parseISO(b.scheduled_date);
          return date >= weekStart && date <= weekEnd;
        });
        const revenue = weekBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        const count = weekBookings.length;
        
        return {
          date: `Week of ${format(weekStart, "MMM d")}`,
          revenue,
          bookings: count,
          avgTicket: count > 0 ? revenue / count : 0,
        };
      });
    } else {
      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date(),
      });
      
      return last6Months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthBookings = completedBookings.filter(b => {
          const date = parseISO(b.scheduled_date);
          return date >= monthStart && date <= monthEnd;
        });
        const revenue = monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        const count = monthBookings.length;
        
        return {
          date: format(monthStart, "MMM yyyy"),
          revenue,
          bookings: count,
          avgTicket: count > 0 ? revenue / count : 0,
        };
      });
    }
  };

  // Calculate service popularity
  const getServicePopularity = () => {
    const serviceCounts: Record<string, { count: number; revenue: number }> = {};
    
    bookings.forEach(booking => {
      const serviceName = booking.services?.name || "Unknown";
      if (!serviceCounts[serviceName]) {
        serviceCounts[serviceName] = { count: 0, revenue: 0 };
      }
      serviceCounts[serviceName].count += 1;
      serviceCounts[serviceName].revenue += booking.total_price || 0;
    });

    return Object.entries(serviceCounts)
      .map(([name, data]) => ({
        name,
        value: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  // Calculate vehicle type distribution
  const getVehicleDistribution = () => {
    const vehicleCounts: Record<string, number> = {};
    
    bookings.forEach(booking => {
      const vehicleType = booking.vehicle_type || "Unknown";
      vehicleCounts[vehicleType] = (vehicleCounts[vehicleType] || 0) + 1;
    });

    return Object.entries(vehicleCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Calculate KPIs — only count actually-paid bookings
  const allBookings = bookings;
  const paidBookings = bookings.filter(isPaidBooking);
  const noShowBookings = bookings.filter(b => b.status === "no_show");
  const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const totalBookings = paidBookings.length;
  const avgTicketValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  
  // Payment method breakdown
  const onlinePayments = paidBookings.filter(b => b.payment_method === "online");
  const inPersonPayments = paidBookings.filter(b => b.payment_method !== "online");
  const onlineRevenue = onlinePayments.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const inPersonRevenue = inPersonPayments.reduce((sum, b) => sum + (b.total_price || 0), 0);
  
  // No-show rate calculation
  const scheduledAndNoShow = allBookings.filter(b => 
    b.status === "completed" || b.status === "no_show" || b.status === "cancelled"
  );
  const noShowRate = scheduledAndNoShow.length > 0 
    ? ((noShowBookings.length / scheduledAndNoShow.length) * 100).toFixed(1)
    : "0";
  
  // Membership revenue (MRR)
  const activeMemberships = memberships.filter(m => m.status === "active");
  const membershipMRR = activeMemberships.reduce((sum, m) => sum + (m.membership_plans?.price || 0), 0);
  
  // This month stats
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthBookings = paidBookings.filter(b => 
    parseISO(b.scheduled_date) >= thisMonthStart
  );
  const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Last month stats for comparison
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
  const lastMonthBookings = paidBookings.filter(b => {
    const date = parseISO(b.scheduled_date);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });
  const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : "N/A";

  // Payment method chart data
  const paymentMethodData = [
    { name: "Online", value: onlineRevenue, count: onlinePayments.length },
    { name: "In-Person", value: inPersonRevenue, count: inPersonPayments.length },
  ];

  // Labor cost calculation
  const calcBookingLaborCost = (b: Booking): number => {
    if (b.worker_pay_type && b.worker_pay_rate != null) {
      if (b.worker_pay_type === "percentage") return (b.total_price || 0) * (Number(b.worker_pay_rate) / 100);
      return Number(b.worker_pay_rate);
    }
    if (!b.assigned_worker_id) return 0;
    const wp = workerProfiles.find((w: any) => w.user_id === b.assigned_worker_id);
    if (!wp) return 0;
    if (wp.pay_type === "percentage") return (b.total_price || 0) * (wp.pay_rate / 100);
    return wp.pay_rate;
  };

  const completedWithWorker = paidBookings.filter(b => b.assigned_worker_id);
  const totalLaborCost = completedWithWorker.reduce((sum, b) => sum + calcBookingLaborCost(b), 0);

  // Per-worker breakdown
  const workerEarningsMap: Record<string, { earnings: number; jobs: number }> = {};
  completedWithWorker.forEach(b => {
    const wId = b.assigned_worker_id!;
    if (!workerEarningsMap[wId]) workerEarningsMap[wId] = { earnings: 0, jobs: 0 };
    workerEarningsMap[wId].earnings += calcBookingLaborCost(b);
    workerEarningsMap[wId].jobs += 1;
  });

  const revenueTrends = getRevenueTrends();
  const servicePopularity = getServicePopularity();
  const vehicleDistribution = getVehicleDistribution();

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    bookings: {
      label: "Bookings",
      color: "hsl(var(--chart-2))",
    },
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Analytics are only available to administrators.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (6mo)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalBookings} completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {revenueGrowth !== "N/A" ? (
                <span className={Number(revenueGrowth) >= 0 ? "text-green-600" : "text-red-600"}>
                  {Number(revenueGrowth) >= 0 ? "+" : ""}{revenueGrowth}% vs last month
                </span>
              ) : (
                "First month"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership MRR</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${membershipMRR.toLocaleString()}/mo</div>
            <p className="text-xs text-muted-foreground">
              {activeMemberships.length} active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tips Received</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${totalTips.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {tipCount} tips from customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${onlineRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {onlinePayments.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In-Person Payments</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inPersonRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {inPersonPayments.length} transactions (Cash/Zelle/Venmo/Check)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Ticket Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgTicketValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per completed booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Service</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {servicePopularity[0]?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {servicePopularity[0]?.value || 0} bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Revenue Trends</CardTitle>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <AreaChart data={revenueTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="font-medium">{data.date}</p>
                        <p className="text-sm text-primary">Revenue: ${data.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Bookings: {data.bookings}</p>
                        <p className="text-sm text-muted-foreground">Avg: ${data.avgTicket.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Service & Vehicle Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Service Popularity */}
        <Card>
          <CardHeader>
            <CardTitle>Service Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={servicePopularity} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-primary">Bookings: {data.value}</p>
                          <p className="text-sm text-muted-foreground">Revenue: ${data.revenue.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Vehicle Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RechartsPieChart>
                <Pie
                  data={vehicleDistribution}
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
                  {vehicleDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-primary">Count: {data.value}</p>
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

      {/* Booking Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={revenueTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="font-medium">{data.date}</p>
                        <p className="text-sm text-primary">Bookings: {data.bookings}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="bookings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
