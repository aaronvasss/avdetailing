# Hourly Google reviews

- Review feature migration `drizzle/migrations/0012_hourly_google_reviews_refresh.sql` applied; only `google-reviews` deployed. Website not published.
- Freshness is one hour from successful fetch, separate from unchanged maximum 24-hour snapshot retention. Daily expiration cleanup remains `expire-google-review-cache`, schedule `17 4 * * *` (scheduler timezone unchanged).
- Atomic service-only claim prevents duplicate upstream refreshes. Ten-minute token lease exceeds bounded twenty-page/15-second-per-page refresh duration; token-checked commit rejects superseded work. Failed automatic attempts consume the hourly window; admin force can retry after the active lease is released. Force never bypasses an active lease.
- Existing stale data is returned during another refresh and preserved in React Query on refresh errors, only within retention. Empty sources retry each minute; stale visitors retry at most every thirty seconds to receive a completed refresh, without calling Google themselves on every view. Shared query staleTime is one hour, with freshness deadline refetch.
- Admin control forces through the same handler after auth.getUser and has_role verification. Last successful time is shown in America/Chicago. Existing featured-review editor unchanged.
- Focused tests: 23 passed across five files, including actual-handler mocked 401/403 checks, claimed/concurrent response, release-on-provider-failure, freshness boundary, retention, shared cache update and existing UI/schema stripping tests. Automatic preview build OK. No manual build.
- Deployed public endpoint returned 200 with the existing valid snapshot; unauthenticated force returned 401. No review/customer messages or new reviews created. Authenticated admin end-to-end verification unavailable: requesting-user session mint had no matching account and explicit admin mint required approval unavailable in this context. Admin UI is mock-tested, not claimed live-verified.
- Public responses do not promise Google indexing immediately; updates appear after Google exposes them and the next visitor-triggered hourly refresh, or admin refresh. No unattended hourly scheduler added.

## Provider/push notes
Reduced refresh interval does not expand existing temporary storage or public fields. Google's policy does not establish a specific review retention allowance in the reviewed material; 24 hours is this application's conservative existing limit, not a Google-guaranteed allowance. Source: https://developers.google.com/my-business/content/policies

Google supports new/updated-review notifications through Pub/Sub. It requires a Cloud Pub/Sub topic/subscription, publish permission for `mybusiness-api-pubsub@system.gserviceaccount.com`, account notification configuration for NEW_REVIEW/UPDATED_REVIEW, suitable OAuth/API access and an authenticated consumer with deduplication/retries using the same refresh lock. The current connector does not expose Pub/Sub infrastructure setup. This is separate setup, not a simple toggle, and was not built. Source: https://developers.google.com/my-business/content/notification-setup

## Files changed
- `supabase/functions/google-reviews/index.ts`
- `supabase/functions/google-reviews/model.ts`
- `src/lib/live-google-reviews.ts`
- `src/components/admin/AdminReviewRefresh.tsx` (new)
- `src/components/admin/AdminGoogleReviews.tsx`
- `src/test/hourly-google-reviews.test.tsx` (new)
- `src/test/google-reviews-handler.test.ts` (new)
- `drizzle/migrations/0012_hourly_google_reviews_refresh.sql` and tool-managed migration metadata
- `src/integrations/supabase/types.ts` (tool regenerated)
- `roadmap.md`
- `docs/hourly-google-reviews-2026-11-07.md` (new)

No booking/payment/scheduling/GA4/contact changes or other function deployments. Root AGENTS.md save skipped because its protected content exhausted the size budget.