import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Clock, MapPin, History } from "lucide-react";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { getCurrentWorkerIdentity } from "@/lib/workerAssignments";
import { SEOHead } from "@/components/seo/SEOHead";
import { WorkerTipLogCard, type WorkerTipRow } from "@/components/worker/WorkerTipLogCard";

import {
  fetchShifts,
  shiftMinutes,
  shiftApprovalStatus,
  sumShiftMinutes,
  sumApprovedShiftMinutes,
  pendingShifts,
  hourlyRateFor,
  payForMinutes,
  formatHours,
  formatDecimalHours,
  type ShiftRecord,
} from "@/lib/worker-pay";

interface ShiftWithLocation extends ShiftRecord {
  clock_in_lat?: number | null;
  clock_in_lng?: number | null;
  clock_out_lat?: number | null;
  clock_out_lng?: number | null;
  notes?: string | null;
}

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export default function WorkerPayPage() {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<ShiftWithLocation[]>([]);
  const [tipBookings, setTipBookings] = useState<any[]>([]);
  const [loggedTips, setLoggedTips] = useState<WorkerTipRow[]>([]);
  const [workerUserId, setWorkerUserId] = useState<string | null>(null);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const identity = await getCurrentWorkerIdentity();
    if (!identity) {
      setShifts([]);
      setTipBookings([]);
      setLoggedTips([]);
      setWorkerUserId(null);
      setWorkerProfile(null);
      setLoading(false);
      return;
    }
    setWorkerUserId(identity.authUserId);

    const { data: wp } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("user_id", identity.authUserId)
      .maybeSingle();
    setWorkerProfile(wp);

    let shiftQuery = supabase
      .from("worker_shifts")
      .select(
        "id, user_id, clock_in_at, clock_out_at, total_minutes, approval_status, approved_at, approved_by, approval_note, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng, notes",
      )
      .order("clock_in_at", { ascending: false });
    if (!identity.isAdmin) shiftQuery = shiftQuery.eq("user_id", identity.authUserId);
    const { data: shiftRows } = await shiftQuery;
    setShifts((shiftRows as ShiftWithLocation[]) || []);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, scheduled_date, tip_amount, assigned_worker_id")
      .eq("status", "completed")
      .order("scheduled_date", { ascending: false });
    setTipBookings(
      identity.isAdmin
        ? bookings || []
        : (bookings || []).filter((b) => b.assigned_worker_id === identity.authUserId),
    );

    const { data: tipRows } = await supabase
      .from("worker_tips")
      .select("id, user_id, tip_date, amount, payment_type, note")
      .eq("user_id", identity.authUserId)
      .order("tip_date", { ascending: false });
    setLoggedTips((tipRows as WorkerTipRow[]) || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("worker-pay-hours")
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_shifts" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);


  const hourlyRate = hourlyRateFor(workerProfile);
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const shiftDay = (s: ShiftRecord) => format(parseISO(s.clock_in_at), "yyyy-MM-dd");

  const currentShifts = useMemo(
    () => shifts.filter((s) => shiftDay(s) >= weekStart && shiftDay(s) <= weekEnd),
    [shifts, weekStart, weekEnd],
  );

  const approvedMins = useMemo(() => sumApprovedShiftMinutes(currentShifts), [currentShifts]);
  const pendingMins = useMemo(() => sumShiftMinutes(pendingShifts(currentShifts)), [currentShifts]);
  const pendingCount = useMemo(() => pendingShifts(currentShifts).length, [currentShifts]);
  const pay = payForMinutes(approvedMins, hourlyRate);
  const tips = useMemo(
    () =>
      tipBookings
        .filter((b) => b.scheduled_date >= weekStart && b.scheduled_date <= weekEnd)
        .reduce((sum, b) => sum + (Number(b.tip_amount) || 0), 0),
    [tipBookings, weekStart, weekEnd],
  );

  const historyMins = useMemo(() => sumApprovedShiftMinutes(shifts), [shifts]);
  const historyTips = useMemo(
    () => tipBookings.reduce((sum, b) => sum + (Number(b.tip_amount) || 0), 0),
    [tipBookings],
  );
  const olderShifts = useMemo(
    () => shifts.filter((s) => shiftDay(s) < weekStart),
    [shifts, weekStart],
  );

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkerLayout>
    );
  }

  const ShiftRow = ({ s }: { s: ShiftWithLocation }) => {
    const status = shiftApprovalStatus(s);
    const mins = shiftMinutes(s);
    const open = !s.clock_out_at;
    return (
      <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {format(parseISO(s.clock_in_at), "EEE, MMM d")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(s.clock_in_at), "h:mm a")} →{" "}
            {open ? (
              <span className="text-amber-500 font-medium">In progress</span>
            ) : (
              format(parseISO(s.clock_out_at!), "h:mm a")
            )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {s.clock_in_lat != null && s.clock_in_lng != null && (
              <a
                href={mapsUrl(s.clock_in_lat, s.clock_in_lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" /> In
              </a>
            )}
            {s.clock_out_lat != null && s.clock_out_lng != null && (
              <a
                href={mapsUrl(s.clock_out_lat, s.clock_out_lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" /> Out
              </a>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold tabular-nums">{mins > 0 ? formatHours(mins) : "—"}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            ${payForMinutes(status === "approved" ? mins : 0, hourlyRate).toFixed(2)}
          </p>
          <span
            className={
              status === "approved"
                ? "text-[11px] font-medium text-primary"
                : status === "rejected"
                ? "text-[11px] text-muted-foreground"
                : "text-[11px] font-medium text-amber-500"
            }
          >
            {status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <WorkerLayout>
      <SEOHead title="Pay & Hours" description="Private page." path="/worker/pay" noIndex />
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Pay &amp; Hours</h1>
          </div>
          <Badge variant="outline" className="text-[11px] font-medium">
            ${hourlyRate.toFixed(2)}/hr
          </Badge>
        </div>

        {/* Current pay period */}
        <Card className="border-primary/25">
          <CardContent className="p-0">
            <div className="px-4 pt-4 pb-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Current pay period · {format(parseISO(weekStart), "MMM d")} –{" "}
                {format(parseISO(weekEnd), "MMM d")}
              </p>
              <p className="text-4xl font-bold tracking-tight mt-1 tabular-nums">
                ${(pay + tips).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatHours(approvedMins)} approved · {formatDecimalHours(approvedMins)} hrs
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              <div className="py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Hourly Pay</p>
                <p className="text-sm font-semibold tabular-nums">${pay.toFixed(2)}</p>
              </div>
              <div className="py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Tips</p>
                <p className="text-sm font-semibold text-emerald-500 tabular-nums">
                  ${tips.toFixed(2)}
                </p>
              </div>
              <div className="py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Pending</p>
                <p className="text-sm font-semibold text-amber-500 tabular-nums">
                  {pendingMins > 0 ? formatHours(pendingMins) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {pendingCount > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <p className="text-xs text-amber-500 font-medium">
              {formatHours(pendingMins)} awaiting approval ({pendingCount} shift
              {pendingCount === 1 ? "" : "s"}) — added to your pay once approved.
            </p>
          </div>
        )}

        {/* This week's shifts */}
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">This week&apos;s shifts</p>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {currentShifts.length}
              </span>
            </div>
            {currentShifts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-5 text-center">
                No shifts logged this week yet.
              </p>
            ) : (
              currentShifts.map((s) => <ShiftRow key={s.id} s={s} />)
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">History</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatHours(historyMins)} approved all time · $
                  {(payForMinutes(historyMins, hourlyRate) + historyTips).toFixed(2)} earned
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-xs"
                onClick={() => setShowHistory((v) => !v)}
              >
                {showHistory ? "Hide" : "View"}
              </Button>
            </div>
            {showHistory && (
              <div className="mt-2">
                {olderShifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No earlier shifts on record.
                  </p>
                ) : (
                  olderShifts.slice(0, 100).map((s) => <ShiftRow key={s.id} s={s} />)
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WorkerLayout>
  );
}
