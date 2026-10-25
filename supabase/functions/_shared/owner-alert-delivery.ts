import { BUSINESS_EMAILS, BUSINESS_PHONES, OWNER_EMAIL_FROM } from "./owner-notification-config.ts";

export interface NoticeFailure { channel: "email" | "sms"; recipient: string; message: string }
export interface NoticeDependencies {
  env: (key: string) => string | undefined;
  fetch: typeof fetch;
  record: (channel: "email" | "sms", recipient: string, status: "sent" | "failed", error?: string) => Promise<void>;
  failure: (failure: NoticeFailure) => Promise<void>;
}
export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function centralAppointmentLabel(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", year: "numeric" })
    .format(new Date(Date.UTC(year, month - 1, day, 18)));
  const [hour, minute] = time.split(":").map(Number);
  return `${label} at ${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"} Central Time`;
}

/** Only a successful atomic writer may call this; never automatically retry uncertain SMS delivery. */
export async function deliverOwnerAlert(content: { text: string; html: string; subject: string }, key: string, deps: NoticeDependencies) {
  for (const channel of ["email", "sms"] as const) {
    for (const recipient of channel === "email" ? BUSINESS_EMAILS : BUSINESS_PHONES) {
      try {
        let response: Response;
        if (channel === "email") {
          const apiKey = deps.env("RESEND_API_KEY");
          if (!apiKey) throw new Error("Owner email delivery is not configured (RESEND_API_KEY).");
          response = await deps.fetch("https://api.resend.com/emails", {
            method: "POST", signal: AbortSignal.timeout(10000),
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `${key}/email` },
            body: JSON.stringify({ from: OWNER_EMAIL_FROM, to: [recipient], ...content }),
          });
        } else {
          const sid = deps.env("TWILIO_ACCOUNT_SID"), token = deps.env("TWILIO_AUTH_TOKEN"), from = deps.env("TWILIO_PHONE_NUMBER");
          if (!sid || !token || !from) throw new Error("Owner SMS delivery is not configured (Twilio).");
          response = await deps.fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: "POST", signal: AbortSignal.timeout(10000),
            headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ To: recipient, From: from, Body: content.text }).toString(),
          });
        }
        if (!response.ok) throw new Error(`Owner ${channel} provider rejected delivery (HTTP ${response.status}).`);
        await deps.record(channel, recipient, "sent");
      } catch (error) {
        const message = error instanceof Error ? error.message : `Owner ${channel} delivery failed.`;
        await deps.record(channel, recipient, "failed", message).catch(() => undefined);
        await deps.failure({ channel, recipient, message }).catch(() => undefined);
      }
    }
  }
}