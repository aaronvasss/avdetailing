DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Staff can view contacts" ON public.contacts;
CREATE POLICY "Staff can view contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "Anon can view own submitted rating" ON public.booking_ratings;

DROP POLICY IF EXISTS "Users can upload quote photos" ON public.quote_photos;
CREATE POLICY "Users can upload quote photos" ON public.quote_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_photos.quote_id
        AND quotes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload booking photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload booking photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'booking-photos'
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can upload quote photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload quote photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'quote-photos'
    AND auth.uid() IS NOT NULL
  );

REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_user_booking_financial_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_user_membership_status_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_worker_pay_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_booking_token() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_calendar_token() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;