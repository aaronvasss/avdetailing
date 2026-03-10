import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowRight, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DepositBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTitle: string;
}

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  let formatted = "";
  if (digits.length > 0) formatted = "(" + digits.slice(0, 3);
  if (digits.length >= 3) formatted += ") " + digits.slice(3, 6);
  if (digits.length >= 6) formatted += "-" + digits.slice(6, 10);
  return formatted;
};

export function DepositBookingModal({ open, onOpenChange, serviceTitle }: DepositBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    vehicleDetails: "",
    conditionDescription: "",
    preferredDate: "",
    preferredTime: "",
  });

  const handleChange = (field: string, value: string) => {
    if (field === "phone") {
      value = formatPhone(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.vehicleDetails) {
      toast.error("Please describe your vehicle or vessel");
      return;
    }
    if (!formData.preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-deposit-checkout", {
        body: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ""),
          service_address: formData.address,
          service_city: formData.city,
          service_zip: formData.zip,
          vehicle_details: formData.vehicleDetails,
          condition_description: formData.conditionDescription,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          service_type: serviceTitle,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("No checkout URL returned");

      window.location.href = data.url;
    } catch (err) {
      console.error("Deposit checkout error:", err);
      toast.error("Unable to start checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Book {serviceTitle}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            $100 deposit to secure your appointment • Final price after inspection
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dep-firstName">First Name *</Label>
              <Input
                id="dep-firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="dep-lastName">Last Name *</Label>
              <Input
                id="dep-lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <Label htmlFor="dep-email">Email *</Label>
            <Input
              id="dep-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="dep-phone">Phone *</Label>
            <Input
              id="dep-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(225) 521-6264"
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="dep-address">Service Address</Label>
            <Input
              id="dep-address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dep-city">City</Label>
              <Input
                id="dep-city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Baton Rouge"
              />
            </div>
            <div>
              <Label htmlFor="dep-zip">ZIP Code</Label>
              <Input
                id="dep-zip"
                value={formData.zip}
                onChange={(e) => handleChange("zip", e.target.value)}
                placeholder="70801"
                maxLength={10}
              />
            </div>
          </div>

          {/* Vehicle / Vessel Details */}
          <div>
            <Label htmlFor="dep-vehicle">Vehicle / Vessel Details *</Label>
            <Input
              id="dep-vehicle"
              value={formData.vehicleDetails}
              onChange={(e) => handleChange("vehicleDetails", e.target.value)}
              placeholder="e.g. 2022 BMW X5, 24ft Pontoon Boat, Cessna 172"
            />
          </div>
          <div>
            <Label htmlFor="dep-condition">Condition & Size Description</Label>
            <Textarea
              id="dep-condition"
              value={formData.conditionDescription}
              onChange={(e) => handleChange("conditionDescription", e.target.value)}
              placeholder="Describe the current condition, any specific concerns, and approximate size..."
              rows={3}
            />
          </div>

          {/* Preferred Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dep-date">Preferred Date *</Label>
              <Input
                id="dep-date"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => handleChange("preferredDate", e.target.value)}
                min={minDate}
              />
            </div>
            <div>
              <Label htmlFor="dep-time">Preferred Time</Label>
              <Input
                id="dep-time"
                type="time"
                value={formData.preferredTime}
                onChange={(e) => handleChange("preferredTime", e.target.value)}
                min="06:30"
                max="19:30"
              />
            </div>
          </div>

          {/* Deposit Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">{serviceTitle}</p>
                <p className="text-xs text-muted-foreground">$100 deposit to book</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Remaining balance determined after on-site inspection
              </p>
            </div>
          </div>

          {/* Terms Consent */}
          <div className="flex items-start space-x-3 p-3 border border-border rounded-lg bg-secondary/30">
            <Checkbox
              id="dep-terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => {
                setTermsAccepted(checked === true);
                if (checked) setShowTermsError(false);
              }}
              className="mt-0.5 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div>
              <label htmlFor="dep-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I agree to receive SMS & email reminders from AV Detailing LLC and I have read and accept the{" "}
                <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  Booking Terms & Service Agreement
                </a>.
              </label>
              {showTermsError && (
                <p className="text-xs text-destructive mt-1">Please agree to the terms to continue</p>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (!termsAccepted) {
                setShowTermsError(true);
                return;
              }
              handleSubmit();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay $100 Deposit
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to Stripe for secure payment. We'll confirm your appointment details via email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
