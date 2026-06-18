UPDATE public.business_settings
SET value = '00:00', updated_at = now()
WHERE key = 'business_hours_start' AND value = '06:00';

UPDATE public.business_settings
SET value = '23:59', updated_at = now()
WHERE key = 'business_hours_end' AND value = '20:00';