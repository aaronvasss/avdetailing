import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessSettings {
  publicBusinessPhone: string;
  publicBusinessPhoneE164: string;
  smsSenderPhone: string;
}

const defaultSettings: BusinessSettings = {
  publicBusinessPhone: "(225) 521-6264",
  publicBusinessPhoneE164: "+12255216264",
  smsSenderPhone: "+12252394617",
};

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("business_settings")
          .select("key, value")
          .in("key", ["public_business_phone", "public_business_phone_e164", "sms_sender_phone"]);

        if (error) {
          console.error("Error fetching business settings:", error);
          return;
        }

        if (data) {
          const settingsMap = data.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {} as Record<string, string>);

          setSettings({
            publicBusinessPhone: settingsMap.public_business_phone || defaultSettings.publicBusinessPhone,
            publicBusinessPhoneE164: settingsMap.public_business_phone_e164 || defaultSettings.publicBusinessPhoneE164,
            smsSenderPhone: settingsMap.sms_sender_phone || defaultSettings.smsSenderPhone,
          });
        }
      } catch (err) {
        console.error("Error fetching business settings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}

// Static getter for edge functions (fetches from DB directly)
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { data, error } = await supabase
    .from("business_settings")
    .select("key, value")
    .in("key", ["public_business_phone", "public_business_phone_e164", "sms_sender_phone"]);

  if (error || !data) {
    return defaultSettings;
  }

  const settingsMap = data.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    publicBusinessPhone: settingsMap.public_business_phone || defaultSettings.publicBusinessPhone,
    publicBusinessPhoneE164: settingsMap.public_business_phone_e164 || defaultSettings.publicBusinessPhoneE164,
    smsSenderPhone: settingsMap.sms_sender_phone || defaultSettings.smsSenderPhone,
  };
}
