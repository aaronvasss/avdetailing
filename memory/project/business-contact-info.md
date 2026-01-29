# Memory: project/business-contact-info

## Phone Number Configuration

The business uses two separate phone numbers:

### Public Business Phone (for calls)
- Display format: (225) 521-6264
- E.164 format: +12255216264
- Used in: Header, Footer, CTA buttons, mobile sticky call bar
- This is the main business line customers should call

### SMS Sender Phone (Twilio - for texting only)
- Number: +1 (225) 239-4617 / +12252394617
- Used in: All SMS notifications via Twilio, "Text Us" button, two-way messaging
- This is the Twilio number that sends booking confirmations, reminders, etc.

## Database Settings
Both phone numbers are stored in the `business_settings` table:
- `public_business_phone` = '(225) 521-6264'
- `public_business_phone_e164` = '+12255216264'
- `sms_sender_phone` = '+12252394617'

## Component Usage
- `useBusinessSettings` hook fetches these settings for UI components
- Edge functions fetch from `business_settings` table directly
- All "Call" buttons use `publicBusinessPhoneE164`
- All "Text Us" buttons use `smsSenderPhone`
- SMS message content displays `publicBusinessPhone` for call references

## Business Owner Contact
- Email: aaronvasquez100@gmail.com and aaronvasquez@avdetailingg.com
- SMS notifications forwarded to: +12255216264
