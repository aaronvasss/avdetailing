import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Ship, Caravan, Plane, Check, ArrowRight, ArrowLeft, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendBookingConfirmation } from "@/lib/email";
import { bookingCustomerSchema } from "@/lib/validations";
import { checkRateLimit, clearRateLimit } from "@/lib/security";

const vehicleTypes = [
  { id: "car", label: "Car/SUV/Truck", icon: Car },
  { id: "boat", label: "Boat", icon: Ship },
  { id: "rv", label: "RV/Motorhome", icon: Caravan },
  { id: "aircraft", label: "Aircraft", icon: Plane },
];

const carServices = [
  { id: "essential", name: "Essential Wash", price: "$79+", time: "1-2 hours" },
  { id: "full", name: "Full Detail", price: "$199+", time: "3-5 hours" },
  { id: "signature", name: "Signature Detail", price: "$349+", time: "5-6 hours" },
  { id: "ceramic", name: "Ceramic Coating", price: "$499+", time: "1-2 days" },
  { id: "correction", name: "Paint Correction", price: "$249+", time: "4-8 hours" },
];

const addOns = [
  { id: "pet", name: "Pet Hair Removal", price: "$35" },
  { id: "headlight", name: "Headlight Restoration", price: "$65" },
  { id: "engine", name: "Engine Bay Detail", price: "$55" },
  { id: "odor", name: "Odor Elimination", price: "$45" },
];

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
  const [vehicleType, setVehicleType] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
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

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    // Client-side rate limiting (5 bookings per hour, 2 hour block)
    const rateCheck = checkRateLimit('booking-form', 5, 3600000, 7200000);
    if (!rateCheck.allowed) {
      const waitTime = rateCheck.blockedUntil 
        ? Math.ceil((rateCheck.blockedUntil.getTime() - Date.now()) / 60000)
        : 60;
      toast.error(`Too many booking attempts. Please wait ${waitTime} minute${waitTime !== 1 ? 's' : ''} or call us.`);
      return;
    }
    
    // Validate with Zod
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
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get service from database
      const { data: services } = await supabase
        .from("services")
        .select("id, name, base_price")
        .limit(10);
      
      // Find matching service or use first one
      const service = services?.[0];
      const serviceName = carServices.find((s) => s.id === selectedService)?.name || "Detailing Service";
      const totalPrice = parseFloat(carServices.find((s) => s.id === selectedService)?.price.replace("$", "").replace("+", "") || "0");
      const addOnsTotal = selectedAddOns.reduce((sum, id) => {
        const addon = addOns.find(a => a.id === id);
        return sum + parseFloat(addon?.price.replace("$", "") || "0");
      }, 0);

      // Create booking
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
          vehicle_type: vehicleType,
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

      // Send confirmation email
      try {
        await sendBookingConfirmation({
          customerEmail: user?.email || customerInfo.email,
          customerName: customerInfo.firstName,
          serviceName: serviceName,
          scheduledDate: selectedDate?.toISOString() || "",
          scheduledTime: selectedTime,
          serviceAddress: customerInfo.address,
          serviceCity: customerInfo.city,
          vehicleInfo: customerInfo.vehicleInfo,
          totalPrice: totalPrice + addOnsTotal,
          bookingId: booking.id,
        });
      } catch (emailError) {
        console.error("Email failed but booking succeeded:", emailError);
      }

      clearRateLimit('booking-form');
      toast.success("Booking confirmed! Check your email for details.");
      setStep(5);
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again or call us.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What are we detailing?</h2>
              <p className="text-muted-foreground">Select your vehicle type</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vehicleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setVehicleType(type.id);
                    setStep(2);
                  }}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all text-center hover:border-primary",
                    vehicleType === type.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <type.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Service</h2>
              <p className="text-muted-foreground">Select the package that fits your needs</p>
            </div>
            <div className="space-y-4">
              {carServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service.id);
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                    selectedService === service.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {selectedService === service.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.time}</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-primary">{service.price}</span>
                </button>
              ))}
            </div>

            {/* Add-ons */}
            <div>
              <h3 className="font-semibold mb-4">Optional Add-Ons</h3>
              <div className="grid grid-cols-2 gap-3">
                {addOns.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddOn(addon.id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-left flex items-center justify-between",
                      selectedAddOns.includes(addon.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-sm">{addon.name}</span>
                    <span className="text-sm font-medium text-primary">{addon.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                className="flex-1 glow-red" 
                onClick={() => setStep(3)}
                disabled={!selectedService}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
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
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                className="flex-1 glow-red" 
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
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
                    {carServices.find((s) => s.id === selectedService)?.name}
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
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
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

      case 5:
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Booking Submitted!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We've received your booking request. You'll receive a confirmation email 
              within 2 hours with your appointment details.
            </p>
            <div className="space-y-4 max-w-sm mx-auto">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span>{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Mobile service at your location</span>
                  </div>
                </CardContent>
              </Card>
              <Button asChild variant="outline" className="w-full">
                <a href="/">Return to Home</a>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <section className="section-padding bg-background min-h-[80vh]">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            {step < 5 && (
              <div className="mb-12">
                <div className="flex justify-between mb-2">
                  {["Vehicle", "Service", "Schedule", "Details"].map((label, index) => (
                    <span
                      key={label}
                      className={cn(
                        "text-xs font-medium",
                        step > index + 1 ? "text-primary" : step === index + 1 ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((step - 1) / 4) * 100}%` }}
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
