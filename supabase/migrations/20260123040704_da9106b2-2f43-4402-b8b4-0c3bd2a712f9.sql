-- Tighten sms_messages INSERT policy to avoid overly-permissive WITH CHECK (true)
-- This table is intended for backend/service-role inserts only.

DROP POLICY IF EXISTS "Service role can insert sms_messages" ON public.sms_messages;

CREATE POLICY "Service role can insert sms_messages"
ON public.sms_messages
FOR INSERT
WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');
