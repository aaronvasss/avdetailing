import { supabase } from "@/integrations/supabase/client";

/**
 * Sends an "In Progress" SMS to the customer when their booking status
 * changes to in_progress. Includes dedup check (only sends once per booking).
 */
export async function sendInProgressSms(bookingId: string): Promise<void> {
  try {
    // Fetch booking with sms_sent flag and customer details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, guest_name, guest_phone, user_id, customer_notes")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error("Failed to fetch booking for in-progress SMS:", error);
      return;
    }

    // Check dedup flag via a separate query since in_progress_sms_sent may not be in types yet
    const { data: rawBooking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if ((rawBooking as any)?.in_progress_sms_sent) {
      console.log("In-progress SMS already sent for this booking, skipping.");
      return;
    }

    // Get customer phone - check profile if user_id exists
    let phone = booking.guest_phone;
    let firstName = booking.guest_name?.split(" ")[0] || "there";

    if (booking.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", booking.user_id)
        .maybeSingle();
      if (profile?.phone) phone = profile.phone;
      if (profile?.full_name) firstName = profile.full_name.split(" ")[0];
    }

    if (!phone) {
      console.log("No phone number for booking, skipping in-progress SMS.");
      return;
    }

    // Send SMS via the send-sms edge function
    const message = `Hi ${firstName}! 🚗✨ Great news — we are currently working on your vehicle! Sit back and relax, we'll let you know as soon as we're done. — AV Detailing Team`;

    const { data: smsResult, error: smsError } = await supabase.functions.invoke(
      "send-sms",
      { body: { to: phone, message } }
    );

    if (smsError) {
      console.error("Failed to send in-progress SMS:", smsError);
      return;
    }

    // Mark as sent (dedup)
    await supabase
      .from("bookings")
      .update({ in_progress_sms_sent: true } as any)
      .eq("id", bookingId);

    console.log("In-progress SMS sent successfully for booking:", bookingId);
  } catch (err) {
    console.error("Error in sendInProgressSms:", err);
  }
}
