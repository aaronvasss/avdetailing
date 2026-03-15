import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Ship, Caravan, Plane, Check, ArrowRight, ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Sparkles, Star, Loader2, Droplets, Disc3, MessageSquareQuote, CalendarPlus, Download, AlertCircle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
// Booking confirmation emails are now sent server-side automatically
import { sendBookingSms } from "@/lib/sms";
import { bookingCustomerSchema } from "@/lib/validations";
import { clearRateLimit } from "@/lib/security";
import { useQuery } from "@tanstack/react-query";
import { generateICS } from "@/lib/calendar";
import { format, addMinutes, parse } from "date-fns";
import { 
  generateTimeSlots, 
  getPackageDuration, 
  PACKAGE_DURATIONS, 
  DEFAULT_DURATION,
  getWorkingHoursDisplay,
  formatDuration
} from "@/lib/scheduling";
import { getStripePriceIdFromDb, createBookingCheckout } from "@/lib/stripe";
import { PaymentMethodStep } from "@/components/booking/PaymentMethodStep";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

// Step 1: Service Types - now includes Ceramic Coating and Paint Correction
const serviceTypes = [
  { id: "car", label: "Car Detailing", icon: Car },
  { id: "ceramic", label: "Ceramic Coating", icon: Droplets, quoteOnly: true },
  { id: "paint", label: "Paint Correction", icon: Disc3 },
  { id: "boat", label: "Boat Detailing", icon: Ship },
  { id: "rv", label: "RV/Motorhome", icon: Caravan },
  { id: "aircraft", label: "Aircraft", icon: Plane, quoteOnly: true },
];

// Services that are quote-only (no package selection)
const quoteOnlyServices = ["ceramic", "aircraft"];

// Vehicle sub-types for Car, Ceramic, and Paint Correction
const carVehicleTypes = [
  { id: "sedan", label: "Car (Sedan / Coupe)", description: "Standard-size vehicles" },
  { id: "suv-5", label: "SUV (5 seats)", description: "Mid-size SUVs and crossovers" },
  { id: "suv-8", label: "SUV (8 seats / 3-row)", description: "Large SUVs and full-size vehicles" },
  { id: "truck", label: "Truck", description: "Pickup trucks of all sizes" },
];

// Services that need vehicle sub-type selection (car-based services)
const servicesWithVehicleSelection = ["car", "ceramic", "paint"];

// Map service types to their service slugs in the database
const serviceSlugMap: Record<string, string> = {
  car: "full-detail",
  ceramic: "ceramic-coating",
  paint: "paint-correction",
  boat: "boat-detail",
  rv: "rv-detail",
  aircraft: "aircraft-detail",
};

// Map UI vehicle sub-types to database vehicle_type values
const vehicleSubTypeToDbType: Record<string, string[]> = {
  "sedan": ["sedan", "car"],
  "suv-5": ["suv-5", "suv"],
  "suv-8": ["suv-8", "suv"],
  "truck": ["truck"],
};

// Map service types to their package vehicle_type filter
const getVehicleTypeFilter = (serviceType: string, vehicleSubType: string): string[] => {
  if (serviceType === "boat") return ["boat"];
  if (serviceType === "rv") return ["rv"];
  if (serviceType === "aircraft") return ["aircraft"];
  if (serviceType === "ceramic") return ["all"]; // Ceramic uses "all" for universal packages
  if (serviceType === "paint") return ["all"]; // Paint Correction uses flat pricing (no vehicle differentiation)
  
  // For car-based services, map UI vehicle type to DB vehicle types
  if (vehicleSubType && vehicleSubTypeToDbType[vehicleSubType]) {
    return vehicleSubTypeToDbType[vehicleSubType];
  }
  
  // Fallback: include all possible vehicle types
  return ["sedan", "suv-5", "suv-8", "truck", "car", "suv", "all"];
};

// Services that show "starting at" pricing (variable based on vehicle size, condition, etc.)
const startingAtPricingServices = ["paint", "rv"];

// Get the service ID for the selected service type
const getServiceIdForType = (serviceType: string): string | null => {
  const serviceIdMap: Record<string, string> = {
    car: "3763f8d6-9045-45d5-99cd-cb878bdceeb8",        // Full Detail
    ceramic: "5017f8e7-3046-4dc4-8254-3bf04c962818",    // Ceramic Coating
    paint: "806e631d-f058-4cd7-9318-582c60b10a32",      // Paint Correction
    boat: "c15abb75-415f-499e-a681-7ce59e2faaa5",       // Boat Detailing
    rv: "895a1ea3-4309-4a75-9406-555cf568b370",         // RV Detailing
    aircraft: "71c8e20e-4bdf-42b8-ba46-d7565121c9d9",   // Aircraft Detailing
  };
  return serviceIdMap[serviceType] || null;
};

// Custom short descriptions for booking flow ONLY (not for services pages)
const bookingFlowDescriptions: Record<string, string> = {
  "exterior-only": "Hand wash & dry, wheels cleaned, tire shine, exterior windows, spray wax",
  "basic": "Quick maintenance service: light vacuum + hand wash",
  "silver": "Full interior detailing + regular exterior wash (does not include shampoo)",
  "gold": "Full interior detailing + full exterior detail (includes shampoo + paint sealant)",
};

// Fallback packages in case database fetch fails
const fallbackPackages = [
  { 
    id: "exterior-only", 
    name: "Exterior Only", 
    basePrice: 75,
    prices: { sedan: 75, "suv-5": 75, "suv-8": 85, truck: 85 },
    time: "1 hour",
    description: bookingFlowDescriptions["exterior-only"],
    service_id: null,
  },
  { 
    id: "basic", 
    name: "Basic Package", 
    basePrice: 120,
    prices: { sedan: 120, "suv-5": 120, "suv-8": 130, truck: 130 },
    time: "1-2 hours",
    description: bookingFlowDescriptions["basic"],
    service_id: null,
  },
  { 
    id: "silver", 
    name: "Silver Package", 
    basePrice: 190,
    prices: { sedan: 190, "suv-5": 195, "suv-8": 200, truck: 200 },
    time: "3-5 hours",
    description: bookingFlowDescriptions["silver"],
    service_id: null,
    is_popular: true,
  },
  { 
    id: "gold", 
    name: "Gold Package", 
    basePrice: 295,
    prices: { sedan: 295, "suv-5": 295, "suv-8": 320, truck: 320 },
    time: "5-6 hours",
    description: bookingFlowDescriptions["gold"],
    service_id: null,
  },
];

interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_estimate: string | null;
  vehicle_type: string;
  price: number;
  sort_order: number | null;
  is_popular: boolean | null;
  service_id: string | null;
}

interface ServiceAddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

// Smart recommendations based on vehicle type and package
const getRecommendations = (vehicleType: string, selectedPackage: string) => {
  const recommendations: { addonId: string; reason: string }[] = [];
  
  // Large SUV recommendations
  if (vehicleType === "suv-8") {
    recommendations.push({ addonId: "pet", reason: "Popular for family vehicles" });
    recommendations.push({ addonId: "interior-extra", reason: "Recommended for 3-row vehicles" });
  }
  
  // 5-seat SUV
  if (vehicleType === "suv-5") {
    recommendations.push({ addonId: "pet", reason: "Popular add-on for SUV owners" });
  }
  
  // Truck recommendations
  if (vehicleType === "truck") {
    recommendations.push({ addonId: "engine", reason: "Keep your truck running clean" });
    recommendations.push({ addonId: "interior-extra", reason: "For work trucks and heavy use" });
  }
  
  // Basic package upsells
  if (selectedPackage === "basic") {
    recommendations.push({ addonId: "odor", reason: "Freshen up your ride" });
  }
  
  // Silver package upsells
  if (selectedPackage === "silver") {
    recommendations.push({ addonId: "headlight", reason: "Complete the look" });
  }
  
  return recommendations.slice(0, 3); // Max 3 recommendations
};

// Time slots are now generated dynamically based on service duration and availability
// See generateTimeSlots() in src/lib/scheduling.ts

const toDbTime = (input: string): string | null => {
  const trimmed = String(input || "").trim();
  const m12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let hours = Number(m12[1]);
    const minutes = Number(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  }

  const m24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m24) {
    const hours = Number(m24[1]);
    const minutes = Number(m24[2]);
    const seconds = m24[3] ? Number(m24[3]) : 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return null;
};

const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<string>("");
  const [vehicleSubType, setVehicleSubType] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'in_person' | 'online' | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState<boolean>(true);
  const [smsConsent, setSmsConsent] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    notes: "",
  });

  // Fetch packages from database
  const { data: dbPackages, isLoading: packagesLoading } = useQuery({
    queryKey: ['service-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as ServicePackage[];
    },
  });

  // Fetch add-ons from database
  const { data: dbAddOns, isLoading: addOnsLoading } = useQuery({
    queryKey: ['service-add-ons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_add_ons')
        .select('id, name, description, price')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as ServiceAddOn[];
    },
  });

  // Transform database packages into the format needed by the UI - filtered by service type
  const packages = useMemo(() => {
    if (!dbPackages || dbPackages.length === 0) return fallbackPackages;

    // Get the service ID for the current service type
    const currentServiceId = getServiceIdForType(serviceType);
    
    // Filter packages by service ID
    const filteredPackages = dbPackages.filter(pkg => {
      if (!currentServiceId) return false;
      return pkg.service_id === currentServiceId;
    });

    if (filteredPackages.length === 0) {
      // Fallback for car detailing if no packages found
      if (serviceType === "car") return fallbackPackages;
      return [];
    }

    // Get the vehicle types to show based on service and selection
    const vehicleTypeFilters = getVehicleTypeFilter(serviceType, vehicleSubType);

    // Group packages by slug
    const packageMap = new Map<string, {
      id: string;
      name: string;
      description: string;
      time: string;
      basePrice: number;
      prices: Record<string, number>;
      is_popular: boolean;
      sort_order: number;
      service_id: string | null;
    }>();

    filteredPackages.forEach(pkg => {
      // Only include packages for relevant vehicle types
      if (!vehicleTypeFilters.includes(pkg.vehicle_type)) return;
      
      if (!packageMap.has(pkg.slug)) {
        // Use custom booking flow description if available, otherwise use DB description
        const customDescription = bookingFlowDescriptions[pkg.slug];
        packageMap.set(pkg.slug, {
          id: pkg.slug,
          name: pkg.name,
          description: customDescription || pkg.description || '',
          time: pkg.duration_estimate || '',
          basePrice: Number(pkg.price),
          prices: {},
          is_popular: pkg.is_popular || false,
          sort_order: pkg.sort_order || 0,
          service_id: pkg.service_id,
        });
      }
      const existing = packageMap.get(pkg.slug)!;
      existing.prices[pkg.vehicle_type] = Number(pkg.price);
    });

    return Array.from(packageMap.values()).sort((a, b) => a.sort_order - b.sort_order);
  }, [dbPackages, serviceType, vehicleSubType]);

  // Use database add-ons or fallback
  const addOns = useMemo(() => {
    if (!dbAddOns || dbAddOns.length === 0) {
      return [
        { id: "pet", name: "Pet Hair Removal", price: 35, description: "Deep extraction of pet hair from all surfaces" },
        { id: "headlight", name: "Headlight Restoration", price: 65, description: "Restore clarity to foggy headlights" },
        { id: "engine", name: "Engine Bay Cleaning", price: 55, description: "Detailed cleaning of engine compartment" },
        { id: "odor", name: "Odor Treatment", price: 45, description: "Eliminate stubborn odors with ozone treatment" },
        { id: "interior-extra", name: "Extra Interior Attention", price: 40, description: "Additional deep cleaning for heavily soiled interiors" },
      ];
    }
    return dbAddOns.map(addon => ({
      id: addon.id,
      name: addon.name,
      price: Number(addon.price),
      description: addon.description || '',
    }));
  }, [dbAddOns]);

  // State for dynamic time slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Get the selected package duration for time slot generation
  const selectedPackageDuration = useMemo(() => {
    if (!selectedPackage) return DEFAULT_DURATION;
    return PACKAGE_DURATIONS[selectedPackage] || DEFAULT_DURATION;
  }, [selectedPackage]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (selectedDate && selectedPackage) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, selectedPackage]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoadingSlots(true);
    const dateStr = format(date, "yyyy-MM-dd");
    
    try {
      // Fetch existing bookings for this date
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("id, scheduled_time, duration_minutes")
        .eq("scheduled_date", dateStr)
        .in("status", ["pending", "confirmed", "in_progress"]);

      // Generate available time slots based on service duration and existing bookings
      const slots = generateTimeSlots(
        selectedPackageDuration,
        existingBookings || []
      );
      
      setAvailableSlots(slots);
      setSelectedTime(""); // Reset time selection when date changes
    } catch (error) {
      console.error("Error fetching available slots:", error);
      // Generate slots without conflict checking as fallback
      setAvailableSlots(generateTimeSlots(selectedPackageDuration, []));
    } finally {
      setLoadingSlots(false);
    }
  };

  const recommendations = useMemo(() => 
    getRecommendations(vehicleSubType, selectedPackage), 
    [vehicleSubType, selectedPackage]
  );

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const getPackagePrice = (pkg: { basePrice: number; prices: Record<string, number> }) => {
    // Direct match on UI vehicle sub-type
    if (vehicleSubType && pkg.prices[vehicleSubType]) {
      return pkg.prices[vehicleSubType];
    }
    
    // Try DB vehicle type mapping (for services like Paint Correction that use "car", "suv", "truck")
    if (vehicleSubType && vehicleSubTypeToDbType[vehicleSubType]) {
      for (const dbType of vehicleSubTypeToDbType[vehicleSubType]) {
        if (pkg.prices[dbType]) {
          return pkg.prices[dbType];
        }
      }
    }
    
    return pkg.basePrice;
  };

  const calculateTotal = () => {
    const pkg = packages.find(p => p.id === selectedPackage);
    const packagePrice = pkg ? getPackagePrice(pkg) : 0;
    const addOnsTotal = selectedAddOns.reduce((sum, id) => {
      const addon = addOns.find(a => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);
    return packagePrice + addOnsTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // NOTE: Client-side booking rate limiting removed to avoid false positives
    // (users navigating back/forward, editing details, refreshing, retrying, etc.).
    // Abuse protection should be handled server-side.
    
    const result = bookingCustomerSchema.safeParse(customerInfo);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      toast.error("Please fix the form errors");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!selectedDate) {
        toast.error("Please select a date");
        return;
      }
      if (!selectedTime) {
        toast.error("Please select a time");
        return;
      }
      const scheduledDateStr = selectedDate.toISOString().split("T")[0];
      const scheduledTimeDb = toDbTime(selectedTime);
      if (!scheduledTimeDb) {
        toast.error(`Invalid time: ${selectedTime}`);
        return;
      }
      
      // Get the correct service based on the selected service type
      const serviceSlug = serviceSlugMap[serviceType] || "full-detail";
      
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("id, name, base_price")
        .eq("slug", serviceSlug)
        .single();

      if (serviceError || !service?.id) {
        console.error("Service lookup failed:", serviceError);
        throw new Error(serviceError?.message || "Unable to load service for booking");
      }
      const pkg = packages.find((p) => p.id === selectedPackage);
      const serviceName = pkg?.name || "Detailing Service";
      const totalPrice = getPackagePrice(pkg!);
      const addOnsTotal = selectedAddOns.reduce((sum, id) => {
        const addon = addOns.find(a => a.id === id);
        return sum + (addon?.price || 0);
      }, 0);

      const vehicleTypeLabel = carVehicleTypes.find(v => v.id === vehicleSubType)?.label || serviceType;

      const createPayload = {
        service_id: service.id,
        scheduled_date: scheduledDateStr,
        scheduled_time: selectedTime, // backend normalizes (also accepts HH:MM:SS)
        duration_minutes: selectedPackageDuration, // Include service duration for scheduling

        // Always store customer contact info on the booking, even if admin is creating it
        guest_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        guest_email: customerInfo.email,
        guest_phone: customerInfo.phone,

        vehicle_type: vehicleTypeLabel,
        vehicle_make: customerInfo.vehicleMake || null,
        vehicle_model: customerInfo.vehicleModel || null,
        service_address: customerInfo.address,
        service_city: customerInfo.city,
        service_zip: customerInfo.zip,
        address_notes: customerInfo.notes || null,
        subtotal: totalPrice,
        add_ons_total: addOnsTotal,
        total_price: totalPrice + addOnsTotal,
        // Set status based on payment method
        status: paymentMethod === 'online' ? "pending_payment" : "confirmed",
        payment_status: paymentMethod === 'online' ? "pending" : "unpaid",
        payment_method: paymentMethod || "in_person",
        // Pass add-on IDs so backend creates booking_add_ons records
        add_on_ids: selectedAddOns.length > 0 ? selectedAddOns : undefined,
      };

      // Use backend function to guarantee insert succeeds for guests (and return a booking ID)
      console.log("create-booking payload:", createPayload);
      const { data: createResp, error: createErr } = await supabase.functions.invoke(
        "create-booking",
        { body: createPayload },
      );

      if (createErr) {
        console.error("create-booking error:", createErr);
        throw createErr;
      }

      const createdId = createResp?.booking?.id as string | undefined;
      const manageToken = createResp?.manageToken as string | undefined;
      
      if (!createdId) {
        console.error("create-booking unexpected response:", createResp);
        throw new Error("Booking created but no ID returned");
      }

      setBookingId(createdId);

      // Handle online payment - redirect to Stripe
      if (paymentMethod === 'online') {
        toast.loading("Redirecting to payment...");
        
        try {
          // Call create-checkout without price_id - it will look up from database
          // Pass selected add-on IDs so they appear as separate Stripe line items
          const checkoutResult = await createBookingCheckout(createdId, '', {
            customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            customer_email: user?.email || customerInfo.email,
            service_name: serviceName,
            vehicle_type: vehicleTypeLabel,
            package_slug: selectedPackage || '',
            vehicle_sub_type: vehicleSubType || '',
          }, selectedAddOns.length > 0 ? selectedAddOns : undefined);

          if (checkoutResult?.url) {
            // Redirect to Stripe Checkout
            window.location.href = checkoutResult.url;
            return; // Exit early, user will be redirected
          }
        } catch (checkoutError) {
          console.error("Stripe checkout error:", checkoutError);
          toast.dismiss();
          toast.error("Online payment unavailable. Please choose 'Pay in Person' or try again later.");
          setStripeAvailable(false);
          // Revert the booking status since payment failed
          await supabase.functions.invoke("manage-booking", {
            body: { 
              booking_id: createdId, 
              action: "update",
              updates: { status: "cancelled", payment_status: "failed" }
            }
          });
          setBookingId("");
          return;
        }
      }

      // Confirmation emails are now sent automatically server-side by create-booking
      // No frontend email call needed

      // Send SMS confirmation (non-blocking)
      try {
        await sendBookingSms({
          customerPhone: customerInfo.phone,
          customerName: customerInfo.firstName,
          serviceName: serviceName,
          scheduledDate: selectedDate?.toISOString() || "",
          scheduledTime: selectedTime,
          serviceAddress: customerInfo.address,
          serviceCity: customerInfo.city,
          totalPrice: totalPrice + addOnsTotal,
          bookingId: createdId,
          notifyBusiness: true,
        });
      } catch (smsError) {
        console.error("SMS failed but booking succeeded:", smsError);
      }

      clearRateLimit('booking-form');
      toast.success("Booking confirmed! You'll receive a confirmation email shortly.");
      setStep(7);
    } catch (error: any) {
      console.error("Booking error:", error);
      const code = error?.code || error?.status || error?.name;
      const msg = error?.message || String(error);
      const details = error?.details ? ` | ${error.details}` : "";
      toast.error(`Booking failed${code ? ` (${code})` : ""}: ${msg}${details}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressLabels = () => {
    // Quote-only services have a different flow
    if (quoteOnlyServices.includes(serviceType)) {
      return ["Service", "Quote Request"];
    }
    // Services that need vehicle sub-type selection
    if (servicesWithVehicleSelection.includes(serviceType)) {
      return ["Service", "Vehicle", "Package", "Add-ons", "Schedule", "Payment", "Details"];
    }
    return ["Service", "Package", "Add-ons", "Schedule", "Payment", "Details"];
  };

  const getTotalSteps = () => {
    if (quoteOnlyServices.includes(serviceType)) return 2;
    return servicesWithVehicleSelection.includes(serviceType) ? 7 : 6;
  };

  const isQuoteOnlyService = () => quoteOnlyServices.includes(serviceType);

  const renderStep = () => {
    switch (step) {
      // Step 1: Select Service Type
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What service do you need?</h2>
              <p className="text-muted-foreground">Select the type of detailing service</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {serviceTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setServiceType(type.id);
                    setSelectedPackage(""); // Reset package selection when changing service
                    // Quote-only services go to quote request step
                    if (quoteOnlyServices.includes(type.id)) {
                      setStep(2); // Go to quote request
                    } else if (servicesWithVehicleSelection.includes(type.id)) {
                      setStep(2); // Go to vehicle sub-type selection for car-based services
                    } else {
                      setVehicleSubType(""); // Clear vehicle sub-type for other services
                      setStep(3); // Skip to package selection
                    }
                  }}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all text-center hover:border-primary",
                    serviceType === type.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <type.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      // Step 2: Vehicle Sub-Type OR Quote Request (depends on service)
      case 2:
        // Quote-only services (Ceramic Coating, Aircraft) show quote request form
        if (isQuoteOnlyService()) {
          const quoteServiceLabel = serviceTypes.find(s => s.id === serviceType)?.label || "Service";
          const QuoteIcon = serviceTypes.find(s => s.id === serviceType)?.icon || MessageSquareQuote;
          return (
            <div className="space-y-8">
              <div className="text-center">
                <QuoteIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Request a {quoteServiceLabel} Quote</h2>
                <p className="text-muted-foreground">
                  {serviceType === "ceramic" 
                    ? "Ceramic coating pricing depends on vehicle size, condition, and protection level. We'll provide a custom quote."
                    : "Aircraft detailing requires an on-site assessment. We'll contact you to schedule a consultation."
                  }
                </p>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageSquareQuote className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">What's Included in Your Quote</h3>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        {serviceType === "ceramic" ? (
                          <>
                            <li>• Vehicle inspection & condition assessment</li>
                            <li>• Recommended ceramic coating tier (Lite, Pro, or Elite)</li>
                            <li>• Paint correction requirements if needed</li>
                            <li>• Complete pricing with no hidden fees</li>
                          </>
                        ) : (
                          <>
                            <li>• Aircraft size and type assessment</li>
                            <li>• Exterior and interior cleaning scope</li>
                            <li>• Specialized aviation-safe products</li>
                            <li>• On-site service at your hangar</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quoteFirstName">First Name</Label>
                      <Input 
                        id="quoteFirstName" 
                        required 
                        value={customerInfo.firstName} 
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quoteLastName">Last Name</Label>
                      <Input 
                        id="quoteLastName" 
                        required 
                        value={customerInfo.lastName} 
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quoteEmail">Email</Label>
                      <Input 
                        id="quoteEmail" 
                        type="email" 
                        required 
                        value={customerInfo.email} 
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quotePhone">Phone</Label>
                      <Input 
                        id="quotePhone" 
                        type="tel" 
                        required 
                        value={customerInfo.phone} 
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quoteVehicle">
                      {serviceType === "ceramic" ? "Vehicle Details (Year, Make, Model)" : "Aircraft Details (Type, Size)"}
                    </Label>
                    <Input 
                      id="quoteVehicle" 
                      placeholder={serviceType === "ceramic" ? "e.g., 2024 BMW X5" : "e.g., Cessna 172, Single-Engine"}
                      value={`${customerInfo.vehicleYear} ${customerInfo.vehicleMake} ${customerInfo.vehicleModel}`.trim()} 
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quoteNotes">Additional Details (Optional)</Label>
                    <Textarea 
                      id="quoteNotes" 
                      placeholder={serviceType === "ceramic" 
                        ? "Current vehicle condition, any specific concerns, preferred protection level..."
                        : "Hangar location, scheduling preferences, specific cleaning requirements..."
                      }
                      value={customerInfo.notes} 
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="flex-1 glow-red" 
                  onClick={async () => {
                    // Validate basic fields
                    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
                      toast.error("Please fill in all required fields");
                      return;
                    }
                    
                    setIsSubmitting(true);
                    try {
                      // Send quote request email/notification
                      const { error } = await supabase.functions.invoke('send-contact-email', {
                        body: {
                          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
                          email: customerInfo.email,
                          phone: customerInfo.phone,
                          message: `QUOTE REQUEST: ${serviceTypes.find(s => s.id === serviceType)?.label}\n\nVehicle/Aircraft: ${`${customerInfo.vehicleYear} ${customerInfo.vehicleMake} ${customerInfo.vehicleModel}`.trim() || 'Not specified'}\n\nAdditional Details: ${customerInfo.notes || 'None'}`,
                          subject: `Quote Request: ${serviceTypes.find(s => s.id === serviceType)?.label}`,
                        },
                      });
                      
                      if (error) throw error;
                      
                      toast.success("Quote request submitted! We'll contact you within 24 hours.");
                      setBookingId("quote-" + Date.now()); // Set a pseudo-ID to show confirmation
                    } catch (error) {
                      console.error('Quote request error:', error);
                      toast.error("Failed to submit quote request. Please try again or call us directly.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageSquareQuote className="mr-2 h-4 w-4" />
                      Request Free Quote
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        }

        // Regular vehicle sub-type selection for car-based services
        const ServiceIcon = serviceTypes.find(s => s.id === serviceType)?.icon || Car;
        const serviceLabel = serviceTypes.find(s => s.id === serviceType)?.label || "Detailing";
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Select Your Vehicle Type</h2>
              <p className="text-muted-foreground">
                Choose the type that best matches your vehicle for {serviceLabel}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carVehicleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setVehicleSubType(type.id);
                    setSelectedPackage(""); // Reset package when vehicle changes
                    setStep(3);
                  }}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all text-left hover:border-primary",
                    vehicleSubType === type.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <ServiceIcon className="h-10 w-10 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        );

      // Step 3: Select Package
      case 3:
        const currentServiceLabel = serviceTypes.find(s => s.id === serviceType)?.label || "Detailing";
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Package</h2>
              <p className="text-muted-foreground">
                Select the {currentServiceLabel.toLowerCase()} package that fits your needs
              </p>
            </div>
            {packagesLoading ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Loading packages for {currentServiceLabel}...
                </p>
              </Card>
            ) : packages.length === 0 ? (
              <Card className="p-8 text-center border-amber-500/30 bg-amber-500/5">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-amber-500" />
                <p className="text-muted-foreground mb-4">
                  No packages are currently available for {currentServiceLabel} with your selected vehicle type.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact us for a custom quote or try selecting a different service.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg) => {
                  const price = getPackagePrice(pkg);
                  const isPopular = pkg.is_popular;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={cn(
                        "w-full p-5 rounded-xl border-2 transition-all text-left relative",
                        selectedPackage === pkg.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isPopular && (
                        <span className="absolute -top-3 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {selectedPackage === pkg.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{pkg.name}</h3>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{pkg.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {startingAtPricingServices.includes(serviceType) && (
                            <span className="text-xs text-muted-foreground block">Starting at</span>
                          )}
                          <span className="text-2xl font-bold text-primary">
                            ${price}{startingAtPricingServices.includes(serviceType) ? '+' : ''}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(servicesWithVehicleSelection.includes(serviceType) ? 2 : 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                className="flex-1 glow-red" 
                onClick={() => setStep(4)}
                disabled={!selectedPackage || packages.length === 0}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      // Step 4: Add-ons & Recommendations
      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Optional Add-Ons</h2>
              <p className="text-muted-foreground">Enhance your detail with these extras</p>
            </div>

            {/* Smart Recommendations */}
            {recommendations.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Recommended for Your Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendations.map(({ addonId, reason }) => {
                    const addon = addOns.find(a => a.id === addonId);
                    if (!addon) return null;
                    const isSelected = selectedAddOns.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddOn(addon.id)}
                        className={cn(
                          "w-full p-3 rounded-lg border transition-all text-left flex items-center justify-between",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-primary/30 hover:border-primary bg-background/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Star className="h-4 w-4 text-primary/60" />
                          )}
                          <div>
                            <span className="font-medium">{addon.name}</span>
                            <p className="text-xs text-muted-foreground">{reason}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-primary">${addon.price}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* All Add-ons */}
            <div>
              <h3 className="font-semibold mb-4">All Add-Ons</h3>
              <div className="space-y-3">
                {addOns.map((addon) => {
                  const isSelected = selectedAddOns.includes(addon.id);
                  const isRecommended = recommendations.some(r => r.addonId === addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddOn(addon.id)}
                      className={cn(
                        "w-full p-4 rounded-lg border transition-all text-left flex items-center justify-between",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{addon.name}</span>
                            {isRecommended && (
                              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{addon.description}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-primary">${addon.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Running Total */}
            <Card>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Total</span>
                  <span className="text-2xl font-bold text-primary">${calculateTotal()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                className="flex-1 glow-red" 
                onClick={() => setStep(5)}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      // Step 5: Schedule
      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Pick a Date & Time</h2>
              <p className="text-muted-foreground">Choose when you'd like us to come</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="mb-4 block">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-lg border p-3"
                />
              </div>

              <div>
                <Label className="mb-4 block flex items-center justify-between">
                  <span>Select Time</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Hours: {getWorkingHoursDisplay()}
                  </span>
                </Label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !selectedDate ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Please select a date first
                  </p>
                ) : availableSlots.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                    <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        No available times for this date.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This service requires {formatDuration(selectedPackageDuration)}. Try a different date.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "p-3 rounded-lg border transition-all text-sm",
                            selectedTime === time
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Duration: {formatDuration(selectedPackageDuration)} + 30min buffer between appointments
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                className="flex-1 glow-red" 
                onClick={() => setStep(6)}
                disabled={!selectedDate || !selectedTime}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      // Step 6: Payment Method Selection
      case 6:
        return (
          <PaymentMethodStep
            selectedMethod={paymentMethod}
            onSelectMethod={setPaymentMethod}
            onBack={() => setStep(5)}
            onContinue={() => setStep(7)}
            totalPrice={calculateTotal()}
            stripeAvailable={stripeAvailable}
          />
        );

      // Step 7: Customer Details & Checkout
      case 7:
        // Check if this is confirmation step (after submission)
        if (bookingId) {
          return renderConfirmation();
        }
        
        return (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your Information</h2>
              <p className="text-muted-foreground">Tell us where to come and how to reach you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" required maxLength={50} value={customerInfo.firstName} onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})} className={formErrors.firstName ? "border-destructive" : ""} />
                {formErrors.firstName && <p className="text-sm text-destructive">{formErrors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" required maxLength={50} value={customerInfo.lastName} onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})} className={formErrors.lastName ? "border-destructive" : ""} />
                {formErrors.lastName && <p className="text-sm text-destructive">{formErrors.lastName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required maxLength={255} value={customerInfo.email} onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})} className={formErrors.email ? "border-destructive" : ""} />
                {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" required maxLength={16} placeholder="(225) 521-6264" value={customerInfo.phone} onChange={(e) => {
                  // Strip to digits only
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  let formatted = '';
                  if (digits.length > 0) formatted = '(' + digits.slice(0, 3);
                  if (digits.length >= 3) formatted += ') ' + digits.slice(3, 6);
                  if (digits.length >= 6) formatted += '-' + digits.slice(6, 10);
                  setCustomerInfo({...customerInfo, phone: formatted});
                }} className={formErrors.phone ? "border-destructive" : ""} />
                {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Service Address</Label>
                <Input id="address" placeholder="Street address" required maxLength={200} value={customerInfo.address} onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})} className={formErrors.address ? "border-destructive" : ""} />
                {formErrors.address && <p className="text-sm text-destructive">{formErrors.address}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" required maxLength={100} value={customerInfo.city} onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})} className={formErrors.city ? "border-destructive" : ""} />
                {formErrors.city && <p className="text-sm text-destructive">{formErrors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" required maxLength={10} value={customerInfo.zip} onChange={(e) => setCustomerInfo({...customerInfo, zip: e.target.value})} className={formErrors.zip ? "border-destructive" : ""} />
                {formErrors.zip && <p className="text-sm text-destructive">{formErrors.zip}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleYear">Year</Label>
                <Input id="vehicleYear" type="number" placeholder="2024" required maxLength={4} value={customerInfo.vehicleYear} onChange={(e) => setCustomerInfo({...customerInfo, vehicleYear: e.target.value.slice(0, 4)})} className={formErrors.vehicleYear ? "border-destructive" : ""} />
                {formErrors.vehicleYear && <p className="text-sm text-destructive">{formErrors.vehicleYear}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleMake">Make</Label>
                <Input id="vehicleMake" placeholder="Toyota" required maxLength={50} value={customerInfo.vehicleMake} onChange={(e) => setCustomerInfo({...customerInfo, vehicleMake: e.target.value})} className={formErrors.vehicleMake ? "border-destructive" : ""} />
                {formErrors.vehicleMake && <p className="text-sm text-destructive">{formErrors.vehicleMake}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Model</Label>
                <Input id="vehicleModel" placeholder="Camry" required maxLength={50} value={customerInfo.vehicleModel} onChange={(e) => setCustomerInfo({...customerInfo, vehicleModel: e.target.value})} className={formErrors.vehicleModel ? "border-destructive" : ""} />
                {formErrors.vehicleModel && <p className="text-sm text-destructive">{formErrors.vehicleModel}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea id="notes" placeholder="Gate code, parking instructions, areas of concern, etc." maxLength={1000} value={customerInfo.notes} onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})} />
              </div>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">
                    {serviceTypes.find((s) => s.id === serviceType)?.label}
                  </span>
                </div>
                {vehicleSubType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle Type</span>
                    <span className="font-medium">
                      {carVehicleTypes.find((v) => v.id === vehicleSubType)?.label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium">
                    {packages.find((p) => p.id === selectedPackage)?.name}
                  </span>
                </div>
                {selectedAddOns.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Add-ons</span>
                    <span className="font-medium text-right">
                      {addOns
                        .filter((a) => selectedAddOns.includes(a.id))
                        .map((a) => a.name)
                        .join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">
                    {paymentMethod === 'online' ? 'Pay Online (Stripe)' : 'Pay in Person'}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    ${paymentMethod === 'online' 
                      ? (calculateTotal() + Math.round(calculateTotal() * 0.035 * 100) / 100).toFixed(2)
                      : calculateTotal().toFixed(2)
                    }
                  </span>
                </div>
                {paymentMethod === 'online' && (
                  <p className="text-xs text-muted-foreground">
                    Includes 3.5% processing fee (${(Math.round(calculateTotal() * 0.035 * 100) / 100).toFixed(2)})
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Terms & SMS Consent Checkbox */}
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg bg-secondary/30">
              <Checkbox
                id="smsConsent"
                checked={smsConsent}
                onCheckedChange={(checked) => setSmsConsent(checked === true)}
                className="mt-0.5 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div>
                <label htmlFor="smsConsent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to receive SMS & email reminders from AV Detailing LLC and I have read and accept the{" "}
                   <a href="https://avdetailing.net/booking-terms.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80 font-medium">
                    Booking Terms & Service Agreement
                  </a>.
                </label>
                {!smsConsent && (
                  <p className="text-xs text-destructive mt-1 hidden peer-invalid:block" id="consent-error"></p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(6)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1 glow-red" disabled={isSubmitting || !smsConsent}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {paymentMethod === 'online' ? "Redirecting to Payment..." : "Confirming..."}
                  </>
                ) : (
                  <>
                    {paymentMethod === 'online' ? "Proceed to Payment" : "Confirm Booking"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  const renderConfirmation = () => {
    // Check if this is a quote request confirmation
    const isQuoteConfirmation = bookingId.startsWith('quote-');
    
    if (isQuoteConfirmation) {
      return (
        <div className="text-center py-8">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <div className="w-16 h-16 bg-primary/40 rounded-full flex items-center justify-center">
                <MessageSquareQuote className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-primary/30 animate-ping" />
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Quote Request Received! 📋</h2>
          <p className="text-xl text-primary font-semibold mb-4">
            We'll Be In Touch Soon
          </p>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Our team will review your {serviceTypes.find(s => s.id === serviceType)?.label} request and contact you within 24 hours with a personalized quote.
          </p>
          
          {/* What's Next Card */}
          <div className="space-y-4 max-w-md mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                  What Happens Next?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">1.</span>
                    <span>Our team reviews your request and vehicle details</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">2.</span>
                    <span>We'll call or text you to discuss your needs and answer questions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">3.</span>
                    <span>You'll receive a detailed quote with pricing options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">4.</span>
                    <span>Once approved, we'll schedule your appointment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <a href="/contact">Contact Us</a>
              </Button>
              <Button asChild className="flex-1 glow-red">
                <a href="/">Return Home</a>
              </Button>
            </div>
            
            {/* Contact Info */}
            <p className="text-sm text-muted-foreground pt-4">
              Need faster service? Call us directly at{" "}
              <a href="tel:+12255216264" className="text-primary font-semibold hover:underline">
                (225) 521-6264
              </a>
            </p>
          </div>
        </div>
      );
    }

    // Regular booking confirmation
    return (
      <div className="text-center py-8">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <div className="w-16 h-16 bg-primary/40 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-primary/30 animate-ping" />
        </div>
        
        <h2 className="text-3xl font-bold mb-2">You're All Set! 🎉</h2>
        <p className="text-xl text-primary font-semibold mb-4">
          Booking Confirmed
        </p>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          A confirmation email has been sent to your inbox with all the details. 
          We'll text you when we're on our way!
        </p>
        
        {/* Appointment Summary Card */}
        <div className="space-y-4 max-w-md mx-auto">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                Appointment Summary
              </h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Date</p>
                    <p className="font-medium">
                      {selectedDate?.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Location</p>
                    <p className="font-medium">Mobile service at your address</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* What's Next Card */}
          <Card className="border-muted">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
                What's Next?
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Check your email for confirmation details
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  We'll text you on the day of service
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Clear your vehicle of personal items
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Ensure water & power access nearby
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Add to Calendar Card */}
          {(() => {
            const calServiceName = packages.find(p => p.id === selectedPackage)?.name || "Detailing Service";
            return (
              <Card className="border-muted">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
                    Add to Your Calendar
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        const startDate = selectedDate ? new Date(selectedDate) : new Date();
                        if (selectedTime) {
                          const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                          if (match) {
                            let hours = parseInt(match[1]);
                            const mins = parseInt(match[2]);
                            const ampm = match[3]?.toUpperCase();
                            if (ampm === "PM" && hours < 12) hours += 12;
                            if (ampm === "AM" && hours === 12) hours = 0;
                            startDate.setHours(hours, mins, 0, 0);
                          }
                        }
                        const endDate = addMinutes(startDate, 180);
                        const location = `${customerInfo.address}, ${customerInfo.city}, LA ${customerInfo.zip}`;
                        
                        const event = {
                          id: bookingId || `booking-${Date.now()}`,
                          title: `AV Detailing - ${calServiceName}`,
                          description: `Service: ${calServiceName}\nVehicle: ${customerInfo.vehicleYear} ${customerInfo.vehicleMake} ${customerInfo.vehicleModel}\nLocation: ${location}\n\nQuestions? Call (225) 521-6264\nhttps://avdetailing.net`,
                          location,
                          startDate,
                          endDate,
                        };
                        
                        const icsContent = generateICS(event);
                        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `av-detailing-${format(startDate, "yyyy-MM-dd")}.ics`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        toast.success("Calendar file downloaded!");
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Apple / Outlook (.ics)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        const startDate = selectedDate ? new Date(selectedDate) : new Date();
                        if (selectedTime) {
                          const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                          if (match) {
                            let hours = parseInt(match[1]);
                            const mins = parseInt(match[2]);
                            const ampm = match[3]?.toUpperCase();
                            if (ampm === "PM" && hours < 12) hours += 12;
                            if (ampm === "AM" && hours === 12) hours = 0;
                            startDate.setHours(hours, mins, 0, 0);
                          }
                        }
                        const endDate = addMinutes(startDate, 180);
                        const location = `${customerInfo.address}, ${customerInfo.city}, LA ${customerInfo.zip}`;
                        
                        const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`AV Detailing - ${calServiceName}`)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(`Service: ${calServiceName}\nVehicle: ${customerInfo.vehicleYear} ${customerInfo.vehicleMake} ${customerInfo.vehicleModel}\n\nQuestions? Call (225) 521-6264`)}&location=${encodeURIComponent(location)}`;
                        window.open(googleUrl, "_blank");
                      }}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Google Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <a href="/account">View My Bookings</a>
            </Button>
            <Button asChild className="flex-1 glow-red">
              <a href="/">Return Home</a>
            </Button>
          </div>
          
          {/* Contact Info */}
          <p className="text-sm text-muted-foreground pt-4">
            Questions? Call us at{" "}
            <a href="tel:+12255216264" className="text-primary font-semibold hover:underline">
              (225) 521-6264
            </a>
          </p>
        </div>
      </div>
    );
  };

  const currentStepForProgress = () => {
    // Quote-only services have their own flow
    if (quoteOnlyServices.includes(serviceType)) {
      return step;
    }
    // For services without vehicle selection, we skip step 2, so adjust the progress
    if (!servicesWithVehicleSelection.includes(serviceType) && step >= 3) {
      return step - 1;
    }
    return step;
  };

  return (
    <Layout>
      <section className="section-padding bg-background min-h-[80vh]">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            {/* Progress Bar - Mobile-friendly with horizontal scroll */}
            {!bookingId && step <= getTotalSteps() && (
              <div className="mb-12">
                {/* Mobile: Show active step + progress bar */}
                <div className="md:hidden mb-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">
                      Step {currentStepForProgress()} of {getProgressLabels().length}: {getProgressLabels()[currentStepForProgress() - 1]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(((currentStepForProgress()) / getProgressLabels().length) * 100)}%
                    </span>
                  </div>
                </div>
                
                {/* Desktop: Show all step labels */}
                <div className="hidden md:flex justify-between mb-2">
                  {getProgressLabels().map((label, index) => (
                    <span
                      key={label}
                      className={cn(
                        "text-xs font-medium",
                        currentStepForProgress() > index + 1 
                          ? "text-primary" 
                          : currentStepForProgress() === index + 1 
                            ? "text-foreground" 
                            : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentStepForProgress() - 1) / (getProgressLabels().length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {renderStep()}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BookingPage;
