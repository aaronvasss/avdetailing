import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Ship, Caravan, Plane, Check, ArrowRight, ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Sparkles, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendBookingConfirmation } from "@/lib/email";
import { bookingCustomerSchema } from "@/lib/validations";
import { checkRateLimit, clearRateLimit } from "@/lib/security";
import { useQuery } from "@tanstack/react-query";

// Step 1: Service Types
const serviceTypes = [
  { id: "car", label: "Car Detailing", icon: Car },
  { id: "boat", label: "Boat Detailing", icon: Ship },
  { id: "rv", label: "RV/Motorhome", icon: Caravan },
  { id: "aircraft", label: "Aircraft", icon: Plane },
];

// Step 2: Vehicle sub-types for Car Detailing
const carVehicleTypes = [
  { id: "sedan", label: "Car (Sedan / Coupe)", description: "Standard-size vehicles" },
  { id: "suv-5", label: "SUV (5 seats)", description: "Mid-size SUVs and crossovers" },
  { id: "suv-8", label: "SUV (8 seats / 3-row)", description: "Large SUVs and full-size vehicles" },
  { id: "truck", label: "Truck", description: "Pickup trucks of all sizes" },
];

// Fallback packages in case database fetch fails
const fallbackPackages = [
  { 
    id: "basic", 
    name: "Basic Package", 
    basePrice: 79,
    prices: { sedan: 79, "suv-5": 99, "suv-8": 119, truck: 109 },
    time: "1-2 hours",
    description: "Essential exterior wash and interior wipe-down"
  },
  { 
    id: "silver", 
    name: "Silver Package", 
    basePrice: 199,
    prices: { sedan: 199, "suv-5": 249, "suv-8": 299, truck: 279 },
    time: "3-5 hours",
    description: "Full interior & exterior detail"
  },
  { 
    id: "gold", 
    name: "Gold Package", 
    basePrice: 349,
    prices: { sedan: 349, "suv-5": 429, "suv-8": 499, truck: 469 },
    time: "5-6 hours",
    description: "Comprehensive detail with 2-month sealant & seat shampooing"
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

const timeSlots = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

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
  
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    vehicleInfo: "",
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

  // Transform database packages into the format needed by the UI
  const packages = useMemo(() => {
    if (!dbPackages || dbPackages.length === 0) return fallbackPackages;

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
    }>();

    dbPackages.forEach(pkg => {
      if (!packageMap.has(pkg.slug)) {
        packageMap.set(pkg.slug, {
          id: pkg.slug,
          name: pkg.name,
          description: pkg.description || '',
          time: pkg.duration_estimate || '',
          basePrice: Number(pkg.price),
          prices: {},
          is_popular: pkg.is_popular || false,
          sort_order: pkg.sort_order || 0,
        });
      }
      const existing = packageMap.get(pkg.slug)!;
      existing.prices[pkg.vehicle_type] = Number(pkg.price);
    });

    return Array.from(packageMap.values()).sort((a, b) => a.sort_order - b.sort_order);
  }, [dbPackages]);

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
    if (vehicleSubType && pkg.prices[vehicleSubType]) {
      return pkg.prices[vehicleSubType];
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
    
    const rateCheck = checkRateLimit('booking-form', 5, 3600000, 7200000);
    if (!rateCheck.allowed) {
      const waitTime = rateCheck.blockedUntil 
        ? Math.ceil((rateCheck.blockedUntil.getTime() - Date.now()) / 60000)
        : 60;
      toast.error(`Too many booking attempts. Please wait ${waitTime} minute${waitTime !== 1 ? 's' : ''} or call us.`);
      return;
    }
    
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
      
      // Get the correct service based on the selected service type
      const serviceSlugMap: Record<string, string> = {
        car: "full-detail",
        boat: "boat-detail",
        rv: "rv-detail",
        aircraft: "aircraft-detail"
      };
      
      const { data: service } = await supabase
        .from("services")
        .select("id, name, base_price")
        .eq("slug", serviceSlugMap[serviceType] || "full-detail")
        .single();
      const pkg = packages.find((p) => p.id === selectedPackage);
      const serviceName = pkg?.name || "Detailing Service";
      const totalPrice = getPackagePrice(pkg!);
      const addOnsTotal = selectedAddOns.reduce((sum, id) => {
        const addon = addOns.find(a => a.id === id);
        return sum + (addon?.price || 0);
      }, 0);

      const vehicleTypeLabel = carVehicleTypes.find(v => v.id === vehicleSubType)?.label || serviceType;

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user?.id || null,
          service_id: service?.id,
          scheduled_date: selectedDate?.toISOString().split("T")[0],
          scheduled_time: selectedTime,
          guest_name: user ? null : `${customerInfo.firstName} ${customerInfo.lastName}`,
          guest_email: user ? null : customerInfo.email,
          guest_phone: user ? null : customerInfo.phone,
          vehicle_type: vehicleTypeLabel,
          vehicle_make: customerInfo.vehicleInfo.split(" ")[1] || null,
          vehicle_model: customerInfo.vehicleInfo.split(" ").slice(2).join(" ") || null,
          service_address: customerInfo.address,
          service_city: customerInfo.city,
          service_zip: customerInfo.zip,
          address_notes: customerInfo.notes || null,
          subtotal: totalPrice,
          add_ons_total: addOnsTotal,
          total_price: totalPrice + addOnsTotal,
          status: "pending",
          payment_status: "unpaid",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      setBookingId(booking.id);

      try {
        const selectedAddOnDetails = selectedAddOns.map(id => {
          const addon = addOns.find(a => a.id === id);
          return addon ? { name: addon.name, price: addon.price } : null;
        }).filter(Boolean) as { name: string; price: number }[];

        await sendBookingConfirmation({
          customerEmail: user?.email || customerInfo.email,
          customerName: customerInfo.firstName,
          serviceName: serviceName,
          scheduledDate: selectedDate?.toISOString() || "",
          scheduledTime: selectedTime,
          serviceAddress: customerInfo.address,
          serviceCity: customerInfo.city,
          serviceState: "LA",
          serviceZip: customerInfo.zip,
          vehicleInfo: customerInfo.vehicleInfo,
          vehicleType: vehicleTypeLabel,
          totalPrice: totalPrice + addOnsTotal,
          bookingId: booking.id,
          basePrice: totalPrice,
          addOns: selectedAddOnDetails,
          customerPhone: customerInfo.phone,
          depositAmount: 0,
          parkingInstructions: customerInfo.notes || undefined,
        });
      } catch (emailError) {
        console.error("Email failed but booking succeeded:", emailError);
      }

      clearRateLimit('booking-form');
      toast.success("Booking confirmed! Check your email for details.");
      setStep(6);
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again or call us.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressLabels = () => {
    if (serviceType === "car") {
      return ["Service", "Vehicle", "Package", "Add-ons", "Schedule", "Details"];
    }
    return ["Service", "Package", "Add-ons", "Schedule", "Details"];
  };

  const getTotalSteps = () => {
    return serviceType === "car" ? 6 : 5;
  };

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
                    if (type.id === "car") {
                      setStep(2); // Go to vehicle sub-type selection
                    } else {
                      setVehicleSubType(""); // Clear vehicle sub-type for non-car
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

      // Step 2: Select Vehicle Sub-Type (Car Detailing only)
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Select Your Vehicle Type</h2>
              <p className="text-muted-foreground">Choose the type that best matches your vehicle</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carVehicleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setVehicleSubType(type.id);
                    setStep(3);
                  }}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all text-left hover:border-primary",
                    vehicleSubType === type.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Car className="h-10 w-10 text-primary flex-shrink-0" />
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
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Package</h2>
              <p className="text-muted-foreground">Select the detail level that fits your needs</p>
            </div>
            <div className="space-y-4">
              {packages.map((pkg) => {
                const price = getPackagePrice(pkg);
                const isPopular = pkg.id === "silver";
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
                      <span className="text-2xl font-bold text-primary">${price}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(serviceType === "car" ? 2 : 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                className="flex-1 glow-red" 
                onClick={() => setStep(4)}
                disabled={!selectedPackage}
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
                <Label className="mb-4 block">Select Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
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

      // Step 6: Customer Details & Checkout
      case 6:
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
                <Input id="phone" type="tel" required maxLength={20} value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} className={formErrors.phone ? "border-destructive" : ""} />
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vehicleInfo">Vehicle Details</Label>
                <Input id="vehicleInfo" placeholder="Year, Make, Model (e.g., 2020 Toyota Camry)" required maxLength={200} value={customerInfo.vehicleInfo} onChange={(e) => setCustomerInfo({...customerInfo, vehicleInfo: e.target.value})} className={formErrors.vehicleInfo ? "border-destructive" : ""} />
                {formErrors.vehicleInfo && <p className="text-sm text-destructive">{formErrors.vehicleInfo}</p>}
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
                <div className="border-t pt-4 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">${calculateTotal()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(5)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1 glow-red" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Confirm Booking"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  const renderConfirmation = () => (
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
          <a href="tel:+12252268979" className="text-primary font-semibold hover:underline">
            (225) 226-8979
          </a>
        </p>
      </div>
    </div>
  );

  const currentStepForProgress = () => {
    // For non-car services, we skip step 2, so adjust the progress
    if (serviceType !== "car" && step >= 3) {
      return step - 1;
    }
    return step;
  };

  return (
    <Layout>
      <section className="section-padding bg-background min-h-[80vh]">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            {!bookingId && step <= getTotalSteps() && (
              <div className="mb-12">
                <div className="flex justify-between mb-2">
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
