# Memory: project/business-contact-info

## Phone Number Configuration

The business uses two separate phone numbers:

### Public Business Phone (for calls)
- Display format: (225) 521-6264
- E.164 format: +12255216264
- Used in: Header, Footer, CTA buttons, mobile sticky call bar
- This is the main business line customers should call

### SMS Sender Phone (Twilio - for texting only)
- Number: +1 (225) 228-4796 (Twilio sending number only — never shown to customers)
- Used in: outgoing SMS via Twilio only. Customer-facing call AND text buttons use (225) 521-6264, tel:2255216264 / sms:2255216264
- This is the Twilio number that sends booking confirmations, reminders, etc.
- A2P Brand: BNc8b3fd6a31d5982cddd26a434ea4384f
- A2P Campaign: CM3754f93a8ce86860b8a5a388fd0a811e

## Database Settings
Both phone numbers are stored in the `business_settings` table:
- `public_business_phone` = '(225) 521-6264'
- `public_business_phone_e164` = '+12255216264'
- `sms_sender_phone` = '+12252284796'

## Component Usage
- `useBusinessSettings` hook fetches these settings for UI components
- Edge functions fetch from `business_settings` table directly
- All "Call" buttons use `publicBusinessPhoneE164`
- All "Text Us" buttons use sms:2255216264
- SMS message content displays `publicBusinessPhone` for call references

## Business Owner Contact
- Email: aaronvasquez100@gmail.com (avdetailingg.com address was a typo, removed)
- SMS notifications forwarded to: +12255216264
