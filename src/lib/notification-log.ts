import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, addHours } from "date-fns";

export type NotificationType =
  | "payment_reminder_sms"
  | "payment_reminder_email"
  | "reschedule_notification"
  | "quote_followup"
  | "tip_request";

export const COOLDOWN_HOURS: Record<NotificationType, number> = {
  payment_reminder_sms: 24,
  payment_reminder_email: 24,
  reschedule_notification: 1,
  quote_followup: 48,
  tip_request: 24,
};

export interface RecentNotification {
  id: string;
  created_at: string;
}

/**
 * Returns the most recent matching notification within the cooldown window,
 * or null if none exists (i.e., it's safe to send).
 */
export async function checkRecentNotification(
  bookingId: string,
  notificationType: NotificationType,
  cooldownHours: number = COOLDOWN_HOURS[notificationType]
): Promise<RecentNotification | null> {
  const cutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("booking_notification_log")
    .select("id, created_at")
    .eq("booking_id", bookingId)
    .eq("notification_type", notificationType)
    .eq("status", "sent")
    .gt("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("checkRecentNotification error:", error);
    return null;
  }
  return data as RecentNotification | null;
}

export async function logNotification(params: {
  bookingId: string;
  notificationType: NotificationType;
  recipient: string;
  status: "sent" | "failed";
  errorMessage?: string;
}): Promise<void> {
  const { error } = await supabase.from("booking_notification_log").insert({
    booking_id: params.bookingId,
    notification_type: params.notificationType,
    recipient: params.recipient,
    status: params.status,
    error_message: params.errorMessage ?? null,
  });
  if (error) console.warn("logNotification error:", error);
}

export function formatBlockedToast(
  customerName: string,
  recent: RecentNotification,
  cooldownHours: number
): string {
  const sentAt = new Date(recent.created_at);
  const nextAvailable = addHours(sentAt, cooldownHours);
  return `Reminder already sent to ${customerName} on ${format(
    sentAt,
    "MMM d 'at' h:mm a"
  )}. Next reminder available after ${format(nextAvailable, "MMM d 'at' h:mm a")}.`;
}

/** Get latest payment reminder timestamp for each booking (sms or email). */
export async function fetchLatestPaymentReminders(
  bookingIds: string[]
): Promise<Record<string, string>> {
  if (bookingIds.length === 0) return {};
  const { data } = await supabase
    .from("booking_notification_log")
    .select("booking_id, created_at")
    .in("booking_id", bookingIds)
    .in("notification_type", ["payment_reminder_sms", "payment_reminder_email"])
    .eq("status", "sent")
    .order("created_at", { ascending: false });
  const out: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    if (!out[row.booking_id]) out[row.booking_id] = row.created_at;
  });
  return out;
}

/** Renders a friendly "Last reminder" string for the bookings table. */
export function describeLastReminder(iso: string | undefined | null): {
  text: string;
  variant: "amber" | "muted" | "none";
} {
  if (!iso) return { text: "", variant: "none" };
  const sent = new Date(iso);
  const hoursAgo = (Date.now() - sent.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 24) {
    return { text: `Reminded today at ${format(sent, "h:mm a")}`, variant: "amber" };
  }
  if (hoursAgo <= 24 * 7) {
    return { text: `Last reminded ${formatDistanceToNow(sent, { addSuffix: true })}`, variant: "muted" };
  }
  return { text: `Last reminded ${format(sent, "MMM d")}`, variant: "muted" };
}
