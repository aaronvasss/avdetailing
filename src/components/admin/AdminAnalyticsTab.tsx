import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths, parseISO } from "date-fns";
import { Loader2, TrendingUp, DollarSign, BarChart3, PieChart } from "lucide-react";
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
  services: { name: string; category: string } | null;
  vehicle_type: string | null;
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
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          scheduled_date,
          total_price,
          status,
          vehicle_type,
          services (name, category)
        `)
        .gte("scheduled_date", format(sixMonthsAgo, "yyyy-MM-dd"))
        .in("status", ["completed", "confirmed", "pending"])
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate revenue trends based on time range
  const getRevenueTrends = () => {
    const completedBookings = bookings.filter(b => b.status === "completed");
    
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

  // Calculate KPIs
  const completedBookings = bookings.filter(b => b.status === "completed");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const totalBookings = completedBookings.length;
  const avgTicketValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  
  // This month stats
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthBookings = completedBookings.filter(b => 
    parseISO(b.scheduled_date) >= thisMonthStart
  );
  const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Last month stats for comparison
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
  const lastMonthBookings = completedBookings.filter(b => {
    const date = parseISO(b.scheduled_date);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });
  const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : "N/A";

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
      {/* KPI Cards */}
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
