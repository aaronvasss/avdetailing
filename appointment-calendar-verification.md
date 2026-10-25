# Appointment date/time completion — October 25, 2026

## Changed
- `AppointmentsTab` and legacy `BookingsTab` use the America/Chicago calendar day rather than device-local midnight. Each view's existing status predicates are preserved. Same-day elapsed appointments remain upcoming under existing calendar-day rules.
- Shared `supabase/functions/_shared/appointment-calendar.ts` converts Chicago date/time to exact UTC instants, accepting stored times with/without seconds and legacy AM/PM. Client `calendar.ts`, downloadable `download-ics`, and subscription `calendar-feed` reuse the conversion.
- Google Add to Calendar links carry explicit UTC start/end and America/Chicago event timezone. ICS DTSTART/DTEND/DTSTAMP use UTC `Z`, CRLF, RFC 5545 75-octet folding and final CRLF. Download filenames retain the Central appointment date. Description newlines are escaped once.
- Real elapsed duration is unchanged, including intervals crossing DST. Stored records, durations and scheduling policy/settings are not changed. Existing per-path absent-duration fallbacks are retained (client/feed 120 minutes; email download 180 minutes).

## Passed
236 regression tests across 23 files; 24 focused calendar/date tests also passed with process timezone Asia/Tokyo. New tests cover Central midnight before/after, month/year boundaries, completed/cancelled status rules, seconds, DST transitions, duplicate fall-back hour, nonexistent spring-forward hour, long Unicode ICS lines, actual download/feed handlers with fictional records and verification denials.

Eight browser flows passed: America/Chicago and Asia/Tokyo each viewed Central midnight, year rollover, spring-forward and fall-back fixtures. All backend/auth calls intercepted. Next Appointment label/date/time remained Central and agreed with calendar start; real downloaded ICS files and Google URL timestamps matched. Download names retained Central dates; saved 135-minute durations remained exactly 135 minutes. Screenshots inspected; no runtime errors, unexpected writes or overflow.

| Mock Chicago appointment | Export start UTC | Export end UTC (135 minutes) |
|---|---|---|
| Oct 28 2026, 9:00 AM | Oct 28, 14:00Z | Oct 28, 16:15Z |
| Dec 31 2026, 11:30:15 PM | Jan 1 2027, 05:30:15Z | Jan 1, 07:45:15Z |
| Mar 8 2026, 6:00 AM | Mar 8, 11:00Z | Mar 8, 13:15Z |
| Nov 1 2026, 6:00 AM | Nov 1, 12:00Z | Nov 1, 14:15Z |

The overnight fixture tests export correctness for existing owner appointments, not an expansion of public hours.

## Limits and release
No actual Google, Apple or Outlook calendar account was used to import events. Provider-specific display, reminder handling, subscription refresh timing and reimport/duplicate behavior remain unverified. Hosted endpoints were not called or deployed. Actual import should preserve the instant while displaying it in the calendar viewer's selected timezone—not necessarily showing 9:00 AM everywhere.

Stored date/time has no DST fold marker: repeated 1:30 AM at fall-back is inherently ambiguous; exports consistently choose the earlier occurrence. Nonexistent spring-forward times are rejected rather than silently moved. Public hours avoid these times; ambiguous existing owner records need manual confirmation without automatic rewriting.

Release when authorized: deploy `download-ics` and `calendar-feed` bundled with the shared helper, and publish the matching client calendar/classification changes. No migration or new settings/secrets required. Existing calendar token access/expiry policies remain unchanged; expiry harmonization flagged by the release report is not part of this date/time correction. No real records, messages, publication or deployment occurred.