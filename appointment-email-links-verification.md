# Appointment email links — preview verification

## Result
Confirmation/resend/appointment-update and reminder emails use one production-domain link builder. Manage opens the specific appointment; cancel/reschedule open the intended confirmation or date/time choice. All routes verify a stored appointment-specific secret, or signed-in ownership, before disclosing appointment information. Reads and availability requests never mutate. Customer writers reuse existing cancellation/rescheduling checks, compare-and-set protection, owner delivery and failure logging. Payment fields are unchanged.

## Verification
- 211 automated tests passed, including two new signed-out writer tests using in-memory saves and intercepted owner email/SMS, denied capability, legacy mutation denial, expiry, Central dates and telemetry redaction.
- Actual confirmation HTML was generated locally; all three extracted action links were opened with only their origin translated to localhost for preview testing.
- 21 signed-out browser cases: desktop 1280px and phone 375px/390px, manage/cancel/reschedule, expired, cancelled, token-bearing legacy cancellation, missing-token cancellation.
- Cancel and reschedule confirmation requests intercepted. Failure leaves original appointment displayed; Back preserves the new time selection; opening links sends no mutation. No overflow or browser page errors. Screenshots inspected.
- Current preview build OK. No real emails/SMS, appointments, payments, refunds, deployment or publication.

## Compatibility and verification
- Existing /booking/manage?token=… retains its historical reschedule intent.
- /booking/cancel?token=… and /cancel/:id?token=… use the same current cancellation dialog.
- Supported stored token formats include 64 hex, UUID and the current UUID+32-hex construction. Tokens must match the appointment; changed/revoked tokens fail. Signed-out capabilities expire 30 days after the appointment date; authenticated owners can still read their own records.
- Booking-ID-only links cannot provide guest access. They show a helpful message and sign-in option preserving the path/query/action; guests without an account should use their latest secure email or contact the business. Generic older /account links cannot identify an appointment, so remain general account links.
- Old browser tabs that call legacy mutation endpoints must reopen the email link. manage-booking rejects legacy mutation requests; cancel-booking-public returns 410. No unsafe direct-update fallback remains.
- Current create-booking already creates a compound random manage token. No price data or database migrations changed. Other historical/admin writers with missing tokens require authenticated ownership; no automatic token backfill was performed.

## Coordinated release — not performed
1. Deploy manage-booking, cancel-customer-booking, reschedule-booking, and cancel-booking-public together, with their shared code. The first is read-only; the next two validate capabilities in code or user sessions; the last retires the old mutation endpoint. Existing JWT-in-code deployment convention applies.
2. Publish matching frontend pages/dialogs immediately afterward. Previously open old pages may temporarily require reopening links. Do not release the new frontend against the old backend.
3. Deploy process-booking-notifications and send-reminder-sms after the pages are available, to generate unified production links.
Existing Resend/Twilio and Cloud environment settings are reused. No new key or provider configuration needed. Production domain remains https://avdetailing.net.

## Limits
Live auth/delivery, real worker capacity and real saves deliberately untested. The existing capacity RPC is reused, not replaced by a new worker-schedule engine. Existing availability reads and save are not a database-serialized reservation against other appointments; simultaneous changes to different appointments can still race for capacity. No SMS outbox/automatic retry added. Retired legacy customer cancellation/reschedule senders are no longer used: current owner alerts remain, UI does not promise a separate immediate customer confirmation message. Forwarded bearer links grant scoped appointment access until expiry/revocation, so keep them private. Referrer suppression and error-URL redaction added; host/access-log handling is outside application verification.
