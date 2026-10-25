# Customer password recovery — preview verification

## Changes
- Visible Forgot password? action on customer sign-in, using existing authentication and profiles.
- Email-only request form, identical neutral response for success/account-specific errors; transport/rate errors are generic and retryable.
- Public /reset-password screen verifies recovery intent and provider-validated current user, requires matching passwords and existing 6–100 character client limits; provider rules remain authoritative.
- Invalid/expired links offer a new request. Save errors retain the form. Duplicate requests/saves blocked while pending.
- Password update uses updateUser without current_password (recovery only). Local recovery session cleared after success; explicit return to sign-in retains safe /account destinations and query parameters. External destinations are rejected.
- Recovery request builds redirectTo from the current origin. Released on primary domain, return is https://avdetailing.net/reset-password?redirect=%2Faccount (or safe account query). Preview links remain on preview.
- Recovery route is public/noindex and excluded from chat injection; postbuild utility HTML has matching metadata and no recovery credentials/content. Existing auth email recovery template untouched.

## Passed
226 automated regression tests, including 13 new recovery tests. Fifteen browser cases at 1280, 375 and 390px with all auth/network writes intercepted: neutral request, successful replacement, mismatch blocked before update, expired/invalid links, email-request failure, password-update failure and return destination. Inspected desktop/phone screenshots; no overflow/page errors. Preview build OK.

## Release configuration
Publish the frontend only when authorized; no new function deployment or email-template deployment required for this task. Hosted settings read confirmed Site URL https://avdetailing.net and redirect allow-list https://avdetailing.net/** plus connected preview domains. These already cover /reset-password and its query parameters. Email/password auth was already enabled and remained enabled; no confirmation, signup or password-policy setting changed.
If hosting domains change, check More → Users → Auth settings → Advanced: Site URL should remain production origin and Redirect URLs must cover the destination domain /reset-password (or /**). Existing managed Password reset email uses provider confirmationUrl; no custom reset tokens/sender added.

## Deliberate limits
No real recovery email, real password update, publication or deployment. Live deliverability, actual one-time link expiry/reuse and hosted password strength acceptance remain untested. Mocked implicit recovery-session links were used; ordinary authenticated visits without recovery intent do not unlock replacement. Refresh after the recovery URL has been consumed requires a fresh link, rather than treating any stored sign-in session as recovery authorization.