import { ADMIN_BASE_URL } from "../_shared/owner-notification-config.ts";
import { centralAppointmentLabel, deliverOwnerAlert, escapeHtml, type NoticeDependencies } from "../_shared/owner-alert-delivery.ts";

export interface CancellationNotice {
  bookingId: string; customerName: string; serviceName: string; vehicle: string;
  date: string; time: string; reason: string; revision: string;
}
export function cancellationNoticeContent(n: CancellationNotice) {
  const adminUrl = `${ADMIN_BASE_URL}?booking=${encodeURIComponent(n.bookingId)}`;
  const text = `AV Detailing — Customer cancelled appointment\nCustomer: ${n.customerName}\nService: ${n.serviceName}\nVehicle: ${n.vehicle}\nAppointment: ${centralAppointmentLabel(n.date, n.time)}\nStatus: Cancelled\nReason: ${n.reason || "Not provided"}\nNo automatic refund or deposit change was made.\nView appointment: ${adminUrl}`;
  return { text, html: `<h1>AV Detailing — Customer cancelled appointment</h1><p>${escapeHtml(text).replace(/\n/g, "<br />")}</p><p><a href="${escapeHtml(adminUrl)}">View appointment in admin</a></p>`,
    subject: `Appointment cancelled — ${n.customerName.replace(/[\r\n]/g, " ")}` };
}
export const notifyCancellationOwner = (n: CancellationNotice, deps: NoticeDependencies) =>
  deliverOwnerAlert(cancellationNoticeContent(n), `cancel-owner/${n.bookingId}/${n.revision}`, deps);