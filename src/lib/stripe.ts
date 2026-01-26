import { supabase } from "@/integrations/supabase/client";

// Map vehicle sub-types to price categories used in stripe_prices table
export const getVehiclePriceCategory = (vehicleSubType: string): string => {
  const largeVehicles = ['suv-8', 'truck'];
  if (largeVehicles.includes(vehicleSubType)) return 'large';
  if (vehicleSubType === 'suv-5') return 'suv5';
  if (vehicleSubType === 'sedan') return 'car';
  return 'car-suv5';
};

// Map service type from booking flow to service_type in stripe_prices
export const getStripeServiceType = (serviceType: string): string => {
  const serviceTypeMap: Record<string, string> = {
    'car': 'car-detailing',
    'paint': 'paint-correction',
  };
  return serviceTypeMap[serviceType] || serviceType;
};

// Get Stripe price ID from database
export const getStripePriceIdFromDb = async (
  serviceType: string,
  packageSlug: string,
  vehicleSubType: string
): Promise<string | null> => {
  const stripeServiceType = getStripeServiceType(serviceType);
  const vehicleCategory = getVehiclePriceCategory(vehicleSubType);
  
  // Query stripe_prices table for matching price
  const { data: prices, error } = await supabase
    .from('stripe_prices')
    .select('stripe_price_id, vehicle_type')
    .eq('service_type', stripeServiceType)
    .eq('package_name', packageSlug)
    .eq('is_active', true);

  if (error || !prices || prices.length === 0) {
    console.error('No Stripe price found:', { serviceType, packageSlug, vehicleSubType, error });
    return null;
  }

  // Try exact match first
  const exactMatch = prices.find(p => p.vehicle_type === vehicleCategory);
  if (exactMatch) return exactMatch.stripe_price_id;

  // Try car-suv5 fallback
  const fallback = prices.find(p => p.vehicle_type === 'car-suv5');
  if (fallback) return fallback.stripe_price_id;

  // Return first available
  return prices[0]?.stripe_price_id || null;
};

// Memberships pricing (static for now)
export const MEMBERSHIP_PRICES = {
  'monthly': 'price_1StkZlDr7pQ6grsfOOWsn5r4',
  'bi-weekly': 'price_1StkZmDr7pQ6grsf6C8Z95AG',
  'weekly-premium': 'price_1StkZnDr7pQ6grsfhM02js70',
};

// Create checkout session for booking with redirect
export const createBookingCheckout = async (
  bookingId: string,
  priceId: string,
  metadata?: Record<string, string>
): Promise<{ url: string; session_id: string }> => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      booking_id: bookingId,
      price_id: priceId,
      mode: 'payment',
      success_url: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/booking/canceled?booking_id=${bookingId}`,
      metadata,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('No checkout URL returned');
  
  return data;
};

// Create checkout session for membership subscription
export const createMembershipCheckout = async (
  membershipPlanId: string,
  priceId: string
): Promise<{ url: string; session_id: string }> => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      membership_plan_id: membershipPlanId,
      price_id: priceId,
      mode: 'subscription',
      success_url: `${window.location.origin}/account?tab=memberships&success=true`,
      cancel_url: `${window.location.origin}/memberships?canceled=true`,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('No checkout URL returned');
  
  return data;
};

// Open Stripe Customer Portal
export const openCustomerPortal = async () => {
  const { data, error } = await supabase.functions.invoke('customer-portal', {});

  if (error) throw new Error(error.message);
  
  if (data?.url) {
    window.open(data.url, '_blank');
  }
  
  return data;
};

// Check subscription status
export const checkSubscription = async () => {
  const { data, error } = await supabase.functions.invoke('check-subscription', {});

  if (error) throw new Error(error.message);
  return data;
};
