import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OpsJob, OpsStatus } from "@/lib/ops-workflow";

const db = supabase as any;

export interface OpsJobListItem extends OpsJob {
  booking?: {
    guest_name: string | null;
    guest_phone: string | null;
    scheduled_date: string;
    scheduled_time: string;
    service_address: string | null;
    service_city: string | null;
    services?: { name: string | null } | null;
  } | null;
}

interface Options {
  /** Only jobs assigned to the signed-in technician. */
  mineOnly?: boolean;
  statuses?: OpsStatus[];
  /** Restrict to bookings scheduled on this date (YYYY-MM-DD). */
  date?: string;
}

export function useOpsJobs({ mineOnly, statuses, date }: Options = {}) {
  const [jobs, setJobs] = useState<OpsJobListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = db
        .from("ops_jobs")
        .select(
          "*, booking:bookings(guest_name, guest_phone, scheduled_date, scheduled_time, service_address, service_city, services(name))",
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (statuses?.length) query = query.in("status", statuses);

      if (mineOnly) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setJobs([]);
          return;
        }
        query = query.eq("assigned_technician_id", userData.user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      let rows = (data ?? []) as OpsJobListItem[];
      if (date) rows = rows.filter((j) => j.booking?.scheduled_date === date);

      rows.sort((a, b) => {
        const at = `${a.booking?.scheduled_date ?? ""}${a.booking?.scheduled_time ?? ""}`;
        const bt = `${b.booking?.scheduled_date ?? ""}${b.booking?.scheduled_time ?? ""}`;
        return at.localeCompare(bt);
      });

      setJobs(rows);
    } catch (e) {
      console.error("useOpsJobs load failed", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [mineOnly, date, JSON.stringify(statuses ?? [])]);

  useEffect(() => {
    void load();
  }, [load]);

  return { jobs, loading, reload: load };
}
