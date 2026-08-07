import { supabase } from "@/integrations/supabase/client";

export const OPS_BUCKET = "ops-media";

export type OpsStatus =
  | "assigned"
  | "checked_in"
  | "in_progress"
  | "submitted_for_qc"
  | "rework_required"
  | "approved"
  | "delivered";

export const OPS_STATUS_ORDER: OpsStatus[] = [
  "assigned",
  "checked_in",
  "in_progress",
  "submitted_for_qc",
  "approved",
  "delivered",
];

export const OPS_STATUS_LABELS: Record<OpsStatus, string> = {
  assigned: "Assigned",
  checked_in: "Checked in",
  in_progress: "In progress",
  submitted_for_qc: "Waiting for QC",
  rework_required: "Rework required",
  approved: "Approved",
  delivered: "Delivered",
};

export type OpsPhase = "before" | "during" | "after" | "rework" | "damage";

export const REQUIRED_BEFORE_CATEGORIES = [
  "Front",
  "Rear",
  "Driver side",
  "Passenger side",
  "Interior front",
  "Interior rear",
];

export const REQUIRED_AFTER_CATEGORIES = [
  "Front",
  "Rear",
  "Driver side",
  "Passenger side",
  "Interior front",
  "Interior rear",
];

export const DAMAGE_TYPES = [
  "Scratch",
  "Dent",
  "Paint chip",
  "Cracked glass",
  "Wheel damage",
  "Interior stain",
  "Interior tear",
  "Trim damage",
  "Rust",
  "Other",
];

export interface OpsJob {
  id: string;
  booking_id: string | null;
  job_number: string;
  status: OpsStatus;
  assigned_technician_id: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  odometer: string | null;
  fuel_level: string | null;
  customer_concerns: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  no_prior_damage: boolean;
  marketing_consent: boolean;
  technician_notes: string | null;
  technician_signature: string | null;
  technician_completed_at: string | null;
  qc_notes: string | null;
  qc_reviewed_by: string | null;
  qc_approved_at: string | null;
  rework_notes: string | null;
  rework_count: number;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpsChecklistItem {
  id: string;
  job_id: string;
  item_text: string;
  is_required: boolean;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface OpsDamageEntry {
  id: string;
  job_id: string;
  damage_type: string;
  location_note: string | null;
  note: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface OpsMediaItem {
  id: string;
  job_id: string;
  phase: OpsPhase;
  category: string | null;
  media_type: "photo" | "video";
  storage_path: string;
  caption: string | null;
  manager_approved: boolean;
  created_at: string;
}

/** Booking fields the job screen shows alongside the ops record. */
export interface OpsBookingInfo {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  scheduled_date: string;
  scheduled_time: string;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  total_price: number | null;
  customer_notes: string | null;
  services?: { name: string | null } | null;
}

export interface OpsGate {
  key: string;
  label: string;
  done: boolean;
}

/** Check-in fields a technician must fill before anything else. */
export function checkInComplete(job: OpsJob): boolean {
  return Boolean(
    job.vehicle_year &&
      job.vehicle_make?.trim() &&
      job.vehicle_model?.trim() &&
      job.vehicle_color?.trim() &&
      job.license_plate?.trim() &&
      job.checked_in_at,
  );
}

function categoriesCovered(media: OpsMediaItem[], phase: OpsPhase, required: string[]) {
  const have = new Set(
    media.filter((m) => m.phase === phase).map((m) => (m.category || "").toLowerCase()),
  );
  return required.every((c) => have.has(c.toLowerCase()));
}

/**
 * Single source of truth for the "Submit for QC" gates.
 * Every gate must be done before a technician can hand the job to QC.
 */
export function submitGates(args: {
  job: OpsJob;
  checklist: OpsChecklistItem[];
  damage: OpsDamageEntry[];
  media: OpsMediaItem[];
}): OpsGate[] {
  const { job, checklist, damage, media } = args;
  const requiredItems = checklist.filter((i) => i.is_required);

  return [
    {
      key: "checkin",
      label: "Vehicle check-in completed",
      done: checkInComplete(job),
    },
    {
      key: "damage",
      label: "Existing damage recorded",
      done: damage.length > 0 || job.no_prior_damage,
    },
    {
      key: "before",
      label: `Before photos (${REQUIRED_BEFORE_CATEGORIES.length} angles)`,
      done: categoriesCovered(media, "before", REQUIRED_BEFORE_CATEGORIES),
    },
    {
      key: "checklist",
      label:
        requiredItems.length > 0
          ? `Checklist (${requiredItems.filter((i) => i.is_completed).length}/${requiredItems.length})`
          : "Checklist",
      done: requiredItems.length > 0 && requiredItems.every((i) => i.is_completed),
    },
    {
      key: "after",
      label: `After photos (${REQUIRED_AFTER_CATEGORIES.length} angles)`,
      done: categoriesCovered(media, "after", REQUIRED_AFTER_CATEGORIES),
    },
    {
      key: "signature",
      label: "Technician signature",
      done: Boolean(job.technician_signature),
    },
  ];
}

export function canSubmitForQc(args: Parameters<typeof submitGates>[0]): boolean {
  return submitGates(args).every((g) => g.done);
}

export function missingCategories(
  media: OpsMediaItem[],
  phase: OpsPhase,
  required: string[],
): string[] {
  const have = new Set(
    media.filter((m) => m.phase === phase).map((m) => (m.category || "").toLowerCase()),
  );
  return required.filter((c) => !have.has(c.toLowerCase()));
}

/** Signed URL for a private ops-media object. */
export async function opsMediaUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data } = await supabase.storage.from(OPS_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl || "";
}

export async function opsMediaUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    paths.map(async (p) => {
      out[p] = await opsMediaUrl(p);
    }),
  );
  return out;
}

export function jobVehicleLabel(job: OpsJob): string {
  const parts = [job.vehicle_year, job.vehicle_make, job.vehicle_model]
    .filter(Boolean)
    .join(" ");
  return parts || "Vehicle";
}
