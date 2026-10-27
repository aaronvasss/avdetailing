# Restore cancel, reschedule and saved-card balance

## Confirmed problem
Both findings are real. The live database has neither `commit_owner_appointment_change` nor `portal_booking_balance`. The published functions call them, so:
- Every customer cancel or reschedule (account page and email links) fails, and the original appointment stays unchanged.
- Remaining balance, card approval and "Charge Approved Balance" always show "Payment balance needs review".

Both database pieces were written earlier but deliberately held back ("stage until release is authorized"). Turning them on changes the live database that the published site uses, so this needs your go-ahead.

## What approving does
1. Apply `scripts/pending-migrations/portal_payable_balance.sql` exactly as written. This adds the read-only balance calculation and updates the charge safety check. No charges run on their own.
2. Apply `scripts/pending-migrations/owner_alert_outbox.sql` exactly as written. This adds the owner-alert queue and the save step that cancel/reschedule use. When a customer cancels or reschedules, it **turns on automatic owner alerts by email/SMS**, with a 1-minute retry timer that runs only while alerts are waiting.
3. Regenerate the app's database types.
4. Check that both functions exist and that a mocked cancel/reschedule and balance request no longer fail. No real bookings, charges or messages.
5. Mark both findings fixed and update the release notes and roadmap.

## Technical details
- Run each file byte-for-byte through the migration tool. The cron and net extensions and the private scheduler credential row must exist. If they don't, the outbox migration fails safely and nothing is applied.
- The edge functions are already deployed, so no function changes are needed.
- Rollback option: switch the dispatch config off. The tables stay in place.
