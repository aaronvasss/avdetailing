import { supabase } from "@/integrations/supabase/client";

interface BookingAddOn {
  name: string;
  price: number;
}

interface BookingConfirmationData {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  serviceState?: string;
  serviceZip?: string;
  vehicleInfo: string;
  vehicleType?: string;
  vehicleSize?: string;
  totalPrice: number;
  bookingId: string;
  basePrice?: number;
  addOns?: BookingAddOn[];
  estimatedDuration?: number;
  customerPhone?: string;
  depositAmount?: number;
  paymentMethod?: string;
  gateCode?: string;
  parkingInstructions?: string;
  manageToken?: string;
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
