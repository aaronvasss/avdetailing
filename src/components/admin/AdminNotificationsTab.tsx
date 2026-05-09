import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, AlertCircle, Info, TrendingUp, CheckCircle2,
  Loader2, RefreshCw, Bell,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addHours, subHours, subDays } from "date-fns";
import { cn } from "@/lib/utils";

type Severity = "critical" | "warning" | "info" | "success";

export interface AdminAlert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  actionLabel: string;
  targetTab?: string;
}

const ACK_KEY = "admin_alert_ack_v1";
const ACK_TTL_MS = 60 * 60 * 1000; // 1 hour

const readAcks = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(ACK_KEY) || "{}"); } catch { return {}; }
};
const writeAck = (id: string) => {
  const acks = readAcks();
  acks[id] = Date.now();
  localStorage.setItem(ACK_KEY, JSON.stringify(acks));
};
const isAcked = (id: string, acks: Record<string, number>) =>
  !!acks[id] && Date.now() - acks[id] < ACK_TTL_MS;

export async function computeAdminAlerts(): Promise<AdminAlert[]> {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const in2hStr = addHours(now, 2).toISOString();
  const last24hStr = subHours(now, 24).toISOString();
  const last7dStr = format(subDays(now, 7), "yyyy-MM-dd");

  const [
    todaysConfirmed,
    upcoming2h,
    unpaidCompleted,
    expiringQuotes,
    stalePending,
    newBookings,
    noShows,
    thisMonth,
    lastMonth,
  ] = await Promise.all([
    supabase.from("bookings")
      .select("id, scheduled_time, assigned_worker_id, status")
      .eq("scheduled_date", todayStr)
      .eq("status", "confirmed")
      .is("assigned_worker_id", null),
    supabase.from("bookings")
      .select("id, scheduled_date, scheduled_time, assigned_worker_id, status")
      .eq("scheduled_date", todayStr)
      .in("status", ["confirmed", "pending"])
      .is("assigned_worker_id", null),
    supabase.from("bookings")
      .select("id")
      .eq("status", "completed")
      .eq("payment_status", "unpaid"),
    supabase.from("quotes")
      .select("id, expires_at, status")
      .in("status", ["pending", "quoted"])
      .not("expires_at", "is", null)
      .lte("expires_at", addHours(now, 48).toISOString())
      .gte("expires_at", now.toISOString()),
    supabase.from("bookings")
      .select("id, created_at, status")
      .eq("status", "pending")
      .lte("created_at", last24hStr),
    supabase.from("bookings")
      .select("id, created_at")
      .gte("created_at", last24hStr),
    supabase.from("bookings")
      .select("id, scheduled_date, status")
      .eq("status", "no_show")
      .gte("scheduled_date", last7dStr),
    supabase.from("bookings")
      .select("total_price, payment_status")
      .gte("scheduled_date", format(startOfMonth(now), "yyyy-MM-dd"))
      .lte("scheduled_date", format(endOfMonth(now), "yyyy-MM-dd"))
      .in("payment_status", ["paid", "completed"]),
    supabase.from("bookings")
      .select("total_price, payment_status")
      .gte("scheduled_date", format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd"))
      .lte("scheduled_date", format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd"))
      .in("payment_status", ["paid", "completed"]),
  ]);

  const alerts: AdminAlert[] = [];

  // Filter the upcoming-2h list client-side to "next 2 hours" only
  const soonUnassigned = (upcoming2h.data || []).filter((b: any) => {
    const dt = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
    return dt >= now && dt.toISOString() <= in2hStr;
  });

  if (soonUnassigned.length > 0) {
    const first = soonUnassigned[0];
    const t = (first.scheduled_time || "").slice(0, 5);
    alerts.push({
      id: "urgent_unassigned_2h",
      severity: "critical",
      title: soonUnassigned.length === 1 ? `Urgent: job at ${t} has no technician` : `${soonUnassigned.length} jobs in next 2h need a technician`,
      description: "Assign a worker immediately to avoid a missed appointment.",
      actionLabel: "Assign Now",
      targetTab: "calendar",
    });
  }

  if ((todaysConfirmed.data?.length || 0) > 0) {
    alerts.push({
      id: "today_unassigned",
      severity: "critical",
      title: `${todaysConfirmed.data!.length} job${todaysConfirmed.data!.length === 1 ? "" : "s"} today need a technician`,
      description: "Confirmed bookings scheduled for today have no assigned worker.",
      actionLabel: "Assign Now",
      targetTab: "calendar",
    });
  }

  if ((unpaidCompleted.data?.length || 0) > 0) {
    alerts.push({
      id: "unpaid_completed",
      severity: "warning",
      title: `${unpaidCompleted.data!.length} completed job${unpaidCompleted.data!.length === 1 ? "" : "s"} awaiting payment`,
      description: "Send payment reminders to customers with outstanding balances.",
      actionLabel: "Send Reminders",
      targetTab: "bookings",
    });
  }

  if ((expiringQuotes.data?.length || 0) > 0) {
    alerts.push({
      id: "quotes_expiring",
      severity: "warning",
      title: `${expiringQuotes.data!.length} quote${expiringQuotes.data!.length === 1 ? "" : "s"} expire soon`,
      description: "These quotes expire in the next 48 hours — follow up with the customer.",
      actionLabel: "View Quotes",
      targetTab: "quotes",
    });
  }

  if ((stalePending.data?.length || 0) > 0) {
    alerts.push({
      id: "stale_pending",
      severity: "warning",
      title: `${stalePending.data!.length} booking${stalePending.data!.length === 1 ? "" : "s"} waiting for confirmation`,
      description: "Pending more than 24 hours without confirm or deny.",
      actionLabel: "Review Bookings",
      targetTab: "bookings",
    });
  }

  if ((newBookings.data?.length || 0) > 0) {
    alerts.push({
      id: "new_bookings_24h",
      severity: "info",
      title: `${newBookings.data!.length} new booking${newBookings.data!.length === 1 ? "" : "s"} today`,
      description: "Fresh bookings received in the last 24 hours.",
      actionLabel: "View Bookings",
      targetTab: "bookings",
    });
  }

  if ((noShows.data?.length || 0) > 0) {
    alerts.push({
      id: "no_shows_7d",
      severity: "info",
      title: `${noShows.data!.length} no-show${noShows.data!.length === 1 ? "" : "s"} this week`,
      description: "Review no-show bookings from the past 7 days.",
      actionLabel: "View Bookings",
      targetTab: "bookings",
    });
  }

  const sumRev = (rows: any[] | null) => (rows || []).reduce((s, r) => s + Number(r.total_price || 0), 0);
  const tm = sumRev(thisMonth.data);
  const lm = sumRev(lastMonth.data);
  if (lm > 0 && tm > lm) {
    const pct = Math.round(((tm - lm) / lm) * 100);
    alerts.push({
      id: `revenue_up_${format(now, "yyyy-MM")}`,
      severity: "success",
      title: `📈 Revenue is up ${pct}% vs last month`,
      description: `This month: $${tm.toFixed(0)} • Last month: $${lm.toFixed(0)}`,
      actionLabel: "View Analytics",
      targetTab: "analytics",
    });
  }

  return alerts;
}

export async function getActiveAlertCount(): Promise<number> {
  try {
    const alerts = await computeAdminAlerts();
    const acks = readAcks();
    return alerts.filter(a => (a.severity === "critical" || a.severity === "warning") && !isAcked(a.id, acks)).length;
  } catch {
    return 0;
  }
}

const SEVERITY_STYLES: Record<Severity, { border: string; bg: string; icon: React.ElementType; iconColor: string; emoji: string }> = {
  critical: { border: "border-l-destructive", bg: "bg-destructive/5", icon: AlertCircle, iconColor: "text-destructive", emoji: "🔴" },
  warning:  { border: "border-l-yellow-500", bg: "bg-yellow-500/5", icon: AlertTriangle, iconColor: "text-yellow-600", emoji: "🟡" },
  info:     { border: "border-l-blue-500", bg: "bg-blue-500/5", icon: Info, iconColor: "text-blue-600", emoji: "🔵" },
  success:  { border: "border-l-green-500", bg: "bg-green-500/5", icon: TrendingUp, iconColor: "text-green-600", emoji: "🟢" },
};

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export function AdminNotificationsTab({ onNavigateTab }: Props = {}) {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acks, setAcks] = useState<Record<string, number>>(readAcks());

  const load = useCallback(async () => {
    setLoading(true);
    const a = await computeAdminAlerts();
    setAlerts(a);
    setAcks(readAcks());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleAlerts = alerts.filter(a => !isAcked(a.id, acks));

  const handleAction = (alert: AdminAlert) => {
    writeAck(alert.id);
    setAcks(readAcks());
    if (alert.targetTab) onNavigateTab?.(alert.targetTab);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>{visibleAlerts.length} active alert{visibleAlerts.length === 1 ? "" : "s"}</span>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {visibleAlerts.length === 0 ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-12 flex flex-col items-center text-center">
            <div className="rounded-full bg-green-500/10 p-4 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-500">All Clear</h3>
            <p className="text-sm text-muted-foreground mt-1">Everything looks good! No issues found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visibleAlerts.map((alert) => {
            const s = SEVERITY_STYLES[alert.severity];
            const Icon = s.icon;
            return (
              <Card key={alert.id} className={cn("border-l-4", s.border, s.bg)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", s.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">
                      {s.emoji} {alert.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{alert.description}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={alert.severity === "critical" ? "destructive" : "default"}
                    onClick={() => handleAction(alert)}
                    className="flex-shrink-0"
                  >
                    {alert.actionLabel}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
