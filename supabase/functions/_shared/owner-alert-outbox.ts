import { BUSINESS_EMAILS, BUSINESS_PHONES } from "./owner-notification-config.ts";

export interface OwnerChange {
  booking: { id: string; updated_at: string; scheduled_date: string; scheduled_time: string; status: string };
  userId: string | null; manageToken?: string; kind: "reschedule" | "cancellation";
  newDate?: string; newTime?: string; notes?: string;
  content: { subject: string; html: string; text: string };
}

/** Mutation and outbox insertion share one transaction; never fall back to a separate booking write. */
export async function commitOwnerChange(db: any, change: OwnerChange): Promise<boolean> {
  const { booking: b } = change;
  const { data, error } = await db.rpc("commit_owner_appointment_change", {
    _booking_id: b.id, _expected_updated_at: b.updated_at, _expected_date: b.scheduled_date,
    _expected_time: b.scheduled_time, _expected_status: b.status, _user_id: change.userId,
    _manage_token: change.manageToken || null, _kind: change.kind,
    _new_date: change.newDate || b.scheduled_date, _new_time: change.newTime || b.scheduled_time,
    _notes: change.notes || null, _content: { subject: change.content.subject, html: change.content.html, text: change.content.text },
    _email_recipients: BUSINESS_EMAILS, _sms_recipients: BUSINESS_PHONES,
  });
  if (error) throw error;
  return data?.changed === true;
}