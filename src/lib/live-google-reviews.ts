import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GOOGLE_REVIEWS_URL } from "./google-business";
import { publicReview, validTotals, REVIEW_REFRESH_MS, type GoogleReview } from "../../supabase/functions/google-reviews/model";
export interface LiveGoogleReviews { rating: number; total_review_count: number; reviews: GoogleReview[]; google_maps_uri: string; fetched_at: string; expires_at: string }
export function parseLiveGoogleReviews(value: unknown, now = Date.now()): LiveGoogleReviews | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!validTotals(v.rating, v.total_review_count) || v.google_maps_uri !== GOOGLE_REVIEWS_URL || typeof v.fetched_at !== "string" || typeof v.expires_at !== "string" || !Number.isFinite(Date.parse(v.fetched_at)) || Date.parse(v.fetched_at) > now || !Number.isFinite(Date.parse(v.expires_at)) || Date.parse(v.expires_at) <= now || Date.parse(v.expires_at) - Date.parse(v.fetched_at) > 86400000 || !Array.isArray(v.reviews) || v.reviews.length < 1 || v.reviews.length > 5) return null;
  const reviews = v.reviews.map(publicReview);
  if (reviews.some(r => !r)) return null;
  return { rating: v.rating as number, total_review_count: v.total_review_count as number, reviews: reviews.filter((r): r is GoogleReview => r !== null), google_maps_uri: v.google_maps_uri, fetched_at: v.fetched_at, expires_at: v.expires_at };
}
export const LIVE_GOOGLE_REVIEWS_KEY = ["live-google-reviews"];
export function useLiveGoogleReviews() {
  const query = useQuery({ queryKey: LIVE_GOOGLE_REVIEWS_KEY, staleTime: REVIEW_REFRESH_MS, retry: false, refetchInterval: q => q.state.data ? Math.max(30000, Math.min(REVIEW_REFRESH_MS, Date.parse(q.state.data.fetched_at) + REVIEW_REFRESH_MS - Date.now())) : 60000, queryFn: async () => {
    const { data, error } = await supabase.functions.invoke("google-reviews", { body: {} });
    if (error) throw error;
    return parseLiveGoogleReviews(data?.cache);
  } });
  const expiresAt = query.data?.fetched_at;
  const refetch = query.refetch;
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setTimeout(() => { void refetch(); }, Math.max(30000, Date.parse(expiresAt) + REVIEW_REFRESH_MS - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expiresAt, refetch]);
  return query;
}