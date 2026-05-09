import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths, parseISO, startOfYear, differenceInMinutes, differenceInDays } from "date-fns";
import { Loader2, TrendingUp, DollarSign, BarChart3, PieChart, CreditCard, Banknote, Users, AlertTriangle, Wrench, Crown, Star, ChevronDown, ChevronUp, Calendar as CalendarIcon, Download, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
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
  scheduled_time: string | null;
  in_progress_at: string | null;
  clock_in_at?: string | null;
  completed_at?: string | null;
  total_price: number | null;
  tip_amount: number | null;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  services: { name: string; category: string } | null;
  vehicle_type: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  guest_name?: string | null;
  assigned_worker_id: string | null;
  worker_pay_type: string | null;
  worker_pay_rate: number | null;
  service_packages?: { name: string } | null;
  rating?: number | null;
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
  const [workerRatings, setWorkerRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [showLaborBreakdown, setShowLaborBreakdown] = useState(false);
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [drillWorker, setDrillWorker] = useState<string | null>(null);

  type RangePreset = "week" | "month" | "30d" | "90d" | "year" | "custom";
  const [rangePreset, setRangePreset] = useState<RangePreset>("month");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const applyPreset = (p: RangePreset) => {
    setRangePreset(p);
    const now = new Date();
    if (p === "week") setDateRange({ from: startOfWeek(now), to: now });
    else if (p === "month") setDateRange({ from: startOfMonth(now), to: now });
    else if (p === "30d") setDateRange({ from: subDays(now, 30), to: now });
    else if (p === "90d") setDateRange({ from: subDays(now, 90), to: now });
    else if (p === "year") setDateRange({ from: startOfYear(now), to: now });
  };

  useEffect(() => {
    fetchData();
  }, [dateRange?.from, dateRange?.to]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fromDate = dateRange?.from || subMonths(new Date(), 1);
      const toDate = dateRange?.to || new Date();

      const [bookingsRes, membershipsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(`
            id,
            scheduled_date,
            scheduled_time,
            in_progress_at,
            clock_in_at,
            total_price,
            tip_amount,
            status,
            payment_status,
            payment_method,
            vehicle_type,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            guest_name,
            assigned_worker_id,
            worker_pay_type,
            worker_pay_rate,
            services (name, category)
          `)
          .gte("scheduled_date", format(fromDate, "yyyy-MM-dd"))
          .lte("scheduled_date", format(toDate, "yyyy-MM-dd"))
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("customer_memberships")
          .select(`
            id,
            status,
            membership_plans (name, price)
          `),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (membershipsRes.error) throw membershipsRes.error;

      setBookings((bookingsRes.data as any[]) || []);
      setMemberships((membershipsRes.data as any[]) || []);

      // Resilient: worker_profiles may not exist
      let wpData: any[] = [];
      try {
        const { data, error } = await supabase
          .from("worker_profiles" as any)
          .select("user_id, pay_rate, pay_type, is_active");
        if (!error && data) wpData = data as any[];
      } catch (e) {
        console.warn("worker_profiles unavailable", e);
      }
      setWorkerProfiles(wpData);

      // Fetch worker display names
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

      // Resilient: tips from payment_records
      let onlineTipTotal = 0;
      let onlineTipCount = 0;
      try {
        const { data, error } = await supabase
          .from("payment_records")
          .select("amount_cents")
          .eq("payment_type", "tip")
          .eq("status", "paid");
        if (!error && data) {
          onlineTipTotal = data.reduce((sum, t: any) => sum + (t.amount_cents || 0), 0) / 100;
          onlineTipCount = data.length;
        }
      } catch (e) {
        console.warn("payment_records tips unavailable", e);
      }

      // Also sum tip_amount from bookings (cash/in-person tips)
      const bookingTips = (bookingsRes.data || []).filter((b: any) => b.tip_amount && b.tip_amount > 0);
      const bookingTipTotal = bookingTips.reduce((sum: number, b: any) => sum + Number(b.tip_amount), 0);

      setTipCount(onlineTipCount + bookingTips.length);
      setTotalTips(onlineTipTotal + bookingTipTotal);

      // Fetch ratings — group by worker AND attach per-booking rating
      try {
        const bookingIds = (bookingsRes.data || []).map((b: any) => b.id);
        if (bookingIds.length > 0) {
          const { data: ratings } = await supabase
            .from("booking_ratings")
            .select("booking_id, rating")
            .in("booking_id", bookingIds);
          const bookingToWorker: Record<string, string> = {};
          const bookingRating: Record<string, number> = {};
          (bookingsRes.data || []).forEach((b: any) => {
            if (b.assigned_worker_id) bookingToWorker[b.id] = b.assigned_worker_id;
          });
          const acc: Record<string, { sum: number; count: number }> = {};
          (ratings || []).forEach((r: any) => {
            bookingRating[r.booking_id] = r.rating;
            const wId = bookingToWorker[r.booking_id];
            if (!wId) return;
            if (!acc[wId]) acc[wId] = { sum: 0, count: 0 };
            acc[wId].sum += r.rating;
            acc[wId].count += 1;
          });
          const out: Record<string, { avg: number; count: number }> = {};
          Object.entries(acc).forEach(([k, v]) => {
            out[k] = { avg: v.sum / v.count, count: v.count };
          });
          setWorkerRatings(out);
          // Attach rating to bookings in state
          setBookings(prev => prev.map(b => ({ ...b, rating: bookingRating[b.id] ?? null })));
        }
      } catch (e) {
        console.warn("ratings unavailable", e);
      }
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

  // Calculate service popularity (paid bookings only)
  const getServicePopularity = () => {
    const serviceCounts: Record<string, { count: number; revenue: number }> = {};

    bookings.filter(isPaidBooking).forEach(booking => {
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

  // Calculate vehicle type distribution (paid bookings only)
  const getVehicleDistribution = () => {
    const vehicleCounts: Record<string, number> = {};

    bookings.filter(isPaidBooking).forEach(booking => {
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
  const cancelledBookings = bookings.filter(b => b.status === "cancelled");
  const cancelledLostRevenue = cancelledBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
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

  // ===== Team Performance Stats =====
  const thirtyDaysAgo = subDays(new Date(), 30);
  const completedBookingsAll = bookings.filter(b => b.status === "completed" && b.assigned_worker_id);

  // Returns minutes late (positive = late, negative = early). null if no in_progress data.
  const getOnTimeDiff = (b: Booking): number | null => {
    const startedAt = b.clock_in_at || b.in_progress_at;
    if (!startedAt || !b.scheduled_time) return null;
    try {
      const scheduled = parseISO(`${b.scheduled_date}T${b.scheduled_time}`);
      const started = new Date(startedAt);
      return differenceInMinutes(started, scheduled);
    } catch {
      return null;
    }
  };

  interface WorkerStats {
    workerId: string;
    name: string;
    initials: string;
    jobsLast30: number;
    revenue: number;
    revenueThisMonth: number;
    avgTicket: number;
    tips: number;
    earnings: number;
    rating: { avg: number; count: number } | null;
    onTimeRate: number | null; // null = no data
    onTimeJobs: number;
    onTimeTotal: number;
    jobs: Booking[];
  }

  const workerStatsMap: Record<string, WorkerStats> = {};
  completedBookingsAll.forEach(b => {
    const wId = b.assigned_worker_id!;
    const date = parseISO(b.scheduled_date);
    if (!workerStatsMap[wId]) {
      const name = workerNames[wId] || "Unknown";
      const initials = name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "??";
      workerStatsMap[wId] = {
        workerId: wId,
        name,
        initials,
        jobsLast30: 0,
        revenue: 0,
        revenueThisMonth: 0,
        avgTicket: 0,
        tips: 0,
        earnings: 0,
        rating: workerRatings[wId] || null,
        onTimeRate: null,
        onTimeJobs: 0,
        onTimeTotal: 0,
        jobs: [],
      };
    }
    const s = workerStatsMap[wId];
    s.revenue += b.total_price || 0;
    s.tips += Number(b.tip_amount) || 0;
    s.earnings += calcBookingLaborCost(b);
    s.jobs.push(b);
    if (date >= thirtyDaysAgo) s.jobsLast30 += 1;
    if (date >= thisMonthStart) s.revenueThisMonth += b.total_price || 0;
    const diff = getOnTimeDiff(b);
    if (diff !== null) {
      s.onTimeTotal += 1;
      if (diff <= 15) s.onTimeJobs += 1;
    }
  });
  Object.values(workerStatsMap).forEach(s => {
    s.avgTicket = s.jobs.length > 0 ? s.revenue / s.jobs.length : 0;
    s.onTimeRate = s.onTimeTotal > 0 ? (s.onTimeJobs / s.onTimeTotal) * 100 : null;
    s.jobs.sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
  });

  const workerStatsArr = Object.values(workerStatsMap).sort((a, b) => b.revenue - a.revenue);
  const topPerformerId = workerStatsArr.reduce<{ id: string | null; rev: number }>(
    (acc, w) => (w.revenueThisMonth > acc.rev ? { id: w.workerId, rev: w.revenueThisMonth } : acc),
    { id: null, rev: 0 }
  ).id;
  const workerComparisonData = workerStatsArr
    .map(w => ({ name: w.name, revenue: w.revenueThisMonth }))
    .filter(w => w.revenue > 0);

  // ===== On-time helpers for UI =====
  const onTimeColor = (rate: number | null) => {
    if (rate === null) return "text-muted-foreground";
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-amber-600";
    return "text-destructive";
  };
  const onTimeLabel = (rate: number | null) => rate === null ? "No data" : `${rate.toFixed(0)}% on-time`;
  const onTimeIcon = (diff: number | null) => {
    if (diff === null) return "—";
    if (diff <= 15) return "✅";
    if (diff <= 30) return "⚠️";
    return "❌";
  };

  // ===== CSV Export =====
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escape = (v: any) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const csvContent = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummaryCsv = () => {
    const headers = ["Worker Name", "Jobs Completed", "Revenue Generated", "Avg Ticket", "Tips", "On-Time Rate", "Avg Rating", "Their Total Pay"];
    const rows = workerStatsArr.map(w => [
      w.name,
      w.jobs.length,
      w.revenue.toFixed(2),
      w.avgTicket.toFixed(2),
      w.tips.toFixed(2),
      w.onTimeRate === null ? "No data" : `${w.onTimeRate.toFixed(0)}%`,
      w.rating ? w.rating.avg.toFixed(2) : "",
      w.earnings.toFixed(2),
    ]);
    downloadCsv(`av-detailing-team-summary-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
  };

  const exportFullReportCsv = () => {
    const headers = ["Worker Name", "Date", "Time", "Customer Name", "Package", "Vehicle Type", "Total Price", "Worker Pay", "Tip", "On-Time", "Rating", "Status"];
    const rows: (string | number)[][] = [];
    workerStatsArr.forEach(w => {
      w.jobs.forEach(j => {
        const diff = getOnTimeDiff(j);
        const onTime = diff === null ? "No Data" : (diff <= 15 ? "Yes" : "No");
        rows.push([
          w.name,
          j.scheduled_date,
          j.scheduled_time || "",
          j.guest_name || "",
          j.services?.name || "",
          j.vehicle_type || "",
          (j.total_price || 0).toFixed(2),
          calcBookingLaborCost(j).toFixed(2),
          (Number(j.tip_amount) || 0).toFixed(2),
          onTime,
          j.rating != null ? j.rating : "",
          j.status,
        ]);
      });
    });
    downloadCsv(`av-detailing-team-full-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
  };

  // Drill-down weekly aggregation for selected worker
  const drillStats = drillWorker ? workerStatsMap[drillWorker] : null;
  const drillWeekly = useMemo(() => {
    if (!drillStats || !dateRange?.from || !dateRange?.to) return [];
    const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const weekJobs = drillStats.jobs.filter(j => {
        const d = parseISO(j.scheduled_date);
        return d >= weekStart && d <= weekEnd;
      });
      return {
        date: format(weekStart, "MMM d"),
        jobs: weekJobs.length,
        revenue: weekJobs.reduce((s, j) => s + (j.total_price || 0), 0),
      };
    });
  }, [drillStats, dateRange?.from, dateRange?.to]);

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
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ["week", "This Week"],
                ["month", "This Month"],
                ["30d", "Last 30 Days"],
                ["90d", "Last 90 Days"],
                ["year", "This Year"],
              ] as [RangePreset, string][]).map(([k, label]) => (
                <Button
                  key={k}
                  size="sm"
                  variant={rangePreset === k ? "default" : "outline"}
                  onClick={() => applyPreset(k)}
                >
                  {label}
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant={rangePreset === "custom" ? "default" : "outline"}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(r) => {
                      if (r?.from) {
                        setRangePreset("custom");
                        setDateRange(r);
                      }
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-sm text-muted-foreground">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM d, yyyy")} → ${format(dateRange.to, "MMM d, yyyy")}`
                : "Select a date range"}
            </div>
          </div>
        </CardContent>
      </Card>

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled Bookings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{cancelledBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              ${cancelledLostRevenue.toLocaleString()} lost revenue (6mo)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Labor Cost Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Labor Cost (6mo)</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mb-4">
            {completedWithWorker.length} jobs with assigned workers • Profit margin: {totalRevenue > 0 ? ((1 - totalLaborCost / totalRevenue) * 100).toFixed(1) : "N/A"}%
          </p>
          {Object.keys(workerEarningsMap).length > 0 && (
            <div className="border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setShowLaborBreakdown(v => !v)}
              >
                {showLaborBreakdown ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {showLaborBreakdown ? "Hide" : "View"} Breakdown
              </Button>
              {showLaborBreakdown && (
                <div className="mt-3 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead className="text-right">Jobs</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workerStatsArr.map(w => (
                        <TableRow key={w.workerId}>
                          <TableCell>{w.name}</TableCell>
                          <TableCell className="text-right">{w.jobs.length}</TableCell>
                          <TableCell className="text-right">${w.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${w.earnings.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* ===== Team Performance ===== */}
      {workerStatsArr.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold mb-1">Team Performance</h2>
              <p className="text-sm text-muted-foreground">
                Per-worker stats for the selected date range
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportSummaryCsv}>
                  Export Summary CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportFullReportCsv}>
                  Export Full Report CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {drillStats ? (
            // ========== DRILL-DOWN PANEL ==========
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDrillWorker(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Avatar>
                      <AvatarFallback>{drillStats.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{drillStats.name}</CardTitle>
                      <CardDescription>
                        {dateRange?.from && dateRange?.to
                          ? `${format(dateRange.from, "MMM d, yyyy")} → ${format(dateRange.to, "MMM d, yyyy")}`
                          : ""}
                      </CardDescription>
                    </div>
                    {drillStats.workerId === topPerformerId && (
                      <Badge className="bg-yellow-500 text-yellow-50 hover:bg-yellow-600">
                        <Crown className="h-3 w-3 mr-1" /> Top Performer
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* KPI ROW */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Jobs Completed</p>
                    <p className="text-xl font-bold">{drillStats.jobs.length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-xl font-bold">${drillStats.revenue.toFixed(0)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Avg Ticket</p>
                    <p className="text-xl font-bold">${drillStats.avgTicket.toFixed(0)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Tips Earned</p>
                    <p className="text-xl font-bold text-emerald-600">${drillStats.tips.toFixed(0)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">On-Time Rate</p>
                    <p className={cn("text-xl font-bold", onTimeColor(drillStats.onTimeRate))}>
                      {onTimeLabel(drillStats.onTimeRate)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                    <p className="text-xl font-bold">
                      {drillStats.rating
                        ? <>⭐ {drillStats.rating.avg.toFixed(1)} <span className="text-xs text-muted-foreground">({drillStats.rating.count})</span></>
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* CHARTS */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Jobs per Week</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[220px] w-full">
                        <BarChart data={drillWeekly}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="jobs" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue per Week</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[220px] w-full">
                        <BarChart data={drillWeekly}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* JOBS TABLE */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Their Pay</TableHead>
                        <TableHead className="text-right">Tip</TableHead>
                        <TableHead className="text-center">On-Time</TableHead>
                        <TableHead className="text-center">Rating</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drillStats.jobs.map(j => {
                        const diff = getOnTimeDiff(j);
                        return (
                          <TableRow key={j.id}>
                            <TableCell>{format(parseISO(j.scheduled_date), "MMM d, yyyy")}</TableCell>
                            <TableCell>{j.scheduled_time?.slice(0, 5) || "—"}</TableCell>
                            <TableCell className="max-w-[140px] truncate">{j.guest_name || "—"}</TableCell>
                            <TableCell className="max-w-[140px] truncate">{j.services?.name || "—"}</TableCell>
                            <TableCell>{j.vehicle_type || "—"}</TableCell>
                            <TableCell className="text-right">${(j.total_price || 0).toFixed(0)}</TableCell>
                            <TableCell className="text-right">${calcBookingLaborCost(j).toFixed(0)}</TableCell>
                            <TableCell className="text-right">${(Number(j.tip_amount) || 0).toFixed(0)}</TableCell>
                            <TableCell className="text-center">{onTimeIcon(diff)}</TableCell>
                            <TableCell className="text-center">
                              {j.rating != null ? `⭐ ${j.rating}` : "—"}
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{j.status}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            // ========== WORKER CARDS GRID ==========
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workerStatsArr.map(w => (
                <Card
                  key={w.workerId}
                  className={cn("cursor-pointer transition-shadow hover:shadow-md", w.workerId === topPerformerId ? "border-primary" : "")}
                  onClick={() => setDrillWorker(w.workerId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{w.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{w.name}</CardTitle>
                          {w.rating && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span>{w.rating.avg.toFixed(1)} ({w.rating.count})</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {w.workerId === topPerformerId && (
                        <Badge className="bg-yellow-500 text-yellow-50 hover:bg-yellow-600">
                          <Crown className="h-3 w-3 mr-1" /> Top Performer
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Jobs (30d)</p>
                        <p className="font-bold">{w.jobsLast30}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-bold">${w.revenue.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Ticket</p>
                        <p className="font-bold">${w.avgTicket.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tips</p>
                        <p className="font-bold text-emerald-600">${w.tips.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">On-Time Rate</p>
                        <p className={cn("font-bold", onTimeColor(w.onTimeRate))}>
                          {onTimeLabel(w.onTimeRate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Star Rating</p>
                        <p className="font-bold">{w.rating ? `${w.rating.avg.toFixed(1)} ★` : "N/A"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border mt-2">
                      Click for full breakdown →
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Worker Revenue Comparison */}
          {!drillStats && workerComparisonData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Worker Revenue — This Month</CardTitle>
                <CardDescription>Revenue generated per technician (current month)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={workerComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-primary">Revenue: ${data.revenue.toLocaleString()}</p>
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
          )}
        </div>
      )}
    </div>
  );
}
