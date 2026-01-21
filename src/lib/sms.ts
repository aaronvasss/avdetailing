import { supabase } from "@/integrations/supabase/client";

interface BookingSmsData {
  customerPhone: string;
  customerName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  totalPrice: number;
  bookingId: string;
  notifyBusiness?: boolean;
}

export async function sendBookingSms(data: BookingSmsData) {
  // Don't attempt to send if no phone number
  if (!data.customerPhone) {
    console.log("No phone number provided, skipping SMS");
    return { success: false, error: "No phone number" };
  }

  try {
    const { data: response, error } = await supabase.functions.invoke(
      "send-booking-sms",
      { body: data }
    );

    if (error) {
      console.error("Error sending booking SMS:", error);
      return { success: false, error: error.message };
    }

    return response;
  } catch (err) {
    console.error("SMS send error:", err);
    return { success: false, error: String(err) };
  }
}

interface SendSmsParams {
  to: string;
  message: string;
}

export async function sendSms(params: SendSmsParams) {
  try {
    const { data: response, error } = await supabase.functions.invoke(
      "send-sms",
      { body: params }
    );

    if (error) {
      console.error("Error sending SMS:", error);
      return { success: false, error: error.message };
    }

    return response;
  } catch (err) {
    console.error("SMS send error:", err);
    return { success: false, error: String(err) };
  }
}
