import { OWNER_EMAIL_FROM } from "./owner-notification-config.ts";

export interface AlertDelivery {
  id: string; event_id: string; booking_id: string; kind: string; channel: "email" | "sms";
  recipient: string; content: { text: string; html: string; subject: string }; attempts: number; lease_id: string;
}
export interface AlertOutcome { outcome: "sent" | "retry" | "failed" | "needs_review"; providerId?: string; error?: string }
export interface WorkerDependencies {
  db: any; env: (key: string) => string | undefined; fetch: typeof fetch;
  failure: (bookingId: string, eventId: string, channel: string, message: string) => Promise<void>;
}

export async function sendOwnerAlertDelivery(row: AlertDelivery, deps: Pick<WorkerDependencies, "env" | "fetch">): Promise<AlertOutcome> {
  let response: Response;
  try {
    if (row.channel === "email") {
      const key = deps.env("RESEND_API_KEY");
      if (!key) return { outcome: "failed", error: "Owner email sending is not configured." };
      response = await deps.fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `owner-alert/${row.id}` },
        body: JSON.stringify({ from: OWNER_EMAIL_FROM, to: [row.recipient], ...row.content }),
      });
    } else {
      const sid = deps.env("TWILIO_ACCOUNT_SID"), token = deps.env("TWILIO_AUTH_TOKEN"), from = deps.env("TWILIO_PHONE_NUMBER");
      if (!sid || !token || !from) return { outcome: "failed", error: "Owner SMS sending is not configured." };
      response = await deps.fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: row.recipient, From: from, Body: row.content.text }).toString(),
      });
    }
    // Consume all responses. Never log provider bodies, which may contain private information.
    let result: { id?: string; sid?: string } = {};
    const body = await response.text();
    try { result = JSON.parse(body); } catch { /* Accepted response can lack an identifier. */ }
    if (response.ok) return { outcome: "sent", providerId: row.channel === "email" ? result.id : result.sid };
    const error = `Owner ${row.channel} provider returned HTTP ${response.status}.`;
    if (response.status === 429) return { outcome: "retry", error };
    if (response.status >= 500) return { outcome: row.channel === "email" ? "retry" : "needs_review", error };
    return { outcome: "failed", error };
  } catch {
    // Resend deduplicates a stable request key. Twilio cannot guarantee that a lost response means no send.
    return { outcome: row.channel === "email" ? "retry" : "needs_review", error: `Owner ${row.channel} delivery outcome is uncertain.` };
  }
}

export async function processOwnerAlerts(deps: WorkerDependencies) {
  const { data, error } = await deps.db.rpc("claim_owner_alert_deliveries", { _limit: 10 });
  if (error) throw new Error("Unable to claim owner alerts.");
  let processed = 0;
  for (const row of (data || []) as AlertDelivery[]) {
    const begun = await deps.db.rpc("begin_owner_alert_send", { _id: row.id, _lease_id: row.lease_id });
    if (begun.error) throw new Error("Unable to record owner alert send intent.");
    if (begun.data !== true) continue;
    const result = await sendOwnerAlertDelivery(row, deps);
    const finished = await deps.db.rpc("finish_owner_alert_send", {
      _id: row.id, _lease_id: row.lease_id, _outcome: result.outcome,
      _provider_id: result.providerId || null, _error: result.error || null,
    });
    // Failure to record leaves durable send intent: email recovers with the same key, SMS requires review.
    if (finished.error || finished.data !== true) {
      await deps.failure(row.booking_id, row.event_id, row.channel, "Owner alert result could not be recorded; durable recovery is required.").catch(() => undefined);
      continue;
    }
    processed++;
    if (result.error) await deps.failure(row.booking_id, row.event_id, row.channel, result.error).catch(() => undefined);
  }
  // Disarm after drain; enqueue/tick serialization protects concurrent arrivals.
  const tick = await deps.db.rpc("tick_owner_alert_dispatch");
  if (tick.error) throw new Error("Owner alert retry scheduler requires recovery.");
  return { processed };
}