import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { chicagoToday, loadContext } from "../_shared/ghl-context.ts";
import { contactFields, contactTags, bookingStage } from "../_shared/ghl-sync.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const Body = z.object({ mode: z.enum(["dry_run", "run"]) }).strict();
const mask = (e?: string | null) => (e ? e.replace(/^(.).*(@.*)$/, "$1***$2") : null);

// Admin-only. Queues upcoming and completed bookings (never cancelled ones) with stable keys, so re-running is safe.
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." });
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u, error: ue } = await db.auth.getUser(jwt);
  if (ue || !u.user) return reply(401, { error: "Sign in required." });
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin");
  if (!roles?.length) return reply(403, { error: "Admin access required." });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return reply(400, { error: "mode must be dry_run or run" });
  const today = chicagoToday();
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("bookings").select("id,status,scheduled_date")
      .or(`status.eq.completed,and(status.in.(pending,confirmed,pending_payment),scheduled_date.gte.${today})`)
      .order("scheduled_date").range(from, from + 999);
    if (error) return reply(500, { error: "Could not read bookings." });
    ids.push(...(data ?? []).map((r: any) => r.id));
    if (!data || data.length < 1000) break;
  }
  if (parsed.data.mode === "dry_run") {
    const sample = [];
    for (const id of ids.slice(0, 3)) {
      const ctx = await loadContext(db, { id: "dry", kind: "backfill", booking_id: id, contact_id: null, membership_id: null, payment_record_id: null, payload: {}, lease_id: "dry" });
      if (ctx === "skip") continue;
      const f = contactFields(ctx); f.av_manage_link = f.av_manage_link ? "(secure link)" : "";
      sample.push({ email: mask(ctx.person.email), tags: contactTags(ctx), stage: ctx.booking ? bookingStage(ctx.booking, ctx) : null, fields: f });
    }
    return reply(200, { mode: "dry_run", bookings: ids.length, sample });
  }
  let queued = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const rows = ids.slice(i, i + 200).map(id => ({ event_key: `backfill:${id}`, kind: "backfill", booking_id: id }));
    const { data, error } = await db.from("ghl_sync_queue").upsert(rows, { onConflict: "event_key", ignoreDuplicates: true }).select("id");
    if (error) return reply(500, { error: "Backfill stopped; already-queued rows are kept.", queued });
    queued += data?.length ?? 0;
  }
  return reply(200, { mode: "run", bookings: ids.length, newly_queued: queued });
});
