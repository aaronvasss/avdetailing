# What's left to fix

After the last round of fixes, three items remain across monitoring, SEO, and security.

## 1. Checkout failure: "Booking not found" (high priority)

Monitoring caught three back-to-back 500 errors from the payment step within a two-second window. The payment function looked up the booking by ID and got zero rows, so it threw and the customer could not pay.

What is confirmed from the code: the booking is created first by the booking function (a normal, committed insert that returns the new booking), and only then is the payment step called with that ID. So the ID is real at creation time. What is **not** confirmed is why the row was missing a moment later — possible causes are a stale/retried checkout call from an old browser tab, or the booking having been removed (for example by an admin bulk clear) between creation and payment. The error log alone cannot distinguish these.

Proposed work:

- Make the payment function fail gracefully instead of with a 500: look the booking up without the "must return exactly one row" mode, and return a clear 404 with a specific message ("This booking no longer exists — please start a new booking") so the customer sees guidance instead of a generic failure.
- Add a single short retry on the lookup to rule out any timing/replication gap.
- Log the booking ID and whether the caller had a valid session, so if it happens again the log identifies the cause definitively.
- On the booking page, when the payment step reports the booking is gone, reset the flow back to the form rather than offering "Pay in Person" for a booking that may not exist.

Note: the same log cluster also shows session-expired responses, consistent with a user sitting on the page with an expired session. The session handling work already done should reduce this; the changes above make the failure visible and recoverable either way.

## 2. SEO: homepage title is missing "Mobile" (low priority)

The homepage gets very low click-through on the highest-volume local query because the title does not contain the business's main differentiator.

- Title: `Mobile Car Detailing in Baton Rouge — AV Detailing` (under 60 characters).
- Meta description: lead with the mobile/"we come to you" promise in the first sentence, kept under 155 characters.

This is a wording change only on the homepage metadata.

## 3. Security: nothing outstanding

All security scanners currently report zero findings. The scans are older than the latest code, so a fresh scan is worth running after the checkout fix lands.

## Technical notes

- `supabase/functions/create-checkout/index.ts` (lines ~126-143): replace `.single()` with `.maybeSingle()`, add one 500ms retry, and return `404` with a typed error code (`booking_not_found`) plus CORS headers instead of throwing into the generic 500 handler.
- `src/pages/BookingPage.tsx` (checkout error branch, ~lines 793-830): branch on the `booking_not_found` code to reset the wizard state instead of falling back to in-person and cancelling a non-existent booking.
- `src/pages/Index.tsx` / `src/components/seo/SEOHead.tsx`: homepage title and description strings only.
