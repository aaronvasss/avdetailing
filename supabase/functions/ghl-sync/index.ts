import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { ghlClient, syncEvent, GhlError } from "../_shared/ghl-sync.ts";
import { loadContext, dbLinks, type QueueItem } from "../_shared/ghl-context.ts";
import { logEdgeError } from "../_shared/error-log.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Scheduler-only worker. Claims leased batches; a GHL outage only delays queued work.
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." });
  const auth = req.headers.get("X-Reminder-Scheduler");
  if (!auth) return reply(401, { error: "Private scheduler authentication required." });
  const { data: cred, error: credErr } = await db.from("portal_scheduler_credentials").select("token").eq("id", true).single();
  if (credErr || !cred || cred.token !== auth) return reply(401, { error: "Private scheduler authentication required." });
  const token = Deno.env.get("GHL_PRIVATE_TOKEN"), location = Deno.env.get("GHL_LOCATION_ID");
  if (!token || !location) return reply(503, { error: "GHL credentials are not configured; work stays queued." });
  const { data: items, error } = await db.rpc("claim_ghl_sync", { _limit: 10 });
  if (error) return reply(500, { error: "Could not claim GHL work; it stays queued." });
  const api = ghlClient(token, location, fetch);
  const links = dbLinks(db);
  const results: Record<string, number> = { sent: 0, retry: 0, failed: 0, skipped: 0 };
  for (const item of (items ?? []) as QueueItem[]) {
    let outcome = "sent", err: string | null = null, contact: string | null = null, opp: string | null = null, retryAfter: number | null = null;
    try {
      const ctx = await loadContext(db, item);
      if (ctx === "skip") { outcome = "skipped"; err = "Record removed or has no email/phone"; }
      else { const r = await syncEvent(api, ctx, links); contact = r.contactId; opp = r.opportunityId; }
    } catch (e) {
      if (e instanceof GhlError) { outcome = e.retryable ? "retry" : "failed"; err = e.message; retryAfter = e.retryAfter; }
      else { outcome = "retry"; err = String((e as Error)?.message ?? e).slice(0, 300); }
      console.error(`GHL sync ${item.kind} failed: ${err}`);
    }
    await db.rpc("finish_ghl_sync", { _id: item.id, _lease_id: item.lease_id, _outcome: outcome, _error: err, _contact: contact, _opportunity: opp, _retry_after_seconds: retryAfter });
    results[outcome]++;
    if (outcome === "failed") await logEdgeError({ functionName: "ghl-sync", code: "GHL_SYNC_FAILED", message: err ?? "GHL sync failed", bookingId: item.booking_id, context: { kind: item.kind } }).catch(() => undefined);
  }
  return reply(200, results);
});
