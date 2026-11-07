import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GOOGLE_REVIEWS_URL } from "./google-business";
import { publicReview, validTotals, type GoogleReview } from "../../supabase/functions/google-reviews/model";
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
  return useQuery({ queryKey: LIVE_GOOGLE_REVIEWS_KEY, staleTime: 5 * 60000, refetchInterval: 60000, retry: false, queryFn: async () => {
    const { data, error } = await supabase.functions.invoke("google-reviews", { body: {} });
    if (error) return null;
    return parseLiveGoogleReviews(data?.cache);
  } });
}