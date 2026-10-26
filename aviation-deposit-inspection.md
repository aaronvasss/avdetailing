# Aviation wording and deposit inspection

## Preview wording completed
- Four existing aviation URLs now state aircraft bookings require no deposit and share quote instructions.
- Coverage includes airports throughout the New Orleans area; access and workspace are coordinated for each job, with no standing permission implied.
- Established Baton Rouge Metropolitan Airport access, Lafayette coverage and Lake Charles inquiry-only wording retained.
- Homepage specialty FAQ and aircraft quote form corrected; shared inquiry pages/form and local contact-confirmation email source no longer promise a response deadline.
- Design, URLs, other-service payment rules and all payment enforcement unchanged.

## Existing aircraft deposit paths — not changed
| Location | Behavior found |
|---|---|
| `src/pages/BookingPage.tsx`, aircraft quote-only branch | Sends a quote inquiry; no booking or checkout, no deposit collection. Submission was not exercised. |
| `src/components/admin/AdminQuotesTab.tsx`, `AIRCRAFT_DEPOSIT`, quote-form initialization and `handleSendQuote` | Prefills $500 and persists `deposit_amount`/`deposit_required` for aircraft. Metadata, not enforced collection. Display instruction updated to explain no-deposit policy and legacy metadata. |
| Same admin quote component | Quote email remains a TODO; accepted-quote Convert to Booking button has no handler. Status/linking controls do not collect a deposit. No completed quote-to-booking payment conversion found. |
| `supabase/functions/create-deposit-checkout/index.ts`, quote insert and Stripe session creation | Accepts aircraft among specialty services, records `deposit_required: true`/`deposit_amount: 100`, and creates checkout with a fixed Stripe price. Actual configured Stripe price not read or tested. |
| `src/components/booking/DepositBookingModal.tsx` | Shows $100 and invokes the specialty checkout function; no import/caller found elsewhere in current source. Does not establish public reachability. |
| `supabase/functions/stripe-webhook/index.ts`, specialty-deposit branch | Records paid deposit and sends $100 confirmation wording. Financial logic and sender unchanged. |
| `src/lib/stripe.ts` | Same price ID has a conflicting $500 comment; runtime payment configuration not verified. |

These legacy metadata/payment paths conflict with the new owner policy. They require a separately authorized payment-logic correction; updating wording alone does not disable the specialty checkout endpoint or alter historic records.

## Verification and release limits
- 107 tests passed across aviation-policy, pricing, booking-pricing and booking-progress suites (seven public-policy tests; no claim of payment-enforcement tests).
- Four aviation pages, expanded homepage FAQ and Aircraft selection/quote screen checked at 1280px and 390px; no overflow/page errors; screenshots inspected.
- All browser writes blocked; no inquiries submitted, bookings, payment sessions, charges, messages or production changes.
- Preview build reported OK.
- Local `send-contact-email` confirmation wording changed but was not deployed; hosted confirmation wording remains unverified/unchanged by this task.
- Nothing deployed or published. Existing unconfirmed training/product claims were outside this wording task and were not endorsed or expanded.