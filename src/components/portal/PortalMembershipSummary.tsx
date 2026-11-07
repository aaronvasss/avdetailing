import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgePercent, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { parseDateString } from "@/lib/time-format";

interface Row { id: string; status: string; next_service_date: string | null; membership_plans: { name: string; frequency: string } | null }

/** Read-only membership summary for the portal home. */
export function PortalMembershipSummary({ userId, onOpen }: { userId?: string; onOpen: () => void }) {
  const [state, setState] = useState<{ loading: boolean; row: Row | null }>({ loading: true, row: null });
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("customer_memberships")
      .select("id, status, next_service_date, membership_plans (name, frequency)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data as unknown as Row[] | null) ?? [];
        setState({ loading: false, row: rows.find(r => r.status === "active") ?? null });
      }, () => !cancelled && setState({ loading: false, row: null }));
    return () => { cancelled = true; };
  }, [userId]);

  if (state.loading) return <div className="h-16 animate-pulse rounded-2xl bg-muted/40 motion-reduce:animate-none" aria-hidden="true" />;
  if (!state.row) {
    return (
      <Link to="/memberships" className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2"><BadgePercent className="h-4 w-4 text-primary" />Save with a membership</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    );
  }
  const r = state.row;
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card p-4 text-left hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wider text-primary">Membership · Active</span>
        <span className="block truncate font-semibold">{r.membership_plans?.name ?? "Membership plan"}</span>
        <span className="block text-sm text-muted-foreground">
          {r.next_service_date ? `Next service ${format(parseDateString(r.next_service_date), "MMM d, yyyy")}` : "Manage your plan"}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
