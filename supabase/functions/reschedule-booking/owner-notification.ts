import { BUSINESS_EMAILS, BUSINESS_PHONES, OWNER_EMAIL_FROM, ADMIN_BASE_URL } from "../_shared/owner-notification-config.ts";

export interface RescheduleNotice {
  bookingId: string; customerName: string; serviceName: string;
  oldDate: string; oldTime: string; newDate: string; newTime: string; revision: string;
}
export interface NoticeFailure { channel: "email" | "sms"; recipient: string; message: string }
export interface NoticeDependencies {
  env: (key: string) => string | undefined;
  fetch: typeof fetch;
  record: (channel: "email" | "sms", recipient: string, status: "sent" | "failed", error?: string) => Promise<void>;
  failure: (failure: NoticeFailure) => Promise<void>;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Date-only fields are Chicago calendar dates, not UTC instants.
export function centralAppointmentLabel(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", year: "numeric" })
    .format(new Date(Date.UTC(year, month - 1, day, 18)));
  const [hour, minute] = time.split(":").map(Number);
  return `${label} at ${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"} Central Time`;
}

export function ownerNoticeContent(n: RescheduleNotice) {
  const adminUrl = `${ADMIN_BASE_URL}?booking=${encodeURIComponent(n.bookingId)}`;
  const oldLabel = centralAppointmentLabel(n.oldDate, n.oldTime);
  const newLabel = centralAppointmentLabel(n.newDate, n.newTime);
  const text = `AV Detailing — Customer rescheduled\nCustomer: ${n.customerName}\nService: ${n.serviceName}\nPrevious: ${oldLabel}\nNew: ${newLabel}\nAppointment is pending confirmation.\nView appointment: ${adminUrl}`;
  const html = `<h1>AV Detailing — Customer rescheduled</h1><p>Customer: ${escapeHtml(n.customerName)}</p><p>Service: ${escapeHtml(n.serviceName)}</p><p>Previous: ${escapeHtml(oldLabel)}</p><p>New: ${escapeHtml(newLabel)}</p><p><strong>Appointment is pending confirmation.</strong></p><p><a href="${escapeHtml(adminUrl)}">View appointment in admin</a></p>`;
  return { text, html, subject: `Appointment rescheduled — ${n.customerName.replace(/[\r\n]/g, " ")} — pending confirmation`, adminUrl };
}

/** Called only by the single successful compare-and-set writer. No automatic SMS retries. */
export async function notifyRescheduleOwner(n: RescheduleNotice, deps: NoticeDependencies): Promise<void> {
  const content = ownerNoticeContent(n);
  for (const channel of ["email", "sms"] as const) {
    const recipients = channel === "email" ? BUSINESS_EMAILS : BUSINESS_PHONES;
    for (const recipient of recipients) {
      try {
        let response: Response;
        if (channel === "email") {
          const key = deps.env("RESEND_API_KEY");
          if (!key) throw new Error("Owner email delivery is not configured (RESEND_API_KEY).");
          response = await deps.fetch("https://api.resend.com/emails", {
            method: "POST", signal: AbortSignal.timeout(10000),
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `reschedule-owner/${n.bookingId}/${n.revision}/email` },
            body: JSON.stringify({ from: OWNER_EMAIL_FROM, to: [recipient], subject: content.subject, html: content.html, text: content.text }),
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
        // Do not log provider bodies: they may contain customer data or credentials.
        if (!response.ok) throw new Error(`Owner ${channel} provider rejected delivery (HTTP ${response.status}).`);
        await deps.record(channel, recipient, "sent");
      } catch (error) {
        const message = error instanceof Error ? error.message : `Owner ${channel} delivery failed.`;
        // Logging failures must never turn a saved reschedule into an apparent failed save.
        await deps.record(channel, recipient, "failed", message).catch(() => undefined);
        await deps.failure({ channel, recipient, message }).catch(() => undefined);
      }
    }
  }
}