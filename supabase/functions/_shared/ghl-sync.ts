// GoHighLevel (API v2) one-way sync: pure mapping + API client. No Deno globals, so vitest can exercise it with a mocked fetch.
import { appointmentLinks } from "./appointment-links.ts";

export const GHL_BASE = "https://services.leadconnectorhq.com";
export const GHL_VERSION = "2021-07-28";
export const GHL_PIPELINE = "AV Detailing";
export const GHL_STAGES = ["New Lead", "Quoted", "Booked", "Paid", "Completed", "Review Requested", "Maintenance Member", "Lost/Cancelled"] as const;
export type GhlStage = (typeof GHL_STAGES)[number];
const LOST_RANK = 99;
export const stageRank = (s: GhlStage) => (s === "Lost/Cancelled" ? LOST_RANK : GHL_STAGES.indexOf(s));

export const GHL_FIELD_KEYS = [
  "av_next_appointment", "av_next_appointment_iso", "av_service", "av_vehicle_type", "av_vehicle", "av_service_city",
  "av_manage_link", "av_last_service_date", "av_last_service_type", "av_lifetime_spend", "av_completed_visits",
  "av_membership_status", "av_utm_source", "av_utm_medium", "av_utm_campaign",
] as const;
export type GhlFieldKey = (typeof GHL_FIELD_KEYS)[number];

export type SyncBooking = {
  id: string; status: string; payment_status?: string | null; scheduled_date: string; scheduled_time: string;
  total_price?: number | string | null; manage_token?: string | null; membership_id?: string | null;
  service_slug?: string | null; service_name?: string | null; package_name?: string | null;
  vehicle_type?: string | null; vehicle_year?: number | null; vehicle_make?: string | null; vehicle_model?: string | null;
  boat_brand?: string | null; boat_length?: string | null; aircraft_type?: string | null; service_city?: string | null;
  has_rating?: boolean;
};
export type SyncPerson = { email?: string | null; phone?: string | null; name?: string | null };
export type SyncContext = {
  kind: string; person: SyncPerson; booking?: SyncBooking | null; history: SyncBooking[];
  membershipActive: boolean; membershipEver: boolean; fullRefund?: boolean; inquiry?: boolean; today: string;
};

const ACTIVE = ["pending", "confirmed", "pending_payment", "in_progress"];
const money = (v: unknown) => Math.round(Number(v || 0) * 100) / 100;

export function centralLabel(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${day} ${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"} CT`;
}

export function serviceTags(b: SyncBooking | null | undefined): string[] {
  const s = `${b?.service_slug ?? ""} ${b?.service_name ?? ""}`.toLowerCase();
  const tags: string[] = [];
  if (s.includes("ceramic")) tags.push("ceramic-client");
  if (s.includes("boat")) tags.push("boat");
  if (/\brv\b|rv-|motorhome/.test(s)) tags.push("rv");
  if (s.includes("aircraft") || s.includes("aviation")) tags.push("aviation");
  if (s.includes("paint")) tags.push("paint-correction");
  return tags;
}

const vehicleText = (b: SyncBooking) =>
  [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(" ") ||
  [b.boat_brand, b.boat_length].filter(Boolean).join(" ") || b.aircraft_type || "";

export function normalizePhone(p?: string | null): string | null {
  const d = String(p ?? "").replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export function splitName(name?: string | null) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/** Contact custom fields. Only data GHL needs for follow-ups: no card data, notes, staff info or raw tokens. */
export function contactFields(ctx: SyncContext): Record<GhlFieldKey, string | number | null> {
  const upcoming = ctx.history.filter(b => ACTIVE.includes(b.status) && b.scheduled_date >= ctx.today)
    .sort((a, b) => (a.scheduled_date + a.scheduled_time).localeCompare(b.scheduled_date + b.scheduled_time));
  const completed = ctx.history.filter(b => b.status === "completed")
    .sort((a, b) => (b.scheduled_date + b.scheduled_time).localeCompare(a.scheduled_date + a.scheduled_time));
  const next = upcoming[0] ?? null;
  const focus = next ?? ctx.booking ?? completed[0] ?? null;
  const last = completed[0] ?? null;
  return {
    av_next_appointment: next ? centralLabel(next.scheduled_date, next.scheduled_time) : "",
    av_next_appointment_iso: next ? next.scheduled_date : "",
    av_service: focus ? [focus.service_name, focus.package_name].filter(Boolean).join(" — ") : "",
    av_vehicle_type: focus?.vehicle_type ?? "",
    av_vehicle: focus ? vehicleText(focus) : "",
    av_service_city: focus?.service_city ?? "",
    av_manage_link: next ? appointmentLinks(next).manage : "",
    av_last_service_date: last?.scheduled_date ?? "",
    av_last_service_type: last ? [last.service_name, last.package_name].filter(Boolean).join(" — ") : "",
    av_lifetime_spend: money(completed.reduce((t, b) => t + Number(b.total_price || 0), 0)),
    av_completed_visits: completed.length,
    av_membership_status: ctx.membershipActive ? "active" : ctx.membershipEver ? "cancelled" : "none",
    av_utm_source: null, av_utm_medium: null, av_utm_campaign: null, // Phase 1: left empty by owner decision.
  };
}

export function contactTags(ctx: SyncContext): string[] {
  const t = new Set<string>();
  if (ctx.inquiry) t.add("lead");
  if (ctx.history.length || ctx.booking) t.add("customer");
  if (ctx.membershipActive) t.add("member");
  for (const b of [ctx.booking, ...ctx.history]) serviceTags(b).forEach(x => t.add(x));
  if (ctx.kind === "cancelled") t.add("cancelled");
  if (ctx.kind === "refund") t.add("refunded");
  return [...t];
}

/** Stage derived from current booking state, so retries and late events land consistently. */
export function bookingStage(b: SyncBooking, ctx: Pick<SyncContext, "membershipActive" | "fullRefund">): GhlStage {
  if (b.status === "cancelled" || ctx.fullRefund) return "Lost/Cancelled";
  if (b.status === "completed") {
    if (b.membership_id && ctx.membershipActive) return "Maintenance Member";
    return b.has_rating ? "Review Requested" : "Completed";
  }
  if (["paid", "deposit_paid", "partially_paid"].includes(String(b.payment_status))) return "Paid";
  return "Booked";
}

/** Forward-only, except moving to Lost/Cancelled. Returns null when the current stage must be kept. */
export function nextStage(current: number | null | undefined, target: GhlStage): GhlStage | null {
  const r = stageRank(target);
  if (current == null) return target;
  if (current === LOST_RANK) return null;
  if (r === LOST_RANK) return target;
  return r > current ? target : null;
}

export class GhlError extends Error {
  constructor(public status: number, public body: string, public retryAfter: number | null) { super(`[${status}]: ${body.slice(0, 300)}`); }
  get retryable() { return this.status === 0 || this.status === 429 || this.status >= 500; }
}

export type Links = {
  get(key: string): Promise<{ ghl_id: string; stage_rank: number | null } | null>;
  set(key: string, id: string, rank?: number | null): Promise<void>;
  remove(key: string): Promise<void>;
};

export function ghlClient(token: string, locationId: string, fetcher: typeof fetch) {
  const call = async (method: string, path: string, body?: unknown) => {
    let res: Response;
    try {
      res = await fetcher(`${GHL_BASE}${path}`, { method, headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION, Accept: "application/json", "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (e) { throw new GhlError(0, String((e as Error)?.message ?? e), null); }
    const text = await res.text();
    if (!res.ok) throw new GhlError(res.status, text, Number(res.headers.get("Retry-After")) || null);
    return text ? JSON.parse(text) : {};
  };
  let setup: Promise<{ fields: Map<string, string>; pipelineId: string; stages: Map<string, string> }> | null = null;
  const loadSetup = () => setup ??= (async () => {
    const f = await call("GET", `/locations/${locationId}/customFields`);
    const fields = new Map<string, string>();
    for (const cf of f.customFields ?? []) {
      const key = String(cf.fieldKey ?? "").replace(/^contact\./, "") || String(cf.name ?? "");
      if ((GHL_FIELD_KEYS as readonly string[]).includes(key)) fields.set(key, cf.id);
      else if ((GHL_FIELD_KEYS as readonly string[]).includes(String(cf.name))) fields.set(String(cf.name), cf.id);
    }
    const p = await call("GET", `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`);
    const pipeline = (p.pipelines ?? []).find((x: any) => String(x.name).trim() === GHL_PIPELINE);
    if (!pipeline) throw new GhlError(422, `Pipeline "${GHL_PIPELINE}" not found in GHL`, null);
    const stages = new Map<string, string>((pipeline.stages ?? []).map((s: any) => [String(s.name).trim(), s.id]));
    const missing = GHL_STAGES.filter(s => !stages.has(s));
    if (missing.length) throw new GhlError(422, `Pipeline stages missing in GHL: ${missing.join(", ")}`, null);
    return { fields, pipelineId: pipeline.id, stages };
  })().catch(e => { setup = null; throw e; });
  return { call, loadSetup, locationId };
}
export type GhlClient = ReturnType<typeof ghlClient>;

export async function upsertContact(api: GhlClient, ctx: SyncContext, links: Links): Promise<string> {
  const { fields } = await api.loadSetup();
  const email = ctx.person.email?.trim().toLowerCase() || null;
  const phone = normalizePhone(ctx.person.phone);
  if (!email && !phone) throw new GhlError(422, "Contact has no email or phone", null);
  const values = contactFields(ctx);
  const customFields = Object.entries(values).filter(([k, v]) => fields.has(k) && v !== null).map(([k, v]) => ({ id: fields.get(k), field_value: v }));
  // Match by email first, then phone, so one person never becomes two contacts.
  let contactId = (email && (await links.get(`contact:email:${email}`))?.ghl_id) || (phone && (await links.get(`contact:phone:${phone}`))?.ghl_id) || null;
  if (!contactId) {
    for (const [field, value] of [["email", email], ["phone", phone]] as const) {
      if (!value) continue;
      const found = await api.call("GET", `/contacts/search/duplicate?locationId=${encodeURIComponent(api.locationId)}&${field}=${encodeURIComponent(value)}`);
      if (found?.contact?.id) { contactId = found.contact.id; break; }
    }
  }
  const { firstName, lastName } = splitName(ctx.person.name);
  const body: Record<string, unknown> = { customFields };
  if (firstName) body.firstName = firstName;
  if (lastName) body.lastName = lastName;
  if (email) body.email = email;
  if (phone) body.phone = phone;
  if (contactId) await api.call("PUT", `/contacts/${contactId}`, body);
  else contactId = (await api.call("POST", "/contacts/", { ...body, locationId: api.locationId, source: "AV Detailing app" }))?.contact?.id;
  if (!contactId) throw new GhlError(502, "GHL did not return a contact id", null);
  if (email) await links.set(`contact:email:${email}`, contactId);
  if (phone) await links.set(`contact:phone:${phone}`, contactId);
  const tags = contactTags(ctx);
  if (tags.length) await api.call("POST", `/contacts/${contactId}/tags`, { tags });
  return contactId;
}

export async function syncOpportunity(api: GhlClient, ctx: SyncContext, contactId: string, links: Links): Promise<string | null> {
  const { pipelineId, stages } = await api.loadSetup();
  let key: string; let target: GhlStage; let value = 0; let name: string;
  if (ctx.booking) {
    key = `opportunity:booking:${ctx.booking.id}`;
    target = bookingStage(ctx.booking, ctx);
    value = money(ctx.booking.total_price);
    name = `${ctx.person.name || "Customer"} — ${ctx.booking.service_name || "Detail"} ${ctx.booking.scheduled_date}`;
  } else if (ctx.inquiry) {
    key = `opportunity:inquiry:${contactId}`; target = "New Lead"; name = `${ctx.person.name || "Lead"} — Inquiry`;
  } else return null;
  let link = await links.get(key);
  // A contact's open inquiry opportunity becomes their first booking's opportunity instead of a duplicate.
  if (!link && ctx.booking) {
    const lead = await links.get(`opportunity:inquiry:${contactId}`);
    if (lead) { link = lead; await links.remove(`opportunity:inquiry:${contactId}`); }
  }
  const stage = nextStage(link?.stage_rank, target);
  const status = target === "Lost/Cancelled" ? "lost" : "open";
  if (link) {
    const body: Record<string, unknown> = { pipelineId, name, monetaryValue: value };
    if (stage) { body.pipelineStageId = stages.get(stage); body.status = stage === "Lost/Cancelled" ? "lost" : "open"; }
    await api.call("PUT", `/opportunities/${link.ghl_id}`, body);
    await links.set(key, link.ghl_id, stage ? stageRank(stage) : link.stage_rank);
    return link.ghl_id;
  }
  const created = await api.call("POST", "/opportunities/", { pipelineId, locationId: api.locationId, name, pipelineStageId: stages.get(target), status, contactId, monetaryValue: value });
  const id = created?.opportunity?.id ?? created?.id;
  if (!id) throw new GhlError(502, "GHL did not return an opportunity id", null);
  await links.set(key, id, stageRank(target));
  return id;
}

export async function syncEvent(api: GhlClient, ctx: SyncContext, links: Links) {
  const contactId = await upsertContact(api, ctx, links);
  // Membership events update the contact only; they never create an opportunity.
  const opportunityId = ctx.kind.startsWith("membership_") ? null : await syncOpportunity(api, ctx, contactId, links);
  return { contactId, opportunityId };
}
