import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  OpsBookingInfo,
  OpsChecklistItem,
  OpsDamageEntry,
  OpsJob,
  OpsMediaItem,
  OpsStatus,
} from "@/lib/ops-workflow";
import { getChecklistItems } from "@/lib/checklists";

const db = supabase as any;

export interface OpsJobBundle {
  job: OpsJob | null;
  booking: OpsBookingInfo | null;
  checklist: OpsChecklistItem[];
  damage: OpsDamageEntry[];
  media: OpsMediaItem[];
}

const EMPTY: OpsJobBundle = {
  job: null,
  booking: null,
  checklist: [],
  damage: [],
  media: [],
};

export function useOpsJob(jobId: string | undefined) {
  const [bundle, setBundle] = useState<OpsJobBundle>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const { data: job, error } = await db
        .from("ops_jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();
      if (error) throw error;
      if (!job) {
        setBundle(EMPTY);
        return;
      }

      const [checklistRes, damageRes, mediaRes, bookingRes] = await Promise.all([
        db.from("ops_job_checklist").select("*").eq("job_id", jobId).order("sort_order"),
        db.from("ops_job_damage").select("*").eq("job_id", jobId).order("created_at"),
        db.from("ops_job_media").select("*").eq("job_id", jobId).order("created_at"),
        job.booking_id
          ? db
              .from("bookings")
              .select(
                "id, guest_name, guest_email, guest_phone, scheduled_date, scheduled_time, service_address, service_city, service_state, service_zip, total_price, customer_notes, services(name)",
              )
              .eq("id", job.booking_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setBundle({
        job: job as OpsJob,
        booking: (bookingRes as any)?.data ?? null,
        checklist: (checklistRes.data ?? []) as OpsChecklistItem[],
        damage: (damageRes.data ?? []) as OpsDamageEntry[],
        media: (mediaRes.data ?? []) as OpsMediaItem[],
      });
    } catch (e: any) {
      console.error("useOpsJob load failed", e);
      toast.error(e.message || "Could not load this job");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateJob = useCallback(
    async (patch: Partial<OpsJob>) => {
      if (!jobId) return false;
      setSaving(true);
      try {
        const { error } = await db.from("ops_jobs").update(patch).eq("id", jobId);
        if (error) throw error;
        await load();
        return true;
      } catch (e: any) {
        console.error("updateJob failed", e);
        toast.error(e.message || "Could not save changes");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [jobId, load],
  );

  const setStatus = useCallback(
    (status: OpsStatus, extra: Partial<OpsJob> = {}) => updateJob({ status, ...extra }),
    [updateJob],
  );

  /** Seed the checklist from the booked service package if it is still empty. */
  const ensureChecklist = useCallback(async () => {
    if (!jobId || bundle.checklist.length > 0) return;
    const serviceName = bundle.booking?.services?.name || "";
    const items = getChecklistItems(serviceName);
    if (items.length === 0) return;
    const rows = items.map((text, index) => ({
      job_id: jobId,
      item_text: text,
      is_required: true,
      sort_order: index,
    }));
    const { error } = await db.from("ops_job_checklist").insert(rows);
    if (error) {
      console.error("ensureChecklist failed", error);
      return;
    }
    await load();
  }, [jobId, bundle.checklist.length, bundle.booking, load]);

  const toggleChecklistItem = useCallback(
    async (itemId: string, completed: boolean) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await db
        .from("ops_job_checklist")
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? userData.user?.id ?? null : null,
        })
        .eq("id", itemId);
      if (error) {
        toast.error("Could not update checklist");
        return;
      }
      setBundle((prev) => ({
        ...prev,
        checklist: prev.checklist.map((i) =>
          i.id === itemId
            ? { ...i, is_completed: completed, completed_at: completed ? new Date().toISOString() : null }
            : i,
        ),
      }));
    },
    [],
  );

  const addChecklistItem = useCallback(
    async (text: string) => {
      if (!jobId || !text.trim()) return;
      const { error } = await db.from("ops_job_checklist").insert({
        job_id: jobId,
        item_text: text.trim(),
        is_required: false,
        sort_order: bundle.checklist.length,
      });
      if (error) {
        toast.error("Could not add item");
        return;
      }
      await load();
    },
    [jobId, bundle.checklist.length, load],
  );

  const addDamage = useCallback(
    async (entry: { damage_type: string; location_note?: string; note?: string; photo_path?: string }) => {
      if (!jobId) return false;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await db.from("ops_job_damage").insert({
        job_id: jobId,
        damage_type: entry.damage_type,
        location_note: entry.location_note || null,
        note: entry.note || null,
        photo_path: entry.photo_path || null,
        recorded_by: userData.user?.id ?? null,
      });
      if (error) {
        toast.error(error.message || "Could not record damage");
        return false;
      }
      await load();
      return true;
    },
    [jobId, load],
  );

  const removeDamage = useCallback(
    async (id: string) => {
      const { error } = await db.from("ops_job_damage").delete().eq("id", id);
      if (error) {
        toast.error("Could not remove entry");
        return;
      }
      await load();
    },
    [load],
  );

  return {
    ...bundle,
    loading,
    saving,
    reload: load,
    updateJob,
    setStatus,
    ensureChecklist,
    toggleChecklistItem,
    addChecklistItem,
    addDamage,
    removeDamage,
  };
}
