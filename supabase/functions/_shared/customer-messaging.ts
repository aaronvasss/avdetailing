// Admin switch: when GHL owns customer follow-up messaging, the app skips its non-confirmation customer messages.
// Fails open to the app sending (false) so a read error can never create a messaging gap.
export async function ghlOwnsCustomerMessaging(db: any): Promise<boolean> {
  try {
    const { data, error } = await db.from("ghl_sync_config").select("customer_messaging_via_ghl").eq("id", true).maybeSingle();
    return !error && data?.customer_messaging_via_ghl === true;
  } catch { return false; }
}
