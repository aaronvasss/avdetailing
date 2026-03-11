import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AdminBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const serviceTypes = [
  { id: "car", label: "Car Detailing", serviceId: "3763f8d6-9045-45d5-99cd-cb878bdceeb8" },
  { id: "ceramic", label: "Ceramic Coating", serviceId: "5017f8e7-3046-4dc4-8254-3bf04c962818" },
  { id: "paint", label: "Paint Correction", serviceId: "806e631d-f058-4cd7-9318-582c60b10a32" },
  { id: "boat", label: "Boat Detailing", serviceId: "c15abb75-415f-499e-a681-7ce59e2faaa5" },
  { id: "rv", label: "RV/Motorhome", serviceId: "895a1ea3-4309-4a75-9406-555cf568b370" },
  { id: "aircraft", label: "Aircraft", serviceId: "71c8e20e-4bdf-42b8-ba46-d7565121c9d9" },
];

const vehicleTypes = [
  { id: "sedan", label: "Car (Sedan / Coupe)" },
  { id: "suv-5", label: "SUV (5 seats)" },
  { id: "suv-8", label: "SUV (8 seats / 3-row)" },
  { id: "truck", label: "Truck" },
];

const timeSlots = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00",
];

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  let formatted = "";
  if (digits.length > 0) formatted = "(" + digits.slice(0, 3);
  if (digits.length >= 3) formatted += ") " + digits.slice(3, 6);
  if (digits.length >= 6) formatted += "-" + digits.slice(6, 10);
  return formatted;
};

interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  price: number;
  vehicle_type: string;
  description: string | null;
  duration_estimate: string | null;
}

export function AdminBookingModal({ open, onOpenChange, onSuccess }: AdminBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    serviceType: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    packageId: "",
    scheduledDate: undefined as Date | undefined,
    scheduledTime: "",
    paymentMethod: "in_person",
    internalNotes: "",
    customerNotes: "",
    totalPrice: "",
  });

  const selectedService = serviceTypes.find(s => s.id === form.serviceType);

  // Fetch packages when service + vehicle type change
  useEffect(() => {
    if (!form.serviceType) return;
    
    const fetchPackages = async () => {
      const serviceId = selectedService?.serviceId;
      if (!serviceId) return;

      let query = supabase
        .from("service_packages")
        .select("*")
        .eq("service_id", serviceId)
        .eq("is_active", true)
        .order("sort_order");

      if (form.vehicleType) {
        query = query.in("vehicle_type", [form.vehicleType, "all"]);
      }

      const { data } = await query;
      setPackages(data || []);
    };

    fetchPackages();
  }, [form.serviceType, form.vehicleType]);

  // Fetch add-ons when service changes
  useEffect(() => {
    if (!selectedService) return;
    
    const fetchAddOns = async () => {
      const { data } = await supabase
        .from("service_add_ons")
        .select("id, name, price, description")
        .eq("service_id", selectedService.serviceId)
        .eq("is_active", true);
      setAddOns(data || []);
      setSelectedAddOns([]);
    };

    fetchAddOns();
  }, [form.serviceType]);

  // Auto-calculate total price when package or add-ons change
  useEffect(() => {
    const pkg = packages.find(p => p.id === form.packageId);
    if (pkg) {
      const addOnsTotal = addOns
        .filter(a => selectedAddOns.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0);
      setForm(prev => ({ ...prev, totalPrice: (pkg.price + addOnsTotal).toString() }));
    }
  }, [form.packageId, selectedAddOns, packages, addOns]);

  const handleChange = (field: string, value: string) => {
    if (field === "phone") value = formatPhone(value);
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Reset dependent fields
    if (field === "serviceType") {
      setForm(prev => ({ ...prev, packageId: "", vehicleType: "", totalPrice: "" }));
      setSelectedAddOns([]);
    }
    if (field === "vehicleType") {
      setForm(prev => ({ ...prev, packageId: "", totalPrice: "" }));
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) ? prev.filter(id => id !== addOnId) : [...prev, addOnId]
    );
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.serviceType || !form.scheduledDate || !form.scheduledTime) {
      toast.error("Please fill in required fields: name, service, date, and time");
      return;
    }

    if (!selectedService) return;
    setIsSubmitting(true);

    try {
      const addOnsTotal = addOns
        .filter(a => selectedAddOns.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0);
      
      const pkg = packages.find(p => p.id === form.packageId);
      const subtotal = pkg?.price || parseFloat(form.totalPrice) || 0;
      const totalPrice = subtotal + addOnsTotal;

      // Use the create-booking edge function
      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: {
          service_id: selectedService.serviceId,
          scheduled_date: format(form.scheduledDate!, "yyyy-MM-dd"),
          scheduled_time: form.scheduledTime + ":00",
          guest_name: `${form.firstName} ${form.lastName}`,
          guest_email: form.email || null,
          guest_phone: form.phone.replace(/\D/g, "") || null,
          vehicle_type: form.vehicleType || null,
          vehicle_make: form.vehicleMake || null,
          vehicle_model: form.vehicleModel || null,
          vehicle_year: form.vehicleYear ? parseInt(form.vehicleYear) : null,
          vehicle_size: form.vehicleType || null,
          service_address: form.address || null,
          service_city: form.city || null,
          service_zip: form.zip || null,
          customer_notes: form.customerNotes || null,
          payment_method: form.paymentMethod,
          subtotal,
          add_ons_total: addOnsTotal,
          total_price: totalPrice,
          status: form.paymentMethod === "in_person" ? "confirmed" : "pending",
          payment_status: form.paymentMethod === "in_person" ? "unpaid" : "unpaid",
          add_ons: selectedAddOns.map(id => {
            const addOn = addOns.find(a => a.id === id);
            return { add_on_id: id, name: addOn?.name || "", price: addOn?.price || 0 };
          }),
        },
      });

      if (error) throw new Error(error.message);

      // Add internal notes if provided
      if (form.internalNotes && data?.booking_id) {
        await supabase.from("booking_internal_notes").insert({
          booking_id: data.booking_id,
          note: form.internalNotes,
        });
      }

      toast.success("Booking created successfully!");
      onOpenChange(false);
      onSuccess();

      // Reset form
      setForm({
        firstName: "", lastName: "", email: "", phone: "",
        address: "", city: "", zip: "",
        serviceType: "", vehicleType: "", vehicleMake: "", vehicleModel: "", vehicleYear: "",
        packageId: "", scheduledDate: undefined, scheduledTime: "",
        paymentMethod: "in_person", internalNotes: "", customerNotes: "", totalPrice: "",
      });
      setSelectedAddOns([]);
    } catch (err) {
      console.error("Admin booking error:", err);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsVehicleType = ["car", "ceramic", "paint"].includes(form.serviceType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} placeholder="First name" />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(225) 555-0000" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Service Location</h3>
            <div className="space-y-3">
              <Input value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Street address" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.city} onChange={e => handleChange("city", e.target.value)} placeholder="City" />
                <Input value={form.zip} onChange={e => handleChange("zip", e.target.value)} placeholder="ZIP" maxLength={10} />
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Service *</h3>
            <Select value={form.serviceType} onValueChange={v => handleChange("serviceType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Type */}
          {needsVehicleType && (
            <div>
              <Label>Vehicle Type</Label>
              <Select value={form.vehicleType} onValueChange={v => handleChange("vehicleType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vehicle Details */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Make</Label>
              <Input value={form.vehicleMake} onChange={e => handleChange("vehicleMake", e.target.value)} placeholder="Toyota" />
            </div>
            <div>
              <Label>Model</Label>
              <Input value={form.vehicleModel} onChange={e => handleChange("vehicleModel", e.target.value)} placeholder="Camry" />
            </div>
            <div>
              <Label>Year</Label>
              <Input value={form.vehicleYear} onChange={e => handleChange("vehicleYear", e.target.value)} placeholder="2024" maxLength={4} />
            </div>
          </div>

          {/* Package Selection */}
          {packages.length > 0 && (
            <div>
              <Label>Package</Label>
              <Select value={form.packageId} onValueChange={v => handleChange("packageId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} — ${pkg.price} {pkg.duration_estimate ? `(${pkg.duration_estimate})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Add-ons */}
          {addOns.length > 0 && (
            <div>
              <Label className="mb-2 block">Add-ons</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {addOns.map(addOn => (
                  <div key={addOn.id} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                    <Checkbox
                      checked={selectedAddOns.includes(addOn.id)}
                      onCheckedChange={() => toggleAddOn(addOn.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{addOn.name}</p>
                      <p className="text-xs text-muted-foreground">${addOn.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Schedule *</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.scheduledDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.scheduledDate ? format(form.scheduledDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.scheduledDate}
                      onSelect={(date) => {
                        setForm(prev => ({ ...prev, scheduledDate: date }));
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Time</Label>
                <Select value={form.scheduledTime} onValueChange={v => handleChange("scheduledTime", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>
                        {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Payment & Price */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => handleChange("paymentMethod", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">Cash / In-Person</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="online">Charge via Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total Price ($)</Label>
                <Input
                  type="number"
                  value={form.totalPrice}
                  onChange={e => handleChange("totalPrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notes</h3>
            <div className="space-y-3">
              <div>
                <Label>Customer Notes</Label>
                <Textarea
                  value={form.customerNotes}
                  onChange={e => handleChange("customerNotes", e.target.value)}
                  placeholder="Notes visible to customer..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Internal Notes (admin only)</Label>
                <Textarea
                  value={form.internalNotes}
                  onChange={e => handleChange("internalNotes", e.target.value)}
                  placeholder="Private notes for staff..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Booking {form.totalPrice ? `— $${form.totalPrice}` : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}