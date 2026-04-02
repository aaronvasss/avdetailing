import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CalendarIcon, Plus, Search, User, X, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, startOfDay, isBefore } from "date-fns";
import { useWorkersList } from "@/hooks/useWorkersList";
import { resolveAssignedWorkerUserId } from "@/lib/workerAssignments";

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
  { id: "membership", label: "Membership Service", serviceId: "3763f8d6-9045-45d5-99cd-cb878bdceeb8" },
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

// ── Hardcoded package pricing ──
type VehicleBucket = "small" | "large";

const getVehicleBucket = (vehicleType: string): VehicleBucket => {
  if (["sedan", "suv-5"].includes(vehicleType)) return "small";
  return "large"; // suv-8, truck
};

interface PackageDef {
  id: string;
  label: string;
  prices: Record<VehicleBucket, number>;
}

const carPackages: PackageDef[] = [
  { id: "exterior", label: "Exterior Only", prices: { small: 75, large: 85 } },
  { id: "basic", label: "Basic", prices: { small: 120, large: 130 } },
  { id: "silver", label: "Silver", prices: { small: 190, large: 200 } },
  { id: "gold", label: "Gold", prices: { small: 295, large: 320 } },
];

// Silver has a special price for sedan vs suv-5
const getSilverPrice = (vehicleType: string): number => {
  if (vehicleType === "sedan") return 190;
  if (vehicleType === "suv-5") return 195;
  return 200; // large
};

const specialtyServices = ["ceramic", "paint", "boat", "aircraft"];

interface MembershipDef {
  id: string;
  label: string;
  price: number;
}

const membershipPackages: MembershipDef[] = [
  { id: "monthly", label: "Monthly", price: 135 },
  { id: "bi-weekly", label: "Bi-Weekly", price: 130 },
  { id: "weekly", label: "Weekly", price: 130 },
];

const addOnsList = [
  { id: "engine-bay", name: "Engine Bay Cleaning", price: 60 },
  { id: "headlight", name: "Headlight Restoration", price: 70 },
  { id: "odor", name: "Odor Elimination", price: 65 },
  { id: "pet-hair", name: "Pet Hair Removal", price: 45 },
  { id: "clay-bar", name: "Clay Bar Treatment", price: 70 },
];

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  let formatted = "";
  if (digits.length > 0) formatted = "(" + digits.slice(0, 3);
  if (digits.length >= 3) formatted += ") " + digits.slice(3, 6);
  if (digits.length >= 6) formatted += "-" + digits.slice(6, 10);
  return formatted;
};

const DRAFT_KEY = "admin-booking-draft";

interface DraftData {
  form: {
    firstName: string; lastName: string; email: string; phone: string;
    address: string; city: string; zip: string; serviceType: string;
    vehicleType: string; vehicleMake: string; vehicleModel: string; vehicleYear: string;
    scheduledDate?: string; scheduledTime: string; paymentMethod: string;
    internalNotes: string; customerNotes: string; tipAmount: string;
  };
  pricingMode: "package" | "custom";
  selectedPackageId: string;
  selectedAddOns: string[];
  customPrice: string;
  assignedWorkerId: string;
  selectedClientId: string | null;
  selectedClientName: string | null;
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AdminBookingModal({ open, onOpenChange, onSuccess }: AdminBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pricingMode, setPricingMode] = useState<"package" | "custom">("package");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [customPrice, setCustomPrice] = useState("");
  const [assignedWorkerId, setAssignedWorkerId] = useState<string>("unassigned");
  const [useCustomPayRate, setUseCustomPayRate] = useState(false);
  const [customPayType, setCustomPayType] = useState<"percentage" | "flat">("percentage");
  const [customPayRate, setCustomPayRate] = useState("");
  const [workerDefaultPayType, setWorkerDefaultPayType] = useState<"percentage" | "flat">("percentage");
  const [workerDefaultPayRate, setWorkerDefaultPayRate] = useState<string>("");
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const { workers } = useWorkersList();

  // Auto-fetch worker default pay rate when assigned
  const handleWorkerAssign = async (workerId: string) => {
    setAssignedWorkerId(workerId);
    setUseCustomPayRate(false);
    
    if (workerId !== "unassigned") {
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("pay_type, pay_rate")
        .eq("user_id", workerId)
        .maybeSingle();

      if (wp) {
        setWorkerDefaultPayType(wp.pay_type as "percentage" | "flat");
        setWorkerDefaultPayRate(String(wp.pay_rate));
        setCustomPayType(wp.pay_type as "percentage" | "flat");
        setCustomPayRate(String(wp.pay_rate));
      } else {
        setWorkerDefaultPayType("percentage");
        setWorkerDefaultPayRate("");
        setCustomPayType("percentage");
        setCustomPayRate("");
      }
    } else {
      setWorkerDefaultPayType("percentage");
      setWorkerDefaultPayRate("");
      setCustomPayType("percentage");
      setCustomPayRate("");
    }
  };

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const defaultForm = {
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", zip: "",
    serviceType: "", vehicleType: "", vehicleMake: "", vehicleModel: "", vehicleYear: "",
    scheduledDate: undefined as Date | undefined, scheduledTime: "",
    paymentMethod: "in_person", internalNotes: "", customerNotes: "",
    tipAmount: "",
  };

  const [form, setForm] = useState(defaultForm);
  const draftRestoredRef = useRef(false);

  // Restore draft on first open
  useEffect(() => {
    if (open && !draftRestoredRef.current) {
      draftRestoredRef.current = true;
      const draft = loadDraft();
      if (draft) {
        setForm({
          ...draft.form,
          scheduledDate: draft.form.scheduledDate ? new Date(draft.form.scheduledDate) : undefined,
        });
        setPricingMode(draft.pricingMode);
        setSelectedPackageId(draft.selectedPackageId);
        setSelectedAddOns(draft.selectedAddOns);
        setCustomPrice(draft.customPrice);
        setAssignedWorkerId(draft.assignedWorkerId);
        setSelectedClientId(draft.selectedClientId);
        setSelectedClientName(draft.selectedClientName);
      }
    }
    if (!open) {
      draftRestoredRef.current = false;
    }
  }, [open]);

  // Auto-save draft to localStorage
  const saveDraft = useCallback(() => {
    const draft: DraftData = {
      form: {
        ...form,
        scheduledDate: form.scheduledDate ? form.scheduledDate.toISOString() : undefined,
      },
      pricingMode, selectedPackageId, selectedAddOns, customPrice,
      assignedWorkerId, selectedClientId, selectedClientName,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftSavedVisible(true);
    setTimeout(() => setDraftSavedVisible(false), 2000);
  }, [form, pricingMode, selectedPackageId, selectedAddOns, customPrice, assignedWorkerId, selectedClientId, selectedClientName]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [saveDraft, open]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(defaultForm);
    setPricingMode("package");
    setSelectedPackageId("");
    setSelectedAddOns([]);
    setCustomPrice("");
    setAssignedWorkerId("unassigned");
    setUseCustomPayRate(false);
    setCustomPayType("percentage");
    setCustomPayRate("");
    setSelectedClientId(null);
    setSelectedClientName(null);
    setCustomerSearch("");
    toast.info("Form cleared");
  };

  // Search clients as user types
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const search = customerSearch.trim();
        const digitsOnly = search.replace(/\D/g, "");
        
        let query = supabase
          .from("clients")
          .select("id, full_name, first_name, last_name, email, phone, address_line1, city, zip")
          .limit(8);

        if (digitsOnly.length >= 3) {
          query = query.or(`phone.ilike.%${digitsOnly}%,full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        } else {
          query = query.or(`full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data } = await query;
        setCustomerResults(data || []);
        setShowResults(true);
      } catch (err) {
        console.error("Customer search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectClient = (client: any) => {
    const firstName = client.first_name || (client.full_name?.split(" ")[0]) || "";
    const lastName = client.last_name || (client.full_name?.split(" ").slice(1).join(" ")) || "";
    setForm(prev => ({
      ...prev,
      firstName,
      lastName,
      email: client.email || prev.email,
      phone: client.phone ? formatPhone(client.phone) : prev.phone,
      address: client.address_line1 || prev.address,
      city: client.city || prev.city,
      zip: client.zip || prev.zip,
    }));
    setSelectedClientId(client.id);
    setSelectedClientName(client.full_name || `${firstName} ${lastName}`);
    setCustomerSearch("");
    setShowResults(false);
    toast.success(`Loaded details for ${client.full_name || firstName}`);
  };

  const clearSelectedClient = () => {
    setSelectedClientId(null);
    setSelectedClientName(null);
  };

  const selectedService = serviceTypes.find(s => s.id === form.serviceType);
  const isSpecialty = specialtyServices.includes(form.serviceType);
  const isMembership = form.serviceType === "membership";
  const needsVehicleType = ["car", "ceramic", "paint", "membership"].includes(form.serviceType);

  // Calculate package price
  const packagePrice = useMemo(() => {
    if (isSpecialty) return 100; // deposit
    if (isMembership) {
      const mp = membershipPackages.find(p => p.id === selectedPackageId);
      return mp?.price || 0;
    }
    if (!selectedPackageId || !form.vehicleType) return 0;
    const pkg = carPackages.find(p => p.id === selectedPackageId);
    if (!pkg) return 0;
    if (pkg.id === "silver") return getSilverPrice(form.vehicleType);
    return pkg.prices[getVehicleBucket(form.vehicleType)];
  }, [selectedPackageId, form.vehicleType, isSpecialty, isMembership]);

  // Calculate add-ons total
  const addOnsTotal = useMemo(() => {
    return addOnsList
      .filter(a => selectedAddOns.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
  }, [selectedAddOns]);

  const totalPrice = pricingMode === "custom"
    ? parseFloat(customPrice) || 0
    : packagePrice + addOnsTotal;

  const handleChange = (field: string, value: string) => {
    if (field === "phone") value = formatPhone(value);
    setForm(prev => ({ ...prev, [field]: value }));

    if (field === "serviceType") {
      setSelectedPackageId("");
      setSelectedAddOns([]);
      setForm(prev => ({ ...prev, vehicleType: "" }));
    }
    if (field === "vehicleType") {
      setSelectedPackageId("");
    }
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
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
      const selectedAddOnDetails = addOnsList.filter(a => selectedAddOns.includes(a.id));
      const isPastDate = form.scheduledDate ? isBefore(startOfDay(form.scheduledDate), startOfDay(new Date())) : false;
      const resolvedAssignedWorkerId = resolveAssignedWorkerUserId(assignedWorkerId, workers);

      const tipAmountNum = form.tipAmount ? parseFloat(form.tipAmount) : null;

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
          subtotal: pricingMode === "custom" ? totalPrice : packagePrice,
          add_ons_total: pricingMode === "custom" ? 0 : addOnsTotal,
          total_price: totalPrice,
          tip_amount: tipAmountNum && tipAmountNum > 0 ? tipAmountNum : null,
          status: isPastDate ? "completed" : (form.paymentMethod === "in_person" ? "confirmed" : "pending"),
          payment_status: "unpaid",
          assigned_worker_id: resolvedAssignedWorkerId,
           worker_pay_type: resolvedAssignedWorkerId && customPayRate ? customPayType : null,
            worker_pay_rate: resolvedAssignedWorkerId && customPayRate ? parseFloat(customPayRate) : null,
          client_id: selectedClientId,
          add_ons: pricingMode === "package"
            ? selectedAddOnDetails.map(a => ({ add_on_id: a.id, name: a.name, price: a.price }))
            : [],
          skip_notifications: isPastDate,
        },
      });

      if (error) throw new Error(error.message);

      const bookingId = data?.booking?.id || data?.booking_id;

      if (form.internalNotes && bookingId) {
        await supabase.from("booking_internal_notes").insert({
          booking_id: bookingId,
          note: form.internalNotes,
        });
      }

      // Notify assigned worker
        if (resolvedAssignedWorkerId && bookingId) {
        const formatTime12 = (t: string) => {
          const [h, m] = t.split(":");
          const hour = parseInt(h);
          return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
        };
        try {
          await supabase.from("worker_notifications").insert({
            user_id: resolvedAssignedWorkerId,
            title: "You've been assigned a new job! 🚗",
            body: `${selectedService.label} for ${form.firstName} on ${format(form.scheduledDate!, "MMM d, yyyy")} at ${formatTime12(form.scheduledTime)}${form.address ? ` — ${form.address}` : ""}`,
            type: "assignment",
            booking_id: bookingId,
          });
        } catch (notifyErr) {
          console.error("Failed to notify worker:", notifyErr);
        }
      }

      toast.success("Booking created successfully!");
      localStorage.removeItem(DRAFT_KEY);
      onOpenChange(false);
      onSuccess();

      // Reset
      setForm(defaultForm);
      setSelectedPackageId("");
      setSelectedAddOns([]);
      setCustomPrice("");
      setPricingMode("package");
      setAssignedWorkerId("unassigned");
      setUseCustomPayRate(false);
      setCustomPayType("percentage");
      setCustomPayRate("");
      setWorkerDefaultPayType("percentage");
      setWorkerDefaultPayRate("");
      setSelectedClientId(null);
      setSelectedClientName(null);
      setCustomerSearch("");
    } catch (err) {
      console.error("Admin booking error:", err);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            
            {/* Customer Search */}
            <div ref={searchRef} className="relative mb-3">
              {selectedClientId ? (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium flex-1">{selectedClientName}</span>
                  <Badge variant="secondary" className="text-xs">Existing Customer</Badge>
                  <button onClick={clearSelectedClient} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      onFocus={() => customerResults.length > 0 && setShowResults(true)}
                      placeholder="Search existing customer by name, phone, or email..."
                      className="pl-9"
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {showResults && customerResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-60 overflow-y-auto">
                      {customerResults.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b border-border last:border-0"
                        >
                          <p className="text-sm font-medium">{client.full_name || `${client.first_name || ""} ${client.last_name || ""}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.phone && <span>{client.phone}</span>}
                            {client.phone && client.email && <span> · </span>}
                            {client.email && <span>{client.email}</span>}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {showResults && customerSearch.length >= 2 && customerResults.length === 0 && !isSearching && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md px-3 py-3 text-center">
                      <p className="text-sm text-muted-foreground">No matching customers found</p>
                      <p className="text-xs text-muted-foreground mt-1">Fill in the details below to create a new customer</p>
                    </div>
                  )}
                </>
              )}
            </div>

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
            <Input value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Street address" />
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
                      {form.scheduledDate && isBefore(startOfDay(form.scheduledDate), startOfDay(new Date())) && (
                        <Badge variant="outline" className="ml-auto text-xs text-muted-foreground border-muted-foreground/30">Past Date</Badge>
                      )}
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
                      className={cn("p-3 pointer-events-auto")}
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

          {/* ── Pricing Section ── */}
          {form.serviceType && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pricing</h3>

              {/* Mode toggle */}
              <RadioGroup
                value={pricingMode}
                onValueChange={(v) => setPricingMode(v as "package" | "custom")}
                className="flex gap-4 mb-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="package" id="mode-package" />
                  <Label htmlFor="mode-package" className="cursor-pointer text-sm font-medium">Use Package Pricing</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="custom" id="mode-custom" />
                  <Label htmlFor="mode-custom" className="cursor-pointer text-sm font-medium">Custom Price</Label>
                </div>
              </RadioGroup>

              {pricingMode === "package" ? (
                <div className="space-y-4">
                  {/* Specialty deposit notice */}
                  {isSpecialty && (
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm font-medium">Specialty Deposit: <span className="text-primary">$100</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Boat, Aircraft, Ceramic Coating & Paint Correction require a $100 deposit.</p>
                    </div>
                  )}

                  {/* Membership packages */}
                  {isMembership && (
                    <div>
                      <Label className="mb-2 block">Membership Frequency</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {membershipPackages.map(mp => (
                          <button
                            key={mp.id}
                            type="button"
                            onClick={() => setSelectedPackageId(mp.id)}
                            className={cn(
                              "rounded-lg border-2 p-3 text-center transition-all",
                              selectedPackageId === mp.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/40"
                            )}
                          >
                            <p className="text-sm font-semibold">{mp.label}</p>
                            <p className="text-lg font-bold text-primary">${mp.price}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Package selector for car / rv detailing */}
                  {!isSpecialty && !isMembership && (
                    <div>
                      <Label className="mb-2 block">Package</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {carPackages.map(pkg => {
                          const price = form.vehicleType
                            ? (pkg.id === "silver" ? getSilverPrice(form.vehicleType) : pkg.prices[getVehicleBucket(form.vehicleType)])
                            : null;
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => setSelectedPackageId(pkg.id)}
                              className={cn(
                                "rounded-lg border-2 p-3 text-left transition-all",
                                selectedPackageId === pkg.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-muted-foreground/40"
                              )}
                            >
                              <p className="text-sm font-semibold">{pkg.label}</p>
                              {price !== null ? (
                                <p className="text-lg font-bold text-primary">${price}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Select vehicle type</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add-ons */}
                  <div>
                    <Label className="mb-2 block">Add-ons</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {addOnsList.map(addOn => (
                        <div
                          key={addOn.id}
                          onClick={() => toggleAddOn(addOn.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                            selectedAddOns.includes(addOn.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/40"
                          )}
                        >
                          <Checkbox
                            checked={selectedAddOns.includes(addOn.id)}
                            onCheckedChange={() => toggleAddOn(addOn.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{addOn.name}</p>
                          </div>
                          <p className="text-sm font-semibold text-primary">+${addOn.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price breakdown */}
                  {(packagePrice > 0 || addOnsTotal > 0) && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>
                          {isSpecialty
                            ? "Specialty Deposit"
                            : isMembership
                              ? `Membership: ${membershipPackages.find(p => p.id === selectedPackageId)?.label || ""}`
                              : `Package: ${carPackages.find(p => p.id === selectedPackageId)?.label || ""}`}
                        </span>
                        <span className="font-medium">${packagePrice}</span>
                      </div>
                      {selectedAddOns.map(id => {
                        const a = addOnsList.find(x => x.id === id)!;
                        return (
                          <div key={id} className="flex justify-between text-sm text-muted-foreground">
                            <span>+ {a.name}</span>
                            <span>${a.price}</span>
                          </div>
                        );
                      })}
                      <div className={cn("flex justify-between text-sm font-bold", selectedAddOns.length > 0 && "border-t border-border pt-1.5 mt-1.5")}>
                        <span>Total</span>
                        <span className="text-primary">${totalPrice}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Custom price mode */
                <div>
                  <Label>Enter Custom Price ($)</Label>
                  <Input
                    type="number"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 text-lg font-semibold"
                  />
                </div>
              )}
            </div>
          )}

          {/* Assign Technician */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assign Technician</h3>
            <Select value={assignedWorkerId} onValueChange={handleWorkerAssign}>
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {workers.map((w) => (
                  <SelectItem key={w.user_id} value={w.user_id}>{w.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Pay Rate - auto-applied from worker profile */}
            {assignedWorkerId !== "unassigned" && (
              <div className="mt-3 space-y-3">
                {/* Default rate display */}
                {workerDefaultPayRate && !useCustomPayRate && (
                  <div className="p-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Default Pay Rate</p>
                    <p className="text-sm font-semibold">
                      {workerDefaultPayType === "percentage"
                        ? `${workerDefaultPayRate}% of job value`
                        : `$${Number(workerDefaultPayRate).toFixed(2)} flat per job`}
                    </p>
                    {workerDefaultPayType === "percentage" && totalPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Worker earns: <span className="font-semibold text-foreground">
                          ${(totalPrice * (parseFloat(workerDefaultPayRate) / 100)).toFixed(2)}
                        </span>
                        {` (${workerDefaultPayRate}% of $${totalPrice})`}
                      </p>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={useCustomPayRate}
                    onCheckedChange={(checked) => {
                      const isCustom = !!checked;
                      setUseCustomPayRate(isCustom);
                      if (!isCustom && workerDefaultPayRate) {
                        setCustomPayType(workerDefaultPayType);
                        setCustomPayRate(workerDefaultPayRate);
                      }
                    }}
                  />
                  <span className="text-sm">Custom rate for this job</span>
                </label>
                {useCustomPayRate && (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Pay Type</Label>
                      <Select value={customPayType} onValueChange={(v) => setCustomPayType(v as "percentage" | "flat")}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">% of job value</SelectItem>
                          <SelectItem value="flat">Flat amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">{customPayType === "percentage" ? "Percentage" : "Amount ($)"}</Label>
                      <Input
                        type="number"
                        step={customPayType === "percentage" ? "1" : "0.01"}
                        value={customPayRate}
                        onChange={(e) => setCustomPayRate(e.target.value)}
                        placeholder={customPayType === "percentage" ? "25" : "50.00"}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
                {useCustomPayRate && customPayRate && totalPrice > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Worker earns: <span className="font-semibold text-foreground">
                      ${customPayType === "percentage"
                        ? (totalPrice * (parseFloat(customPayRate) / 100)).toFixed(2)
                        : parseFloat(customPayRate).toFixed(2)
                      }
                    </span>
                    {customPayType === "percentage" && ` (${customPayRate}% of $${totalPrice})`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Payment */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment Method</h3>
            <Select value={form.paymentMethod} onValueChange={v => handleChange("paymentMethod", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">Cash / In-Person</SelectItem>
                <SelectItem value="cashapp">Cash App</SelectItem>
                <SelectItem value="zelle">Zelle</SelectItem>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="online">Charge via Stripe</SelectItem>
              </SelectContent>
            </Select>

            {/* Tip Amount for non-online payments */}
            {form.paymentMethod !== "online" && (
              <div className="mt-3">
                <Label>Tip Amount (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.tipAmount || ""}
                  onChange={e => setForm(prev => ({ ...prev, tipAmount: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1"
                />
                {form.tipAmount && parseFloat(form.tipAmount) > 0 && totalPrice > 0 && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Tip</span>
                      <span>${parseFloat(form.tipAmount).toFixed(2)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Collected</span>
                      <span className="text-primary">${(totalPrice + parseFloat(form.tipAmount)).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                Create Booking {totalPrice > 0 ? `— $${totalPrice}` : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
