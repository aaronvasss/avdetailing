import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  price: number;
  frequency: string;
  stripe_price_id: string | null;
}

interface MembershipSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MembershipPlan | null;
}

const vehicleTypes = [
  { id: "sedan", label: "Car (Sedan / Coupe)" },
  { id: "suv-5", label: "SUV (5 seats)" },
  { id: "suv-8", label: "SUV (8 seats / 3-row)" },
  { id: "truck", label: "Truck" },
];

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  let formatted = "";
  if (digits.length > 0) formatted = "(" + digits.slice(0, 3);
  if (digits.length >= 3) formatted += ") " + digits.slice(3, 6);
  if (digits.length >= 6) formatted += "-" + digits.slice(6, 10);
  return formatted;
};

export function MembershipSignupModal({ open, onOpenChange, plan }: MembershipSignupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
  });

  const handleChange = (field: string, value: string) => {
    if (field === "phone") {
      value = formatPhone(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.vehicleType) {
      toast.error("Please select a vehicle type");
      return;
    }
    if (!plan) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-membership-checkout", {
        body: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ""),
          service_address: formData.address,
          service_city: formData.city,
          service_zip: formData.zip,
          vehicle_type: vehicleTypes.find(v => v.id === formData.vehicleType)?.label || formData.vehicleType,
          vehicle_make: formData.vehicleMake,
          vehicle_model: formData.vehicleModel,
          vehicle_year: formData.vehicleYear ? parseInt(formData.vehicleYear) : null,
          membership_plan_id: plan.id,
          plan_slug: plan.slug,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("No checkout URL returned");

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err) {
      console.error("Membership checkout error:", err);
      toast.error("Unable to start checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const billingLabel = plan?.slug === "bi-weekly" ? "$130 every 2 weeks" : plan?.slug === "weekly-premium" ? "$130 per week" : "$135/month";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Subscribe to {plan?.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {billingLabel} • Fill out your info to continue to payment
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(225) 521-6264"
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Service Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Baton Rouge"
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange("zip", e.target.value)}
                placeholder="70801"
                maxLength={10}
              />
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <Label>Vehicle Type *</Label>
            <Select value={formData.vehicleType} onValueChange={(v) => handleChange("vehicleType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((vt) => (
                  <SelectItem key={vt.id} value={vt.id}>
                    {vt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="vehicleMake">Make</Label>
              <Input
                id="vehicleMake"
                value={formData.vehicleMake}
                onChange={(e) => handleChange("vehicleMake", e.target.value)}
                placeholder="Toyota"
              />
            </div>
            <div>
              <Label htmlFor="vehicleModel">Model</Label>
              <Input
                id="vehicleModel"
                value={formData.vehicleModel}
                onChange={(e) => handleChange("vehicleModel", e.target.value)}
                placeholder="Camry"
              />
            </div>
            <div>
              <Label htmlFor="vehicleYear">Year</Label>
              <Input
                id="vehicleYear"
                value={formData.vehicleYear}
                onChange={(e) => handleChange("vehicleYear", e.target.value)}
                placeholder="2024"
                maxLength={4}
              />
            </div>
          </div>

          {/* Selected Plan Summary */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-sm">{plan?.name}</p>
              <p className="text-xs text-muted-foreground">{billingLabel}</p>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to Stripe for secure payment. Your account will be created automatically after payment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
