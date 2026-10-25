import { ADMIN_BASE_URL } from "../_shared/owner-notification-config.ts";
import { centralAppointmentLabel, escapeHtml, deliverOwnerAlert, type NoticeDependencies } from "../_shared/owner-alert-delivery.ts";
export { centralAppointmentLabel } from "../_shared/owner-alert-delivery.ts";
export type { NoticeDependencies, NoticeFailure } from "../_shared/owner-alert-delivery.ts";

export interface RescheduleNotice {
  bookingId: string; customerName: string; serviceName: string;
  oldDate: string; oldTime: string; newDate: string; newTime: string; revision: string;
}
export function ownerNoticeContent(n: RescheduleNotice) {
  const adminUrl = `${ADMIN_BASE_URL}?booking=${encodeURIComponent(n.bookingId)}`;
  const oldLabel = centralAppointmentLabel(n.oldDate, n.oldTime);
  const newLabel = centralAppointmentLabel(n.newDate, n.newTime);
  const text = `AV Detailing — Customer rescheduled\nCustomer: ${n.customerName}\nService: ${n.serviceName}\nPrevious: ${oldLabel}\nNew: ${newLabel}\nAppointment is pending confirmation.\nView appointment: ${adminUrl}`;
  const html = `<h1>AV Detailing — Customer rescheduled</h1><p>Customer: ${escapeHtml(n.customerName)}</p><p>Service: ${escapeHtml(n.serviceName)}</p><p>Previous: ${escapeHtml(oldLabel)}</p><p>New: ${escapeHtml(newLabel)}</p><p><strong>Appointment is pending confirmation.</strong></p><p><a href="${escapeHtml(adminUrl)}">View appointment in admin</a></p>`;
  return { text, html, subject: `Appointment rescheduled — ${n.customerName.replace(/[\r\n]/g, " ")} — pending confirmation`, adminUrl };
}

/** Called only by the successful compare-and-set writer. */
export async function notifyRescheduleOwner(n: RescheduleNotice, deps: NoticeDependencies): Promise<void> {
  await deliverOwnerAlert(ownerNoticeContent(n), `reschedule-owner/${n.bookingId}/${n.revision}`, deps);
}
