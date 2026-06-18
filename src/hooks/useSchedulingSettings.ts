import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SchedulingConfig {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  bufferMinutes: number;
  defaultDuration: number;
  slotInterval: number;
}

const DEFAULT_CONFIG: SchedulingConfig = {
  startHour: 0,
  startMinute: 0,
  endHour: 23,
  endMinute: 59,
  bufferMinutes: 15,
  defaultDuration: 135,
  slotInterval: 30,
};

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

export function useSchedulingSettings() {
  const [config, setConfig] = useState<SchedulingConfig>(DEFAULT_CONFIG);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [settingsRes, blockedRes] = await Promise.all([
          supabase
            .from("business_settings")
            .select("key, value")
            .in("key", [
              "business_hours_start",
              "business_hours_end",
              "buffer_minutes",
              "default_duration",
              "slot_interval",
            ]),
          supabase
            .from("blocked_dates" as any)
            .select("blocked_date")
            .gte("blocked_date", new Date().toISOString().split("T")[0]),
        ]);

        if (settingsRes.data) {
          const map: Record<string, string> = {};
          settingsRes.data.forEach((r: any) => {
            map[r.key] = r.value;
          });

          const start = map.business_hours_start ? parseTime(map.business_hours_start) : { hour: DEFAULT_CONFIG.startHour, minute: DEFAULT_CONFIG.startMinute };
          const end = map.business_hours_end ? parseTime(map.business_hours_end) : { hour: DEFAULT_CONFIG.endHour, minute: DEFAULT_CONFIG.endMinute };

          setConfig({
            startHour: start.hour,
            startMinute: start.minute,
            endHour: end.hour,
            endMinute: end.minute,
            bufferMinutes: map.buffer_minutes ? parseInt(map.buffer_minutes) : DEFAULT_CONFIG.bufferMinutes,
            defaultDuration: map.default_duration ? parseInt(map.default_duration) : DEFAULT_CONFIG.defaultDuration,
            slotInterval: map.slot_interval ? parseInt(map.slot_interval) : DEFAULT_CONFIG.slotInterval,
          });
        }

        if (blockedRes.data) {
          setBlockedDates((blockedRes.data as any[]).map((d: any) => d.blocked_date));
        }
      } catch (err) {
        console.error("Error fetching scheduling settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    return blockedDates.includes(dateStr);
  };

  return { config, blockedDates, isDateBlocked, loading };
}
