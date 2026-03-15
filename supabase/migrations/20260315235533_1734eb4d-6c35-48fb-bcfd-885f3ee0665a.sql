
-- 1. BOOKINGS: Use trigger to prevent users from modifying financial/status fields
CREATE OR REPLACE FUNCTION public.prevent_user_booking_financial_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role and staff/admin to change anything
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_staff() THEN
    RETURN NEW;
  END IF;

  -- For regular users, prevent changes to sensitive fields
  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.total_price IS DISTINCT FROM OLD.total_price
    OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
    OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
    OR NEW.add_ons_total IS DISTINCT FROM OLD.add_ons_total
    OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
    OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id
    OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
    OR NEW.assigned_worker_id IS DISTINCT FROM OLD.assigned_worker_id
  THEN
    RAISE EXCEPTION 'You are not allowed to modify financial or status fields';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_user_booking_financial_changes ON public.bookings;
CREATE TRIGGER trg_prevent_user_booking_financial_changes
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_booking_financial_changes();

-- 2. CUSTOMER_MEMBERSHIPS: Trigger to prevent users from modifying privileged fields
CREATE OR REPLACE FUNCTION public.prevent_user_membership_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_staff() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.current_period_start IS DISTINCT FROM OLD.current_period_start
    OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
    OR NEW.membership_plan_id IS DISTINCT FROM OLD.membership_plan_id
  THEN
    RAISE EXCEPTION 'You are not allowed to modify membership status or billing fields';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_user_membership_status_changes ON public.customer_memberships;
CREATE TRIGGER trg_prevent_user_membership_status_changes
  BEFORE UPDATE ON public.customer_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_membership_status_changes();

-- 3. REFERRAL_REWARDS: Remove user update policy entirely
DROP POLICY IF EXISTS "Users can update own rewards" ON public.referral_rewards;

-- 4. WORKER_PROFILES: Trigger to prevent workers from modifying pay fields
CREATE OR REPLACE FUNCTION public.prevent_worker_pay_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.pay_rate IS DISTINCT FROM OLD.pay_rate
    OR NEW.pay_type IS DISTINCT FROM OLD.pay_type
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
  THEN
    RAISE EXCEPTION 'You are not allowed to modify pay rate or active status';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_worker_pay_changes ON public.worker_profiles;
CREATE TRIGGER trg_prevent_worker_pay_changes
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_worker_pay_changes();
