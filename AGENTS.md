# Architecture rules
- Store the featured Google review selection as one atomic, admin-only editable collection in public.featured_google_reviews; public readers receive only complete selections, preventing partial updates across pages.
- Keep review validation and access in one repository, and render public reviews through GoogleReviews on every page so content and behavior cannot diverge.
- Keep account email dispatch in the scaffolded managed SDK handler; preserve independent Resend feature senders so the email update does not change their provider or content.