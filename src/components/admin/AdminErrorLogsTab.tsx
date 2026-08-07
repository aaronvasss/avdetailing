import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Bug } from "lucide-react";

interface ErrorLogRow {
  id: string;
  occurred_at: string;
  source: string;
  severity: string;
  code: string | null;
  message: string;
  function_name: string | null;
  route: string | null;
  url: string | null;
  user_agent: string | null;
  user_id: string | null;
  booking_id: string | null;
  error_id: string | null;
  stack: string | null;
  context: Record<string, unknown> | null;
  resolved_at: string | null;
}

const RANGES = [
  { value: "24h", label: "Last 24 hours", hours: 24 },
  { value: "7d", label: "Last 7 days", hours: 24 * 7 },
  { value: "30d", label: "Last 30 days", hours: 24 * 30 },
];

const severityVariant = (severity: string) => {
  if (severity === "fatal" || severity === "error") return "destructive" as const;
  if (severity === "warning") return "secondary" as const;
  return "outline" as const;
};

export function AdminErrorLogsTab() {
  const [logs, setLogs] = useState<ErrorLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");

  const fetchLogs = async () => {
    setLoading(true);
    const hours = RANGES.find((r) => r.value === range)?.hours ?? 168;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from("app_error_logs")
      .select("*")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(300);

    if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
    if (statusFilter === "open") query = query.is("resolved_at", null);
    if (statusFilter === "resolved") query = query.not("resolved_at", "is", null);

    const { data, error } = await query;
    if (error) {
      toast.error("Could not load error logs", { description: error.message });
      setLogs([]);
    } else {
      setLogs((data || []) as unknown as ErrorLogRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const frontend = logs.filter((l) => l.source === "frontend").length;
    const edge = logs.filter((l) => l.source !== "frontend").length;
    const bookingFailures = logs.filter(
      (l) =>
        l.code === "booking_not_found" ||
        /booking|checkout|payment/i.test(l.message) ||
        (l.function_name || "").includes("checkout"),
    ).length;
    return { total, frontend, edge, bookingFailures };
  }, [logs]);

  const grouped = useMemo(() => {
    const map = new Map<string, ErrorLogRow[]>();
    for (const log of logs) {
      const key = `${log.code || log.function_name || log.source}::${log.message}`;
      const list = map.get(key) || [];
      list.push(log);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, items, latest: items[0], count: items.length }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  const resolveGroup = async (items: ErrorLogRow[]) => {
    const ids = items.filter((i) => !i.resolved_at).map((i) => i.id);
    if (!ids.length) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("app_error_logs")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: sessionData.session?.user?.id ?? null,
      })
      .in("id", ids);
    if (error) {
      toast.error("Could not mark as resolved", { description: error.message });
      return;
    }
    toast.success(`Marked ${ids.length} entr${ids.length === 1 ? "y" : "ies"} resolved`);
    void fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {stats.bookingFailures > 0 && statusFilter === "open" && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">
              {stats.bookingFailures} booking / payment failure
              {stats.bookingFailures === 1 ? "" : "s"} in this window
            </p>
            <p className="text-muted-foreground">
              Expand an entry below to see the route, booking ID and stack trace.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="frontend">Website</SelectItem>
            <SelectItem value="edge">Server functions</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => void fetchLogs()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total errors", value: stats.total, icon: Bug },
          { label: "Website", value: stats.frontend, icon: AlertTriangle },
          { label: "Server functions", value: stats.edge, icon: AlertTriangle },
          { label: "Booking / payment", value: stats.bookingFailures, icon: ShieldAlert },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Log groups */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <p className="font-medium">No errors logged in this window</p>
          <p className="text-sm text-muted-foreground">
            Website and server function failures will appear here automatically.
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {grouped.map((group) => (
            <AccordionItem
              key={group.key}
              value={group.key}
              className="border rounded-lg px-4 bg-card"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-2 text-left pr-2">
                  <Badge variant={severityVariant(group.latest.severity)}>
                    {group.latest.severity}
                  </Badge>
                  <Badge variant="outline">
                    {group.latest.source === "frontend" ? "Website" : "Server"}
                  </Badge>
                  {group.latest.code && (
                    <code className="text-xs text-muted-foreground">{group.latest.code}</code>
                  )}
                  <span className="text-sm font-medium truncate max-w-full">
                    {group.latest.message}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                    ×{group.count} · {new Date(group.latest.occurred_at).toLocaleString()}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void resolveGroup(group.items)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark resolved
                  </Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {group.items.slice(0, 25).map((item) => (
                    <div key={item.id} className="rounded-md border p-3 text-xs space-y-1">
                      <p className="text-muted-foreground">
                        {new Date(item.occurred_at).toLocaleString()}
                        {item.resolved_at && " · resolved"}
                      </p>
                      {item.function_name && <p>Function: {item.function_name}</p>}
                      {item.route && <p>Route: {item.route}</p>}
                      {item.booking_id && <p>Booking: {item.booking_id}</p>}
                      {item.error_id && <p>Error ID: {item.error_id}</p>}
                      {item.user_id && <p>User: {item.user_id}</p>}
                      {item.context && Object.keys(item.context).length > 0 && (
                        <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                          {JSON.stringify(item.context, null, 2)}
                        </pre>
                      )}
                      {item.stack && (
                        <pre className="whitespace-pre-wrap break-all text-muted-foreground max-h-40 overflow-y-auto">
                          {item.stack}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
