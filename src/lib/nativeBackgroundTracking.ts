/**
 * Native background geolocation wrapper for Capacitor.
 *
 * On native (iOS/Android via Capacitor), this uses
 * @capacitor-community/background-geolocation to keep receiving GPS pings even
 * when the app is backgrounded or the screen is locked, and writes them to
 * `worker_locations` at most every PING_INTERVAL_MS.
 *
 * On web (or if the plugin/Capacitor is unavailable) all functions become
 * no-ops — the browser-based interval ping in useShiftTracking handles it.
 */
import { supabase } from "@/integrations/supabase/client";

const PING_INTERVAL_MS = 5 * 60 * 1000;

let watcherId: string | null = null;
let lastPingAt = 0;

function isNative(): boolean {
  // @ts-ignore - injected by Capacitor at runtime
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

export async function startBackgroundTracking(params: {
  shiftId: string;
  userId: string;
}): Promise<void> {
  if (!isNative()) return;
  await stopBackgroundTracking();

  try {
    const { registerPlugin } = await import("@capacitor/core");
    const BackgroundGeolocation = registerPlugin<{
      addWatcher(
        options: {
          backgroundMessage?: string;
          backgroundTitle?: string;
          requestPermissions?: boolean;
          stale?: boolean;
          distanceFilter?: number;
        },
        callback: (
          location:
            | { latitude: number; longitude: number; accuracy: number | null }
            | null,
          error: { code: string; message: string } | null,
        ) => void,
      ): Promise<string>;
      removeWatcher(options: { id: string }): Promise<void>;
    }>("BackgroundGeolocation");

    watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage:
          "AV Detailing is tracking your shift location.",
        backgroundTitle: "Shift in progress",
        requestPermissions: true,
        stale: false,
        distanceFilter: 25,
      },
      async (location, error) => {
        if (error) {
          console.warn("[bg-geo] error", error);
          return;
        }
        if (!location) return;
        const now = Date.now();
        if (now - lastPingAt < PING_INTERVAL_MS) return;
        lastPingAt = now;
        try {
          await supabase.from("worker_locations").insert({
            user_id: params.userId,
            shift_id: params.shiftId,
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy ?? null,
          });
        } catch (e) {
          console.warn("[bg-geo] insert failed", e);
        }
      },
    );
  } catch (e) {
    console.warn("[bg-geo] failed to start", e);
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  if (!isNative() || !watcherId) return;
  try {
    const { registerPlugin } = await import("@capacitor/core");
    const BackgroundGeolocation = registerPlugin<{
      removeWatcher(options: { id: string }): Promise<void>;
    }>("BackgroundGeolocation");
    await BackgroundGeolocation.removeWatcher({ id: watcherId });
  } catch (e) {
    console.warn("[bg-geo] failed to stop", e);
  } finally {
    watcherId = null;
    lastPingAt = 0;
  }
}

export function isNativeBackgroundTrackingAvailable(): boolean {
  return isNative();
}
