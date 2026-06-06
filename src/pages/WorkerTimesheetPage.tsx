import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Clock, Download, Calendar as CalendarIcon, MapPin } from "lucide-react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  parseISO, differenceInMinutes,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { formatHm } from "@/lib/duration-format";
import { SEOHead } from "@/components/seo/SEOHead";

type Preset = "week" | "month" | "custom";

interface ShiftRow {
  id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  total_minutes: number | null;
  notes: string | null;
}

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function shiftDateKey(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd");
}

export default function WorkerTimesheetPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [preset, setPreset] = useState<Preset>("week");
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const applyPreset = (p: Preset) => {
    setPreset(p);
    const now = new Date();
    if (p === "week") setRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) });
    else if (p === "month") setRange({ from: startOfMonth(now), to: endOfMonth(now) });
  };

  useEffect(() => {
    if (!range?.from || !range?.to) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setRows([]); setLoading(false); }
        return;
      }
      const fromIso = format(range.from!, "yyyy-MM-dd");
      const toIso = format(range.to!, "yyyy-MM-dd");
      const { data } = await supabase
        .from("worker_shifts")
        .select("id, clock_in_at, clock_out_at, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng, total_minutes, notes")
        .eq("user_id", user.id)
        .gte("clock_in_at", `${fromIso}T00:00:00`)
        .lte("clock_in_at", `${toIso}T23:59:59`)
        .order("clock_in_at", { ascending: false });
      if (!cancelled) setRows((data as ShiftRow[]) || []);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const summary = useMemo(() => {
    let totalMin = 0;
    let completed = 0;
    let inProgress = 0;
    for (const r of rows) {
      if (r.clock_out_at && r.total_minutes != null) {
        totalMin += Number(r.total_minutes);
        completed++;
      } else {
        inProgress++;
      }
    }
    return { totalMin, completed, inProgress, shifts: rows.length };
  }, [rows]);

  const exportCsv = () => {
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["Date", "Clock In", "Clock Out", "Duration", "Clock In Location", "Clock Out Location", "Notes"];
    const dataRows = rows.map(r => {
      const date = format(parseISO(r.clock_in_at), "yyyy-MM-dd");
      const cin = format(parseISO(r.clock_in_at), "h:mm a");
      const cout = r.clock_out_at ? format(parseISO(r.clock_out_at), "h:mm a") : "In Progress";
      const dur = r.total_minutes != null ? formatHm(r.total_minutes) : "—";
      const cinLoc = r.clock_in_lat != null && r.clock_in_lng != null
        ? `${r.clock_in_lat.toFixed(5)}, ${r.clock_in_lng.toFixed(5)}`
        : "—";
      const coutLoc = r.clock_out_lat != null && r.clock_out_lng != null
        ? `${r.clock_out_lat.toFixed(5)}, ${r.clock_out_lng.toFixed(5)}`
        : "—";
      return [date, cin, cout, dur, cinLoc, coutLoc, r.notes || ""];
    });
    const csv = [headers.map(escape).join(","), ...dataRows.map(r => r.map(escape).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-shift-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <WorkerLayout>
      <SEOHead title="Shift Timesheet" description="Private page." path="/worker/timesheet" noIndex />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Shift Timesheet</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={preset === "week" ? "default" : "outline"} onClick={() => applyPreset("week")}>This Week</Button>
              <Button size="sm" variant={preset === "month" ? "default" : "outline"} onClick={() => applyPreset("month")}>This Month</Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
                    <CalendarIcon className="h-4 w-4 mr-1.5" /> Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={(r) => { if (r?.from) { setPreset("custom"); setRange(r); } }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="ml-auto text-xs text-muted-foreground">
                {range?.from && range?.to && `${format(range.from, "MMM d")} → ${format(range.to, "MMM d, yyyy")}`}
              </span>
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
                <Download className="h-4 w-4 mr-1.5" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No shifts in this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="hidden sm:table-cell">Location</TableHead>
                      <TableHead className="hidden md:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => {
                      const isOpen = !r.clock_out_at;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(parseISO(r.clock_in_at), "EEE, MMM d")}
                          </TableCell>
                          <TableCell>{format(parseISO(r.clock_in_at), "h:mm a")}</TableCell>
                          <TableCell>
                            {r.clock_out_at ? format(parseISO(r.clock_out_at), "h:mm a") : (
                              <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                In Progress
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {r.total_minutes != null ? formatHm(r.total_minutes) : "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              {r.clock_in_lat != null && r.clock_in_lng != null && (
                                <a
                                  href={googleMapsUrl(r.clock_in_lat, r.clock_in_lng)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                                  title="Clock-in location"
                                >
                                  <MapPin className="h-3 w-3" /> In
                                </a>
                              )}
                              {r.clock_out_lat != null && r.clock_out_lng != null && (
                                <a
                                  href={googleMapsUrl(r.clock_out_lat, r.clock_out_lng)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary hover:underline"
                                  title="Clock-out location"
                                >
                                  <MapPin className="h-3 w-3" /> Out
                                </a>
                              )}
                              {!r.clock_in_lat && !r.clock_out_lat && "—"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                            {r.notes || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryStat label="Total Shifts" value={String(summary.shifts)} />
          <SummaryStat label="Completed" value={String(summary.completed)} />
          <SummaryStat label="In Progress" value={String(summary.inProgress)} />
          <SummaryStat label="Total Hours" value={formatHm(summary.totalMin)} accent />
        </div>
      </div>
    </WorkerLayout>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-lg font-bold tabular-nums", accent && "text-primary")}>{value}</p>
      </CardContent>
    </Card>
  );
}
