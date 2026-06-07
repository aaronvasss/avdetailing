import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  startBackgroundTracking,
  stopBackgroundTracking,
  isNativeBackgroundTrackingAvailable,
} from "@/lib/nativeBackgroundTracking";

export interface ActiveShift {
  id: string;
  user_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
}

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 30_000,
};

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not available on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

export function useShiftTracking() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const loadState = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const [{ data: wp }, { data: shift }] = await Promise.all([
      supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("worker_shifts")
        .select("id, user_id, clock_in_at, clock_out_at")
        .eq("user_id", user.id)
        .is("clock_out_at", null)
        .order("clock_in_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setProfile(wp);
    setActiveShift(shift || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const grantConsent = useCallback(async () => {
    if (!userId) return false;
    const { error } = await supabase
      .from("worker_profiles")
      .upsert(
        {
          user_id: userId,
          location_consent_at: new Date().toISOString(),
          location_tracking_enabled: true,
        },
        { onConflict: "user_id" }
      );
    if (error) {
      console.error("[shift] grantConsent error", error);
      toast.error("Failed to save consent: " + error.message);
      return false;
    }
    await loadState();
    return true;
  }, [userId, loadState]);

  const recordPing = useCallback(async (shiftId: string, uid: string) => {
    try {
      const pos = await getCurrentPosition();
      await supabase.from("worker_locations").insert({
        user_id: uid,
        shift_id: shiftId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    } catch (err) {
      console.warn("[shift] location ping failed", err);
    }
  }, []);

  // Set up ping interval when there is an active shift.
  // On native (Capacitor) we use background geolocation so pings continue
  // even when the app is closed/backgrounded. On web we fall back to a
  // foreground-only setInterval ping.
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!activeShift || !userId) {
      stopBackgroundTracking();
      return;
    }

    if (isNativeBackgroundTrackingAvailable()) {
      startBackgroundTracking({ shiftId: activeShift.id, userId });
      return () => {
        stopBackgroundTracking();
      };
    }

    const id = window.setInterval(() => {
      recordPing(activeShift.id, userId);
    }, PING_INTERVAL_MS);
    intervalRef.current = id;
    return () => {
      window.clearInterval(id);
    };
  }, [activeShift, userId, recordPing]);

  const clockIn = useCallback(async () => {
    if (!userId) return;
    setWorking(true);
    let coords: { lat: number; lng: number; accuracy: number } | null = null;
    try {
      const pos = await getCurrentPosition();
      coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch (err: any) {
      const msg = err?.code === 1
        ? "Location permission was denied. Please enable location in your browser settings to clock in."
        : "Couldn't get your location. Try again outside.";
      toast.error(msg);
      setWorking(false);
      return;
    }
    const { data, error } = await supabase
      .from("worker_shifts")
      .insert({
        user_id: userId,
        clock_in_lat: coords.lat,
        clock_in_lng: coords.lng,
        clock_in_accuracy: coords.accuracy,
      })
      .select("id, user_id, clock_in_at, clock_out_at")
      .single();
    if (error) {
      toast.error("Failed to clock in: " + error.message);
      setWorking(false);
      return;
    }
    setActiveShift(data);
    // First ping immediately
    await supabase.from("worker_locations").insert({
      user_id: userId,
      shift_id: data.id,
      lat: coords.lat,
      lng: coords.lng,
      accuracy: coords.accuracy,
    });
    toast.success("Clocked in. Have a great shift!");
    setWorking(false);
  }, [userId]);

  const clockOut = useCallback(async () => {
    if (!activeShift || !userId) return;
    setWorking(true);
    let coords: { lat: number; lng: number; accuracy: number } | null = null;
    try {
      const pos = await getCurrentPosition();
      coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch {
      // OK to clock out without final coords
    }
    const now = new Date();
    const startedAt = new Date(activeShift.clock_in_at);
    const totalMinutes = Math.max(
      1,
      Math.round((now.getTime() - startedAt.getTime()) / 60_000)
    );
    const { error } = await supabase
      .from("worker_shifts")
      .update({
        clock_out_at: now.toISOString(),
        clock_out_lat: coords?.lat ?? null,
        clock_out_lng: coords?.lng ?? null,
        clock_out_accuracy: coords?.accuracy ?? null,
        total_minutes: totalMinutes,
      })
      .eq("id", activeShift.id);
    if (error) {
      toast.error("Failed to clock out: " + error.message);
      setWorking(false);
      return;
    }
    setActiveShift(null);
    toast.success(`Clocked out. ${(totalMinutes / 60).toFixed(2)} hours logged.`);
    setWorking(false);
  }, [activeShift, userId]);

  return {
    loading,
    working,
    activeShift,
    hasConsent: Boolean(profile?.location_consent_at && profile?.location_tracking_enabled),
    profile,
    clockIn,
    clockOut,
    grantConsent,
    refresh: loadState,
  };
}
