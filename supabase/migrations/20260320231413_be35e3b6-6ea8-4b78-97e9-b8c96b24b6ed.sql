-- Add per-booking worker pay rate override columns
ALTER TABLE public.bookings 
  ADD COLUMN worker_pay_type text DEFAULT NULL,
  ADD COLUMN worker_pay_rate numeric DEFAULT NULL;

-- worker_pay_type: 'percentage' or 'flat' (NULL means use worker's global rate)
-- worker_pay_rate: the override value (percentage number or flat dollar amount)

COMMENT ON COLUMN public.bookings.worker_pay_type IS 'Override pay type for this booking: percentage or flat. NULL = use worker global rate.';
COMMENT ON COLUMN public.bookings.worker_pay_rate IS 'Override pay rate for this booking. NULL = use worker global rate.';