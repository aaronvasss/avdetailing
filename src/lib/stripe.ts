import { supabase } from "@/integrations/supabase/client";

// Stripe price ID mappings for vehicle-based pricing
export const STRIPE_PRICES = {
  // Car Detailing
  'car-detailing': {
    'exterior-only': {
      'car-suv5': 'price_1StkZEDr7pQ6grsf1VhiT3AU',
      'large': 'price_1StkZRDr7pQ6grsfI5bC6WVM',
    },
    'basic': {
      'car-suv5': 'price_1StkZVDr7pQ6grsfHdmp4F4O',
      'large': 'price_1StkZWDr7pQ6grsfGADOhqQr',
    },
    'silver': {
      'car': 'price_1StkZXDr7pQ6grsfeGniTRU9',
      'suv5': 'price_1StkZYDr7pQ6grsfe5N9zF0Z',
      'large': 'price_1StkZZDr7pQ6grsfTaVe5PWF',
    },
    'gold': {
      'car-suv5': 'price_1StkZaDr7pQ6grsfFaNrktoq',
      'large': 'price_1StkZaDr7pQ6grsf77CtIb2C',
    },
  },
  // Paint Correction
  'paint-correction': {
    '1-step': {
      'car-suv5': 'price_1StkZeDr7pQ6grsfftxc6r5c',
      'large': 'price_1StkZgDr7pQ6grsfd2vwDbe7',
    },
    '2-step': {
      'car-suv5': 'price_1StkZhDr7pQ6grsfE8zfDhFX',
      'large': 'price_1StkZhDr7pQ6grsfTouLBojD',
    },
    '3-step': {
      'car-suv5': 'price_1StkZjDr7pQ6grsfCaYR2dQG',
      'large': 'price_1StkZkDr7pQ6grsfy261dgQF',
    },
  },
  // Memberships
  'memberships': {
    'monthly': 'price_1StkZlDr7pQ6grsfOOWsn5r4',
    'bi-weekly': 'price_1StkZmDr7pQ6grsf6C8Z95AG',
    'weekly-premium': 'price_1StkZnDr7pQ6grsfhM02js70',
  },
};

// Map vehicle sub-types to price categories
export const getVehiclePriceCategory = (vehicleSubType: string): string => {
  const largeVehicles = ['suv-8', 'truck'];
  if (largeVehicles.includes(vehicleSubType)) return 'large';
  if (vehicleSubType === 'suv-5') return 'suv5';
  if (vehicleSubType === 'sedan') return 'car';
  return 'car-suv5';
};

// Get the appropriate Stripe price ID
export const getStripePriceId = (
  serviceType: string,
  packageSlug: string,
  vehicleSubType: string
): string | null => {
  const servicePrices = STRIPE_PRICES[serviceType as keyof typeof STRIPE_PRICES];
  if (!servicePrices) return null;

  const packagePrices = servicePrices[packageSlug as keyof typeof servicePrices];
  if (!packagePrices) return null;

  // For memberships, return directly
  if (typeof packagePrices === 'string') return packagePrices;

  const vehicleCategory = getVehiclePriceCategory(vehicleSubType);
  
  // Try exact match first
  if (packagePrices[vehicleCategory as keyof typeof packagePrices]) {
    return packagePrices[vehicleCategory as keyof typeof packagePrices] as string;
  }
  
  // Fallback to car-suv5 category
  if (packagePrices['car-suv5' as keyof typeof packagePrices]) {
    return packagePrices['car-suv5' as keyof typeof packagePrices] as string;
  }

  return null;
};

// Create checkout session for booking
export const createBookingCheckout = async (
  bookingId: string,
  priceId: string,
  metadata?: Record<string, string>
) => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      booking_id: bookingId,
      price_id: priceId,
      mode: 'payment',
      metadata,
    },
  });

  if (error) throw new Error(error.message);
  return data;
};

// Create checkout session for membership subscription
export const createMembershipCheckout = async (
  membershipPlanId: string,
  priceId: string
) => {
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
