import { supabase } from "@/integrations/supabase/client";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
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
