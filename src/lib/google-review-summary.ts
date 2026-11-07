/** Overall listing metrics are separate from the three curated reviews. */
export const GOOGLE_REVIEW_SUMMARY_KEY = "google_review_summary";
export interface GoogleReviewSummary { rating: number; count: number }
export function parseGoogleReviewSummary(value: string | null | undefined): GoogleReviewSummary | null {
  if (!value) return null;
  try {
    const data = JSON.parse(value);
    if (typeof data?.rating !== "number" || !Number.isFinite(data.rating) || data.rating < 1 || data.rating > 5) return null;
    if (!Number.isSafeInteger(data.count) || data.count < 1) return null;
    return { rating: data.rating, count: data.count };
  } catch { return null; }
}