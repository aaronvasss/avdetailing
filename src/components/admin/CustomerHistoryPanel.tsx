import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { formatTime12h } from "@/lib/time-format";
import { format } from "date-fns";
import {
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Car,
  Star,
  XCircle,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";

type FilterKey = "all" | "appointments" | "payments" | "notes" | "messages" | "vehicles" | "cancellations";

interface TimelineEvent {
  id: string;
  at: string; // ISO timestamp used for sorting
  kind: Exclude<FilterKey, "all">;
  title: string;
  detail?: string;
  badge?: string;
}

interface CustomerHistoryPanelProps {
  clientId: string;
  email: string | null;
  phone: string | null;
}

const KIND_META: Record<Exclude<FilterKey, "all">, { label: string; icon: typeof Calendar }> = {
  appointments: { label: "Appointment", icon: Calendar },
  payments: { label: "Payment", icon: CreditCard },
  notes: { label: "Internal note", icon: FileText },
  messages: { label: "Message", icon: MessageSquare },
  vehicles: { label: "Vehicle", icon: Car },
  cancellations: { label: "Cancellation", icon: XCircle },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "appointments", label: "Appointments" },
  { key: "payments", label: "Payments" },
  { key: "notes", label: "Notes" },
  { key: "messages", label: "Messages" },
  { key: "vehicles", label: "Vehicles" },
  { key: "cancellations", label: "Cancellations" },
];

const money = (n: number | null | undefined) => `$${(n ?? 0).toFixed(2)}`;

export function CustomerHistoryPanel({ clientId, email, phone }: CustomerHistoryPanelProps) {
  const { isAdmin, isStaff, isLoading: roleLoading } = useRoleCheck();
  const allowed = isAdmin || isStaff;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError(null);
    try {
      // Resolve the linked auth user for this client (email first, then phone)
      let userId: string | null = null;
      if (email) {
        const { data } = await supabase.from("profiles").select("user_id").eq("email", email).maybeSingle();
        userId = data?.user_id ?? null;
      }
      if (!userId && phone) {
        const { data } = await supabase.from("profiles").select("user_id").eq("phone", phone).maybeSingle();
        userId = data?.user_id ?? null;
      }

      // Bookings scoped strictly to this client record (or its linked user / guest contact)
      const { data: byClient } = await supabase
        .from("bookings")
        .select(
          "id, created_at, scheduled_date, scheduled_time, status, payment_status, total_price, tip_amount, vehicle_year, vehicle_make, vehicle_model, vehicle_type, payment_method, updated_at, services(name)"
        )
        .eq("client_id", clientId)
        .order("scheduled_date", { ascending: false })
        .limit(200);

      let bookings = byClient || [];
      if (bookings.length === 0) {
        let q = supabase
          .from("bookings")
          .select(
            "id, created_at, scheduled_date, scheduled_time, status, payment_status, total_price, tip_amount, vehicle_year, vehicle_make, vehicle_model, vehicle_type, payment_method, updated_at, services(name)"
          )
          .order("scheduled_date", { ascending: false })
          .limit(200);
        if (userId) q = q.eq("user_id", userId);
        else if (email) q = q.eq("guest_email", email);
        else if (phone) q = q.eq("guest_phone", phone);
        else q = q.eq("client_id", clientId);
        const { data } = await q;
        bookings = data || [];
      }

      const bookingIds = bookings.map((b) => b.id);

      const [notesRes, msgRes, payRes, vehRes] = await Promise.all([
        bookingIds.length
          ? supabase
              .from("booking_internal_notes")
              .select("id, booking_id, note, created_at")
              .in("booking_id", bookingIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
        bookingIds.length
          ? supabase
              .from("sms_messages")
              .select("id, booking_id, direction, body, created_at, status")
              .in("booking_id", bookingIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
        bookingIds.length
          ? supabase
              .from("payment_records")
              .select("id, booking_id, amount_cents, status, payment_type, created_at")
              .in("booking_id", bookingIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from("customer_vehicles")
          .select("id, vehicle_type, make, model, year, color, license_plate, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      ]);

      const list: TimelineEvent[] = [];

      for (const b of bookings) {
        const when = `${b.scheduled_date}T${(b.scheduled_time || "00:00:00").slice(0, 8)}`;
        const vehicle = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(" ") || b.vehicle_type || "";
        const isCancelled = ["cancelled", "canceled"].includes((b.status || "").toLowerCase());
        list.push({
          id: `booking-${b.id}`,
          at: when,
          kind: isCancelled ? "cancellations" : "appointments",
          title: `${b.services?.name || "Detailing"}${vehicle ? ` — ${vehicle}` : ""}`,
          detail: `${format(new Date(b.scheduled_date + "T00:00:00"), "EEE, MMM d, yyyy")} at ${formatTime12h(
            b.scheduled_time
          )} · ${money(b.total_price)}${b.tip_amount ? ` (+${money(b.tip_amount)} tip)` : ""}`,
          badge: b.status,
        });
      }

      for (const p of (payRes as any).data || []) {
        list.push({
          id: `payment-${p.id}`,
          at: p.created_at,
          kind: "payments",
          title: `${money((p.amount_cents || 0) / 100)} — ${String(p.payment_type || "payment").replace(/_/g, " ")}`,
          detail: p.status ? `Status: ${p.status}` : undefined,
          badge: p.status || undefined,
        });
      }

      for (const n of (notesRes as any).data || []) {
        list.push({ id: `note-${n.id}`, at: n.created_at, kind: "notes", title: n.note });
      }

      for (const m of (msgRes as any).data || []) {
        list.push({
          id: `sms-${m.id}`,
          at: m.created_at,
          kind: "messages",
          title: m.body,
          detail: m.direction === "inbound" ? "Received from customer" : "Sent to customer",
          badge: m.direction,
        });
      }

      for (const v of (vehRes as any).data || []) {
        const name = [v.year, v.make, v.model].filter(Boolean).join(" ") || v.vehicle_type;
        list.push({
          id: `vehicle-${v.id}`,
          at: v.created_at,
          kind: "vehicles",
          title: `Vehicle saved: ${name}`,
          detail: [v.color, v.license_plate].filter(Boolean).join(" · ") || undefined,
        });
      }

      list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setEvents(list);
    } catch (e) {
      console.error("Customer history load failed", e);
      setError("Could not load customer history.");
    } finally {
      setLoading(false);
    }
  }, [allowed, clientId, email, phone]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: events.length };
    for (const e of events) c[e.kind] = (c[e.kind] || 0) + 1;
    return c;
  }, [events]);

  const visible = filter === "all" ? events : events.filter((e) => e.kind === filter);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-2">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Customer history is restricted to admin and staff accounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-4 w-4 text-primary" />
              Customer History
            </CardTitle>
            <CardDescription>
              Chronological timeline of appointments, payments, vehicles, notes, and communications.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{counts[f.key] || 0}</span>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" onClick={load}>
              Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No history to show for this filter.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {visible.map((e) => {
              const meta = KIND_META[e.kind];
              const Icon = meta.icon;
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{meta.label}</span>
                    {e.badge && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {e.badge}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        const d = new Date(e.at);
                        return isNaN(d.getTime()) ? "" : format(d, "MMM d, yyyy · h:mm a");
                      })()}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-0.5 break-words">{e.title}</p>
                  {e.detail && <p className="text-sm text-muted-foreground break-words">{e.detail}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
