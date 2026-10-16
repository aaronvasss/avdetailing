import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { format } from "date-fns";
import { formatTime12h } from "@/lib/time-format";

interface Entry {
  id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

const LABELS: Record<string, string> = {
  status: "Status",
  scheduled_date: "Date",
  scheduled_time: "Time",
  total_price: "Price",
  payment_status: "Payment",
  tip_amount: "Tip",
};

function show(field: string, v: string | null) {
  if (!v) return "none";
  if (field === "scheduled_time") return formatTime12h(v);
  if (field === "scheduled_date") return format(new Date(v + "T12:00:00"), "MMM d, yyyy");
  if (field === "total_price" || field === "tip_amount") return `$${Number(v).toFixed(2)}`;
  return v.replace(/_/g, " ");
}

export function AccountActivity({ userId }: { userId?: string }) {
  const [rows, setRows] = useState<Entry[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("booking_audit_log")
      .select("id, action, field, old_value, new_value, created_at")
      .eq("booking_user_id", userId)
      .neq("field", "assigned_worker_id")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => data && setRows(data as Entry[]));
  }, [userId]);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
              <span>
                {r.action === "created"
                  ? "Appointment booked"
                  : `${LABELS[r.field ?? ""] ?? r.field} changed from ${show(r.field!, r.old_value)} to ${show(r.field!, r.new_value)}`}
              </span>
              <span className="text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "MMM d, h:mm a")}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
