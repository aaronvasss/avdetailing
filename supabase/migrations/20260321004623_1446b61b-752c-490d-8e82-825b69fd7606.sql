
-- Backfill: link all existing bookings to their client records by matching email or phone
UPDATE bookings b
SET client_id = c.id
FROM clients c
WHERE b.client_id IS NULL
  AND (
    (b.guest_email IS NOT NULL AND LOWER(b.guest_email) = LOWER(c.email))
    OR (b.guest_phone IS NOT NULL AND b.guest_phone = c.phone AND c.email IS NULL)
  );

-- For phone-only matches where email didn't match
UPDATE bookings b
SET client_id = c.id
FROM clients c
WHERE b.client_id IS NULL
  AND b.guest_phone IS NOT NULL 
  AND b.guest_phone = c.phone;
