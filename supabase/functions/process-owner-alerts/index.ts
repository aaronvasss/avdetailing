import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { processOwnerAlerts } from "../_shared/owner-alert-worker.ts";
import { logEdgeError } from "../_shared/error-log.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." });
  const token = req.headers.get("X-Reminder-Scheduler");
  if (!token) return reply(401, { error: "Private scheduler authentication required." });
  const { data, error } = await db.from("portal_scheduler_credentials").select("token").eq("id", true).single();
  if (error || !data || data.token !== token) return reply(401, { error: "Private scheduler authentication required." });
  try {
    if (!z.object({}).strict().safeParse(await req.json()).success) return reply(400, { error: "Invalid request." });
    const result = await processOwnerAlerts({ db, fetch, env: key => Deno.env.get(key),
      failure: (bookingId, eventId, channel, message) => logEdgeError({ functionName: "process-owner-alerts", bookingId,
        code: "OWNER_ALERT_DELIVERY_FAILED", message, context: { eventId, channel } }),
    });
    return reply(200, result);
  } catch {
    await logEdgeError({ functionName: "process-owner-alerts", code: "OWNER_ALERT_PROCESSING_FAILED", message: "Durable owner alerts remain queued; processing needs recovery." }).catch(() => undefined);
    return reply(500, { error: "Owner alerts remain queued for recovery." });
  }
});