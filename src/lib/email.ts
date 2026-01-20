import { supabase } from "@/integrations/supabase/client";

interface BookingConfirmationData {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  vehicleInfo: string;
  totalPrice: number;
  bookingId: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const { data: response, error } = await supabase.functions.invoke(
    "send-booking-confirmation",
    { body: data }
  );

  if (error) {
    console.error("Error sending booking confirmation:", error);
    throw error;
  }

  return response;
}

export async function sendContactEmail(data: ContactFormData) {
  const { data: response, error } = await supabase.functions.invoke(
    "send-contact-email",
    { body: data }
  );

  if (error) {
    console.error("Error sending contact email:", error);
    throw error;
  }

  return response;
}
