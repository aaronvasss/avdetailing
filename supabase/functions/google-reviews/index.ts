import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { GOOGLE_REVIEW_PROFILE, MAX_REVIEW_PAGES, newestReviews, validTotals } from "./model.ts";

const GATEWAY = "https://connector-gateway.lovable.dev/google_business_profile";
// Exact location returned by Aaron's connected account; CID matched existing profile.
const RESOURCE = "accounts/103943538686678134606/locations/530220978437868572";
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return response(405, { error: "Method not allowed" });
  // Public fixed-location refresh only. No caller-selected URL/location or write action.
  if (new URL(req.url).search) return response(400, { error: "Parameters are not supported" });
  if (req.method === "POST") {
    const body = await req.text();
    if (body.trim() !== "" && body.trim() !== "{}") return response(400, { error: "No input is accepted" });
  }
  const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return response(503, { error: "Review storage is not configured" });
  const db = createClient(url, service);
  const cached = async () => {
    const { data, error } = await db.from("google_reviews_cache").select("rating,total_review_count,reviews,google_maps_uri,fetched_at,expires_at").eq("id", true).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) throw new Error("Review cache could not be read");
    return data;
  };
  try {
    const existing = await cached();
    if (existing) return response(200, { cache: existing });
    const key = Deno.env.get("LOVABLE_API_KEY"), connection = Deno.env.get("GOOGLE_BUSINESS_PROFILE_API_KEY");
    if (!key || !connection) return response(503, { error: "Google Business Profile connection is not configured", cache: null });
    // Atomic service-only claim enforces one upstream refresh attempt per 24 hours,
    // including concurrent page views and failures. Public callers cannot reset it.
    const { data: claim, error: claimError } = await db.rpc("claim_google_reviews_refresh");
    if (claimError) throw new Error("Review refresh could not be claimed");
    if (!claim) return response(200, { cache: null });
    const reviews: unknown[] = [];
    let token: string | undefined, rating: unknown, count: unknown;
    for (let page = 0; page < MAX_REVIEW_PAGES; page++) {
      const query = new URLSearchParams({ pageSize: "50", orderBy: "updateTime desc" });
      if (token) query.set("pageToken", token);
      const upstream = await fetch(`${GATEWAY}/my_business/v4/${RESOURCE}/reviews?${query}`, {
        headers: { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": connection }, signal: AbortSignal.timeout(15000),
      });
      if (!upstream.ok) {
        const details = await upstream.text();
        // Provider bodies may include request details; never log credentials or URLs.
        return response(upstream.status, { error: "Google reviews request failed", status: upstream.status, details });
      }
      const data = await upstream.json();
      if (page === 0) { rating = data.averageRating; count = data.totalReviewCount; }
      if (!Array.isArray(data.reviews) && data.totalReviewCount !== 0) throw new Error("Google review response is incomplete");
      reviews.push(...(data.reviews ?? []));
      token = typeof data.nextPageToken === "string" && data.nextPageToken ? data.nextPageToken : undefined;
      if (!token) break;
    }
    if (token) throw new Error("Review feed exceeds the bounded refresh size; no partial newest selection saved");
    if (!validTotals(rating, count)) return response(200, { cache: null });
    const now = new Date();
    const value = { id: true, rating, total_review_count: count, reviews: newestReviews(reviews), google_maps_uri: GOOGLE_REVIEW_PROFILE, fetched_at: now.toISOString(), expires_at: new Date(now.getTime() + 86400000).toISOString() };
    const { error } = await db.from("google_reviews_cache").upsert(value);
    if (error) throw new Error("Review cache could not be saved");
    return response(200, { cache: await cached() });
  } catch (error) {
    return response(503, { error: error instanceof Error ? error.message : "Google reviews are temporarily unavailable", cache: null });
  }
});