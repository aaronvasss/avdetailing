export const REVIEW_CACHE_HOURS = 1;
export const REVIEW_REFRESH_MS = REVIEW_CACHE_HOURS * 3600000;
export const REVIEW_RETENTION_MS = 86400000;
export function reviewRefreshDue(fetchedAt: string, now = Date.now()) { return now >= Date.parse(fetchedAt) + REVIEW_REFRESH_MS; }
export const MAX_REVIEW_PAGES = 20;
export const GOOGLE_REVIEW_PROFILE = "https://www.google.com/maps?cid=7061043489708478604";
const stars: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
export interface GoogleReview { reviewer: { displayName: string }; starRating: string; comment?: string; createTime: string; updateTime: string }
export function publicReview(review: unknown): GoogleReview | null {
  if (!review || typeof review !== "object") return null;
  const r = review as Record<string, unknown>, person = r.reviewer as Record<string, unknown> | undefined;
  if (!person || typeof person.displayName !== "string" || !person.displayName.trim() || typeof r.starRating !== "string" || !stars[r.starRating] || typeof r.createTime !== "string" || !Number.isFinite(Date.parse(r.createTime)) || typeof r.updateTime !== "string" || !Number.isFinite(Date.parse(r.updateTime)) || (r.comment != null && typeof r.comment !== "string")) return null;
  return { reviewer: { displayName: person.displayName }, starRating: r.starRating, ...(typeof r.comment === "string" ? { comment: r.comment } : {}), createTime: r.createTime, updateTime: r.updateTime };
}
export function newestReviews(reviews: unknown[]): GoogleReview[] {
  const valid = reviews.map(publicReview);
  if (valid.some(r => r === null)) throw new Error("Google returned an invalid review.");
  return valid.filter((r): r is GoogleReview => r !== null).sort((a, b) => Date.parse(b.createTime) - Date.parse(a.createTime)).slice(0, 5);
}
export function validTotals(rating: unknown, count: unknown): boolean {
  return typeof rating === "number" && Number.isFinite(rating) && rating >= 1 && rating <= 5 && typeof count === "number" && Number.isInteger(count) && count > 0;
}