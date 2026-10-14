import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const googleUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && (
    (["google.com", "www.google.com"].includes(url.hostname) && url.pathname.startsWith("/maps")) ||
    ["maps.google.com", "g.page", "maps.app.goo.gl"].includes(url.hostname)
  );
}, "Use the original Google review or business profile link.");

export const featuredReviewSchema = z.object({
  reviewer_name: z.string().min(1, "Reviewer name is required.").max(160),
  rating: z.number().int().min(1).max(5),
  review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the original review date.").refine((v) => {
    const date = new Date(`${v}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v;
  }, "Enter a valid review date."),
  text: z.string().min(1, "Original review text is required.").max(10000),
  source_url: googleUrl,
});
export type FeaturedGoogleReview = z.infer<typeof featuredReviewSchema>;
export const featuredReviewsSchema = z.array(featuredReviewSchema).max(3);

// This new table is isolated here until managed database types refresh.
const reviewsClient = supabase as unknown as SupabaseClient;
export async function loadFeaturedReviews(signal?: AbortSignal): Promise<FeaturedGoogleReview[]> {
  let query = reviewsClient.from("featured_google_reviews").select("reviews").eq("id", true).maybeSingle();
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return featuredReviewsSchema.parse(data?.reviews ?? []);
}
export async function saveFeaturedReviews(reviews: FeaturedGoogleReview[]) {
  const validated = featuredReviewsSchema.length(3, "Select exactly three original Google reviews.").parse(reviews);
  const { data, error } = await reviewsClient.from("featured_google_reviews")
    .upsert({ id: true, reviews: validated, updated_at: new Date().toISOString() })
    .select("reviews").single().abortSignal(AbortSignal.timeout(15000));
  if (error) throw error;
  return featuredReviewsSchema.parse(data.reviews);
}