import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon, Clock, MapPin, Phone, Mail, User, Car, 
  DollarSign, Save, Loader2, CreditCard, Banknote, StickyNote, 
  Receipt, ExternalLink, CheckCircle2, XCircle, AlertCircle, Wrench
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTimeSlots, getPackageDuration, PACKAGE_DURATIONS, formatDuration } from "@/lib/scheduling";
import { useWorkersList } from "@/hooks/useWorkersList";
import { resolveAssignedWorkerUserId } from "@/lib/workerAssignments";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total_price: number | null;
  subtotal: number | null;
  add_ons_total: number | null;
  deposit_amount: number | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_size: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  customer_notes: string | null;
  duration_minutes: number | null;
  user_id: string | null;
  service_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  assigned_worker_id: string | null;
  services: { name: string; slug: string } | null;
  profile_name?: string | null;
  profile_phone?: string | null;
  profile_email?: string | null;
  custom_service_description?: string | null;
}

interface InternalNote {
  id: string;
  note: string;
  created_at: string;
  created_by: string | null;
}

interface BookingAddOn {
  id: string;
  add_on_id: string | null;
  name: string;
  price: number;
}

interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
}

interface BookingEditDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  isAdmin: boolean;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: AlertCircle, color: "text-yellow-500" },
  { value: "pending_payment", label: "Pending Payment", icon: CreditCard, color: "text-orange-500" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle2, color: "text-blue-500" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "text-purple-500" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "text-green-500" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-500" },
  { value: "no_show", label: "No Show", icon: XCircle, color: "text-gray-500" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "online", label: "Online (Stripe)" },
  { value: "in_person", label: "In Person" },
  { value: "cash", label: "Cash" },
  { value: "cashapp", label: "Cash App" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "check", label: "Check" },
];

export function BookingEditDialog({ booking, open, onOpenChange, onSave, isAdmin }: BookingEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { workers } = useWorkersList();
  
  // Form state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [editAssignedWorkerId, setEditAssignedWorkerId] = useState<string>("unassigned");
  const [editUseCustomPayRate, setEditUseCustomPayRate] = useState(false);
  const [editCustomPayType, setEditCustomPayType] = useState<"percentage" | "flat">("percentage");
  const [editCustomPayRate, setEditCustomPayRate] = useState("");
  const [editTipAmount, setEditTipAmount] = useState("");
  const [workerDefaultPayType, setWorkerDefaultPayType] = useState<"percentage" | "flat">("percentage");
  const [workerDefaultPayRate, setWorkerDefaultPayRate] = useState<string>("");

  // Editable customer fields
  const [editGuestName, setEditGuestName] = useState("");
  const [editGuestEmail, setEditGuestEmail] = useState("");
  const [editGuestPhone, setEditGuestPhone] = useState("");

  // Editable vehicle fields
  const [editVehicleMake, setEditVehicleMake] = useState("");
  const [editVehicleModel, setEditVehicleModel] = useState("");
  const [editVehicleYear, setEditVehicleYear] = useState("");
  const [editVehicleType, setEditVehicleType] = useState("");

  // Editable address fields
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editZip, setEditZip] = useState("");

  // Editable price
  const [editTotalPrice, setEditTotalPrice] = useState("");

  // Add-ons
  const [bookingAddOns, setBookingAddOns] = useState<BookingAddOn[]>([]);
  const [allAddOns, setAllAddOns] = useState<ServiceAddOn[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  // Package info (fetched from service_packages)
  const [packageInfo, setPackageInfo] = useState<{ name: string; price: number } | null>(null);

  // Reschedule notification toggle + post-save state
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [resending, setResending] = useState(false);

  // Draft persistence
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const draftRestoredRef = useRef(false);
  const EDIT_DRAFT_KEY = booking ? `edit-booking-draft-${booking.id}` : "";

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!booking) return;
    const draft = {
      scheduledDate: scheduledDate?.toISOString(),
      scheduledTime, status, paymentStatus, paymentMethod,
      editGuestName, editGuestEmail, editGuestPhone,
      editVehicleMake, editVehicleModel, editVehicleYear, editVehicleType,
      editAddress, editCity, editState, editZip,
      editTotalPrice, editAssignedWorkerId,
      editUseCustomPayRate, editCustomPayType, editCustomPayRate,
      editTipAmount, selectedAddOnIds, newNote,
    };
    localStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(draft));
    setDraftSavedVisible(true);
    setTimeout(() => setDraftSavedVisible(false), 2000);
  }, [
    booking, EDIT_DRAFT_KEY, scheduledDate, scheduledTime, status, paymentStatus, paymentMethod,
    editGuestName, editGuestEmail, editGuestPhone,
    editVehicleMake, editVehicleModel, editVehicleYear, editVehicleType,
    editAddress, editCity, editState, editZip,
    editTotalPrice, editAssignedWorkerId,
    editUseCustomPayRate, editCustomPayType, editCustomPayRate,
    editTipAmount, selectedAddOnIds, newNote,
  ]);

  // Auto-save draft on field changes (debounced)
  useEffect(() => {
    if (!booking || !draftRestoredRef.current) return;
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [saveDraft, booking]);

  // Clear draft helper
  const clearDraft = () => {
    if (EDIT_DRAFT_KEY) localStorage.removeItem(EDIT_DRAFT_KEY);
  };

  // Initialize form when booking changes
  useEffect(() => {
    if (booking) {
      // Check for saved draft
      const draftKey = `edit-booking-draft-${booking.id}`;
      const savedDraft = localStorage.getItem(draftKey);

      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setScheduledDate(draft.scheduledDate ? new Date(draft.scheduledDate) : parseISO(booking.scheduled_date));
          setScheduledTime(draft.scheduledTime ?? booking.scheduled_time);
          setStatus(draft.status ?? booking.status);
          setPaymentStatus(draft.paymentStatus ?? booking.payment_status ?? "unpaid");
          setPaymentMethod(draft.paymentMethod ?? booking.payment_method ?? "in_person");
          setInternalNotes("");
          setEditGuestName(draft.editGuestName ?? booking.guest_name ?? booking.profile_name ?? "");
          setEditGuestEmail(draft.editGuestEmail ?? booking.guest_email ?? booking.profile_email ?? "");
          setEditGuestPhone(draft.editGuestPhone ?? booking.guest_phone ?? booking.profile_phone ?? "");
          setEditVehicleMake(draft.editVehicleMake ?? booking.vehicle_make ?? "");
          setEditVehicleModel(draft.editVehicleModel ?? booking.vehicle_model ?? "");
          setEditVehicleYear(draft.editVehicleYear ?? (booking.vehicle_year ? String(booking.vehicle_year) : ""));
          setEditVehicleType(draft.editVehicleType ?? booking.vehicle_type ?? "");
          setEditAddress(draft.editAddress ?? booking.service_address ?? "");
          setEditCity(draft.editCity ?? booking.service_city ?? "");
          setEditState(draft.editState ?? booking.service_state ?? "LA");
          setEditZip(draft.editZip ?? booking.service_zip ?? "");
          setEditTotalPrice(draft.editTotalPrice ?? (booking.total_price != null ? String(booking.total_price) : ""));
          setEditAssignedWorkerId(draft.editAssignedWorkerId ?? resolveAssignedWorkerUserId(booking.assigned_worker_id, workers) ?? "unassigned");
          setEditUseCustomPayRate(draft.editUseCustomPayRate ?? false);
          setEditCustomPayType(draft.editCustomPayType ?? "percentage");
          setEditCustomPayRate(draft.editCustomPayRate ?? "");
          setEditTipAmount(draft.editTipAmount ?? "");
          setNewNote(draft.newNote ?? "");
          if (draft.selectedAddOnIds) setSelectedAddOnIds(draft.selectedAddOnIds);
          draftRestoredRef.current = true;
        } catch {
          // Invalid draft, fall through to default init
          localStorage.removeItem(draftKey);
        }
      }

      if (!savedDraft) {
        // Default initialization from booking data
        setScheduledDate(parseISO(booking.scheduled_date));
        setScheduledTime(booking.scheduled_time);
        setStatus(booking.status);
        setPaymentStatus(booking.payment_status || "unpaid");
        setPaymentMethod(booking.payment_method || "in_person");
        setInternalNotes("");

        const name = booking.guest_name || booking.profile_name || "";
        setEditGuestName(name);
        setEditGuestEmail(booking.guest_email || booking.profile_email || "");
        setEditGuestPhone(booking.guest_phone || booking.profile_phone || "");

        setEditVehicleMake(booking.vehicle_make || "");
        setEditVehicleModel(booking.vehicle_model || "");
        setEditVehicleYear(booking.vehicle_year ? String(booking.vehicle_year) : "");
        setEditVehicleType(booking.vehicle_type || "");

        setEditAddress(booking.service_address || "");
        setEditCity(booking.service_city || "");
        setEditState(booking.service_state || "LA");
        setEditZip(booking.service_zip || "");

        setEditTotalPrice(booking.total_price != null ? String(booking.total_price) : "");

        setEditAssignedWorkerId(resolveAssignedWorkerUserId(booking.assigned_worker_id, workers) || "unassigned");

        const bAny = booking as any;
        if (bAny.worker_pay_type && bAny.worker_pay_rate != null) {
          setEditCustomPayType(bAny.worker_pay_type as "percentage" | "flat");
          setEditCustomPayRate(String(bAny.worker_pay_rate));
        } else {
          setEditCustomPayType("percentage");
          setEditCustomPayRate("");
        }
        setEditUseCustomPayRate(false);

        setEditTipAmount((booking as any).tip_amount != null ? String((booking as any).tip_amount) : "");
        // Mark draft as "restored" (fresh init) so auto-save starts
        draftRestoredRef.current = true;
      }

      // Fetch worker default pay rate if assigned
      if (booking.assigned_worker_id) {
        const bAny = booking as any;
        fetchWorkerPayRate(booking.assigned_worker_id, bAny.worker_pay_type, bAny.worker_pay_rate);
      } else {
        setWorkerDefaultPayType("percentage");
        setWorkerDefaultPayRate("");
      }

      fetchInternalNotes(booking.id);
      fetchAvailableSlots(booking.scheduled_date, booking.id);
      fetchBookingAddOns(booking.id);
      fetchAllAddOns();
      fetchPackageInfo(booking.service_id, booking.vehicle_type);
      setLastSavedAt(null);
    } else {
      draftRestoredRef.current = false;
    }
  }, [booking, workers]);

  const fetchPackageInfo = async (serviceId: string, vehicleType: string | null) => {
    if (!serviceId) return setPackageInfo(null);
    let q = supabase
      .from("service_packages")
      .select("name, price")
      .eq("service_id", serviceId)
      .eq("is_active", true);
    if (vehicleType) q = q.eq("vehicle_type", vehicleType);
    const { data } = await q.order("sort_order").limit(1);
    if (data && data[0]) setPackageInfo({ name: data[0].name, price: Number(data[0].price) });
    else setPackageInfo(null);
  };

  // Fetch a worker's default pay rate from worker_profiles
  const fetchWorkerPayRate = async (workerId: string, savedPayType?: string, savedPayRate?: number) => {
    const { data: wp } = await supabase
      .from("worker_profiles")
      .select("pay_type, pay_rate")
      .eq("user_id", workerId)
      .maybeSingle();

    if (wp) {
      setWorkerDefaultPayType(wp.pay_type as "percentage" | "flat");
      setWorkerDefaultPayRate(String(wp.pay_rate));

      // If booking has a saved rate that differs from default, mark as custom override
      if (savedPayType && savedPayRate != null) {
        const isCustom = savedPayType !== wp.pay_type || Number(savedPayRate) !== Number(wp.pay_rate);
        setEditUseCustomPayRate(isCustom);
        if (!isCustom) {
          // Using default rate - sync display
          setEditCustomPayType(wp.pay_type as "percentage" | "flat");
          setEditCustomPayRate(String(wp.pay_rate));
        }
      } else {
        // No saved rate - use default
        setEditUseCustomPayRate(false);
        setEditCustomPayType(wp.pay_type as "percentage" | "flat");
        setEditCustomPayRate(String(wp.pay_rate));
      }
    }
  };

  // When worker assignment changes, fetch their default rate
  const handleWorkerChange = async (workerId: string) => {
    setEditAssignedWorkerId(workerId);
    setEditUseCustomPayRate(false);
    
    if (workerId !== "unassigned") {
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("pay_type, pay_rate")
        .eq("user_id", workerId)
        .maybeSingle();

      if (wp) {
        setWorkerDefaultPayType(wp.pay_type as "percentage" | "flat");
        setWorkerDefaultPayRate(String(wp.pay_rate));
        setEditCustomPayType(wp.pay_type as "percentage" | "flat");
        setEditCustomPayRate(String(wp.pay_rate));
      } else {
        setWorkerDefaultPayType("percentage");
        setWorkerDefaultPayRate("");
        setEditCustomPayType("percentage");
        setEditCustomPayRate("");
      }
    } else {
      setWorkerDefaultPayType("percentage");
      setWorkerDefaultPayRate("");
      setEditCustomPayType("percentage");
      setEditCustomPayRate("");
    }
  };

  const fetchBookingAddOns = async (bookingId: string) => {
    const { data } = await supabase
      .from("booking_add_ons")
      .select("id, add_on_id, name, price")
      .eq("booking_id", bookingId);
    
    if (data) {
      setBookingAddOns(data);
      setSelectedAddOnIds(data.map(a => a.add_on_id).filter(Boolean) as string[]);
    }
  };

  const fetchAllAddOns = async () => {
    const { data } = await supabase
      .from("service_add_ons")
      .select("id, name, price")
      .eq("is_active", true);
    
    if (data) setAllAddOns(data.map(a => ({ ...a, price: Number(a.price) })));
  };

  const fetchInternalNotes = async (bookingId: string) => {
    setLoadingNotes(true);
    const { data, error } = await supabase
      .from("booking_internal_notes")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setNotes(data);
    }
    setLoadingNotes(false);
  };

  const fetchAvailableSlots = async (date: string, excludeBookingId: string) => {
    if (!booking) return;
    
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id, scheduled_time, duration_minutes")
      .eq("scheduled_date", date)
      .neq("id", excludeBookingId)
      .neq("status", "cancelled");
    
    const duration = booking.duration_minutes || getPackageDuration(booking.services?.slug || "") || 120;
    const slots = generateTimeSlots(duration, existingBookings || []);
    
    const currentTimeFormatted = booking.scheduled_time;
    if (!slots.includes(currentTimeFormatted)) {
      slots.unshift(currentTimeFormatted);
    }
    
    setAvailableSlots(slots);
  };

  const handleDateChange = async (date: Date | undefined) => {
    setScheduledDate(date);
    if (date && booking) {
      await fetchAvailableSlots(format(date, "yyyy-MM-dd"), booking.id);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !booking) return;
    
    const { error } = await supabase
      .from("booking_internal_notes")
      .insert({
        booking_id: booking.id,
        note: newNote.trim(),
      });
    
    if (error) {
      toast.error("Failed to add note");
    } else {
      toast.success("Note added");
      setNewNote("");
      fetchInternalNotes(booking.id);
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOnIds(prev =>
      prev.includes(addOnId) ? prev.filter(id => id !== addOnId) : [...prev, addOnId]
    );
  };

  const sendRescheduleNotification = async (bookingId: string) => {
    try {
      await supabase.functions.invoke("process-booking-notifications", {
        body: {
          booking_id: bookingId,
          mode: "reschedule",
          subject: "Your AV Detailing Appointment Has Been Updated",
        },
      });
      toast.success("Updated confirmation sent to customer");
    } catch (err) {
      console.error("Reschedule notification error:", err);
      toast.error("Failed to send updated confirmation");
    }
  };

  const handleResendConfirmation = async () => {
    if (!booking) return;
    setResending(true);
    await sendRescheduleNotification(booking.id);
    setResending(false);
  };

  const handleSave = async () => {
    if (!booking || !scheduledDate) return;
    
    setSaving(true);
    
    // Calculate new add-ons total from selected add-ons
    const newAddOnsTotal = selectedAddOnIds.reduce((sum, id) => {
      const addon = allAddOns.find(a => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);

    const totalPrice = editTotalPrice ? parseFloat(editTotalPrice) : booking.total_price;
    // Keep subtotal in sync: subtotal = total - add-ons
    const newSubtotal = totalPrice != null ? Math.max(0, totalPrice - newAddOnsTotal) : booking.subtotal;

    const newAssignedWorkerId = resolveAssignedWorkerUserId(editAssignedWorkerId, workers);
    const previousWorkerId = booking.assigned_worker_id;

    const newDateStr = format(scheduledDate, "yyyy-MM-dd");
    const dateOrTimeChanged = newDateStr !== booking.scheduled_date || scheduledTime !== booking.scheduled_time;

    const updates: Record<string, any> = {
      scheduled_date: newDateStr,
      scheduled_time: scheduledTime,
      status,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      
      guest_name: editGuestName.trim() || null,
      guest_email: editGuestEmail.trim() || null,
      guest_phone: editGuestPhone.trim() || null,
      vehicle_make: editVehicleMake.trim() || null,
      vehicle_model: editVehicleModel.trim() || null,
      vehicle_year: editVehicleYear ? parseInt(editVehicleYear) : null,
      vehicle_type: editVehicleType.trim() || null,
      service_address: editAddress.trim() || null,
      service_city: editCity.trim() || null,
      service_state: editState.trim() || null,
      service_zip: editZip.trim() || null,
      total_price: totalPrice,
      subtotal: newSubtotal,
      add_ons_total: newAddOnsTotal,
      assigned_worker_id: newAssignedWorkerId,
      worker_pay_type: newAssignedWorkerId && editCustomPayRate ? editCustomPayType : null,
      worker_pay_rate: newAssignedWorkerId && editCustomPayRate ? parseFloat(editCustomPayRate) : null,
      tip_amount: editTipAmount && parseFloat(editTipAmount) > 0 ? parseFloat(editTipAmount) : null,
    };
    
    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", booking.id);
    
    if (error) {
      toast.error(`Failed to save: ${error.message}`);
      console.error("Update error:", error);
      setSaving(false);
      return;
    }

    // Sync booking_add_ons: remove old, insert new
    const currentAddOnIds = bookingAddOns.map(a => a.add_on_id).filter(Boolean) as string[];
    const toRemove = currentAddOnIds.filter(id => !selectedAddOnIds.includes(id));
    const toAdd = selectedAddOnIds.filter(id => !currentAddOnIds.includes(id));

    if (toRemove.length > 0) {
      await supabase
        .from("booking_add_ons")
        .delete()
        .eq("booking_id", booking.id)
        .in("add_on_id", toRemove);
    }

    if (toAdd.length > 0) {
      const newRecords = toAdd.map(addOnId => {
        const addon = allAddOns.find(a => a.id === addOnId);
        return {
          booking_id: booking.id,
          add_on_id: addOnId,
          name: addon?.name || "Add-on",
          price: addon?.price || 0,
        };
      });
      await supabase.from("booking_add_ons").insert(newRecords);
    }

    // Save quick internal note if provided
    if (internalNotes.trim()) {
      const { error: noteErr } = await supabase
        .from("booking_internal_notes")
        .insert({ booking_id: booking.id, note: internalNotes.trim() });
      if (!noteErr) {
        setInternalNotes("");
        fetchInternalNotes(booking.id);
      }
    }

    toast.success("Booking updated successfully");

    // Notify worker if assigned or reassigned
    if (newAssignedWorkerId && newAssignedWorkerId !== previousWorkerId) {
      const customerName = editGuestName || booking.profile_name || booking.guest_name || "Customer";
      const firstName = customerName.split(" ")[0];
      const serviceName = booking.custom_service_description || booking.services?.name || "Detailing";
      const formatTime12 = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
      };
      try {
        await supabase.from("worker_notifications").insert({
          user_id: newAssignedWorkerId,
          title: "You've been assigned a new job! 🚗",
          body: `${serviceName} for ${firstName} on ${format(scheduledDate!, "MMM d, yyyy")} at ${formatTime12(scheduledTime)}${editAddress ? ` — ${editAddress}` : ""}`,
          type: "assignment",
          booking_id: booking.id,
        });
      } catch (notifyErr) {
        console.error("Failed to notify worker:", notifyErr);
      }
    }

    // Auto-send review request when status changes to "completed"
    if (status === "completed" && booking.status !== "completed") {
      const customerName = editGuestName || booking.profile_name || booking.guest_name || "Customer";
      const customerPhone = editGuestPhone || booking.profile_phone || booking.guest_phone;
      const customerEmail = editGuestEmail || booking.profile_email || booking.guest_email;

      if (customerPhone || customerEmail) {
        try {
          await supabase.functions.invoke("send-review-request", {
            body: {
              booking_id: booking.id,
              customer_name: customerName,
              customer_phone: customerPhone || undefined,
              customer_email: customerEmail || undefined,
            },
          });
          toast.success("Review request sent to customer");
        } catch (err) {
          console.error("Review request error:", err);
        }
      }
    }

    // Auto-send reschedule confirmation if date/time changed and toggle is on
    if (dateOrTimeChanged && notifyCustomer) {
      await sendRescheduleNotification(booking.id);
    }

    clearDraft();
    setLastSavedAt(Date.now());
    onSave();
    setSaving(false);
    // Keep dialog open so admin can use "Send Updated Confirmation" button
  };

  const handleMarkAsPaid = async (method: string) => {
    if (!booking) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        payment_method: method,
        status: booking.status === "pending_payment" ? "confirmed" : booking.status,
      })
      .eq("id", booking.id);
    
    if (error) {
      toast.error("Failed to mark as paid");
    } else {
      toast.success(`Marked as paid (${method})`);
      setPaymentStatus("paid");
      setPaymentMethod(method);
      if (booking.status === "pending_payment") {
        setStatus("confirmed");
      }
      onSave();
    }
    setSaving(false);
  };

  const generateReceipt = () => {
    if (!booking) return;
    
    const customerName = editGuestName || booking.profile_name || booking.guest_name || "Customer";
    const serviceName = booking.custom_service_description || booking.services?.name || "Detailing Service";
    
    const receiptContent = `
AV DETAILING - RECEIPT
========================
Date: ${format(new Date(), "MMMM d, yyyy")}
Receipt #: ${booking.id.slice(0, 8).toUpperCase()}

CUSTOMER
${customerName}
${editGuestEmail || booking.profile_email || booking.guest_email || ""}
${editGuestPhone || booking.profile_phone || booking.guest_phone || ""}

SERVICE
${serviceName}
${editVehicleMake || ""} ${editVehicleModel || ""} (${editVehicleType || ""})
Date: ${scheduledDate ? format(scheduledDate, "MMMM d, yyyy") : booking.scheduled_date}
Time: ${scheduledTime || booking.scheduled_time}

LOCATION
${editAddress || ""}
${editCity || ""}, ${editState || "LA"} ${editZip || ""}

PAYMENT
${"-".repeat(30)}
Total:         $${(editTotalPrice ? parseFloat(editTotalPrice) : booking.total_price || 0).toFixed(2)}

Payment Method: ${paymentMethod || "N/A"}
Payment Status: ${paymentStatus || "N/A"}

========================
Thank you for your business!
AV Detailing
    `.trim();
    
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${booking.id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Receipt downloaded");
  };

  if (!booking) return null;

  const customerName = editGuestName || booking.profile_name || booking.guest_name || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            Edit Booking
            <Badge variant="outline" className="ml-2">
              #{booking.id.slice(0, 8).toUpperCase()}
            </Badge>
            {draftSavedVisible && (
              <span className="text-xs font-normal text-muted-foreground animate-in fade-in ml-2">
                Draft saved
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Customer</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Customer & Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name</Label>
                    <Input value={editGuestName} onChange={e => setEditGuestName(e.target.value)} placeholder="Customer name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input value={editGuestPhone} onChange={e => setEditGuestPhone(e.target.value)} placeholder="(225) 555-0000" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={editGuestEmail} onChange={e => setEditGuestEmail(e.target.value)} placeholder="email@example.com" type="email" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Street Address</Label>
                  <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Street address" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">City</Label>
                    <Input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Baton Rouge" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <Input value={editState} onChange={e => setEditState(e.target.value)} placeholder="LA" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ZIP</Label>
                    <Input value={editZip} onChange={e => setEditZip(e.target.value)} placeholder="70809" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", opt.color)} />
                            {opt.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Service & Package</Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-0.5">
                  <div className="font-medium">
                    {booking.custom_service_description || booking.services?.name || "Detailing"}
                  </div>
                  {packageInfo ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{packageInfo.name}</span>
                      <span className="font-semibold">${packageInfo.price.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No package matched for {booking.vehicle_type || "vehicle type"}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Duration: {formatDuration(booking.duration_minutes || 120)}
                  </div>
                </div>
              </div>
            </div>

            {/* Assign Technician */}
            {isAdmin && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Assign Technician
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={editAssignedWorkerId} onValueChange={handleWorkerChange}>
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

                  {/* Pay Rate - shows default rate automatically */}
                  {editAssignedWorkerId !== "unassigned" && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      {/* Default rate display */}
                      {workerDefaultPayRate && !editUseCustomPayRate && (
                        <div className="p-2 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">Default Pay Rate</p>
                          <p className="text-sm font-semibold">
                            {workerDefaultPayType === "percentage"
                              ? `${workerDefaultPayRate}% of job value`
                              : `$${Number(workerDefaultPayRate).toFixed(2)} flat per job`}
                          </p>
                          {workerDefaultPayType === "percentage" && (editTotalPrice || booking.total_price) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Worker earns: <span className="font-semibold text-foreground">
                                ${((parseFloat(editTotalPrice) || booking.total_price || 0) * (parseFloat(workerDefaultPayRate) / 100)).toFixed(2)}
                              </span>
                              {` (${workerDefaultPayRate}% of $${parseFloat(editTotalPrice) || booking.total_price || 0})`}
                            </p>
                          )}
                        </div>
                      )}

                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={editUseCustomPayRate}
                          onCheckedChange={(checked) => {
                            const isCustom = !!checked;
                            setEditUseCustomPayRate(isCustom);
                            if (!isCustom && workerDefaultPayRate) {
                              // Reset to default rate
                              setEditCustomPayType(workerDefaultPayType);
                              setEditCustomPayRate(workerDefaultPayRate);
                            }
                          }}
                        />
                        <span className="text-sm">Custom rate for this job</span>
                      </label>
                      {editUseCustomPayRate && (
                        <div className="flex gap-3 items-end">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Pay Type</Label>
                            <Select value={editCustomPayType} onValueChange={(v) => setEditCustomPayType(v as "percentage" | "flat")}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">% of job value</SelectItem>
                                <SelectItem value="flat">Flat amount ($)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">{editCustomPayType === "percentage" ? "Percentage" : "Amount ($)"}</Label>
                            <Input
                              type="number"
                              step={editCustomPayType === "percentage" ? "1" : "0.01"}
                              value={editCustomPayRate}
                              onChange={(e) => setEditCustomPayRate(e.target.value)}
                              placeholder={editCustomPayType === "percentage" ? "25" : "50.00"}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                      {editUseCustomPayRate && editCustomPayRate && (editTotalPrice || booking.total_price) && (
                        <p className="text-xs text-muted-foreground">
                          Worker earns: <span className="font-semibold text-foreground">
                            ${editCustomPayType === "percentage"
                              ? ((parseFloat(editTotalPrice) || booking.total_price || 0) * (parseFloat(editCustomPayRate) / 100)).toFixed(2)
                              : parseFloat(editCustomPayRate).toFixed(2)
                            }
                          </span>
                          {editCustomPayType === "percentage" && ` (${editCustomPayRate}% of $${parseFloat(editTotalPrice) || booking.total_price || 0})`}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {booking.customer_notes && (
              <div className="space-y-2">
                <Label>Customer Notes</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {booking.customer_notes}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Vehicle Tab */}
          <TabsContent value="vehicle" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Make</Label>
                    <Input value={editVehicleMake} onChange={e => setEditVehicleMake(e.target.value)} placeholder="Toyota" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Input value={editVehicleModel} onChange={e => setEditVehicleModel(e.target.value)} placeholder="Camry" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Year</Label>
                    <Input value={editVehicleYear} onChange={e => setEditVehicleYear(e.target.value)} placeholder="2024" type="number" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={editVehicleType} onValueChange={setEditVehicleType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {["sedan","suv-5","suv-8","truck","boat","rv","aircraft"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "MMMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={handleDateChange}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md text-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Duration: {formatDuration(booking.duration_minutes || 120)}</span>
              </div>
              <p className="text-blue-600 dark:text-blue-400 mt-1">
                Includes 30-minute buffer between appointments. Working hours: 6:30 AM – 7:30 PM.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-md border bg-muted/30">
              <Checkbox
                checked={notifyCustomer}
                onCheckedChange={(c) => setNotifyCustomer(!!c)}
              />
              <span className="text-sm">Send reschedule confirmation to customer</span>
            </label>
          </TabsContent>
          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">${(editTotalPrice ? parseFloat(editTotalPrice) : booking.total_price || 0).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Badge 
                    variant={paymentStatus === "paid" ? "default" : paymentStatus === "unpaid" ? "destructive" : "secondary"}
                  >
                    {paymentStatus}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Payment Status</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-sm font-medium capitalize">{paymentMethod || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">Method</div>
                </CardContent>
              </Card>
            </div>

            {isAdmin && (
              <>
                <Separator />
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Price ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={editTotalPrice} 
                      onChange={e => setEditTotalPrice(e.target.value)} 
                      placeholder={String(booking.total_price || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Change the service price. Worker pay will recalculate based on this amount.
                    </p>
                  </div>
                </div>

                {/* Tip Amount (non-online payments) */}
                {paymentMethod !== "online" && paymentMethod !== "stripe" && (
                  <div className="space-y-2">
                    <Label>Tip Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editTipAmount}
                      onChange={e => setEditTipAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    {editTipAmount && parseFloat(editTipAmount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Total collected: <span className="font-semibold text-foreground">
                          ${((parseFloat(editTotalPrice) || booking.total_price || 0) + parseFloat(editTipAmount)).toFixed(2)}
                        </span>
                        {' '}(Service ${(parseFloat(editTotalPrice) || booking.total_price || 0).toFixed(2)} + Tip ${parseFloat(editTipAmount).toFixed(2)})
                      </p>
                    )}
                  </div>
                )}

                {paymentStatus !== "paid" && (
                  <div className="space-y-2">
                    <Label>Quick Actions - Mark as Paid</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid("cash")} disabled={saving}>
                        <Banknote className="h-4 w-4 mr-1" /> Cash
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid("zelle")} disabled={saving}>Zelle</Button>
                      <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid("venmo")} disabled={saving}>Venmo</Button>
                      <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid("check")} disabled={saving}>Check</Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateReceipt}>
                    <Receipt className="h-4 w-4 mr-1" /> Download Receipt
                  </Button>
                  
                  {booking.stripe_payment_intent_id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://dashboard.stripe.com/payments/${booking.stripe_payment_intent_id}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" /> View in Stripe
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Quick Internal Note</Label>
              <Textarea 
                value={internalNotes} 
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add internal notes (not visible to customer)..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Add Detailed Note</Label>
              <div className="flex gap-2">
                <Input 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a timestamped note..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  <StickyNote className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note History</Label>
              {loadingNotes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No notes yet
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notes.map(note => (
                    <div key={note.id} className="p-3 bg-muted rounded-md text-sm">
                      <div className="text-muted-foreground text-xs mb-1">
                        {format(new Date(note.created_at), "MMM d, yyyy h:mm a")}
                      </div>
                      <div>{note.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-3 pt-4 pb-2 mt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            variant="destructive" 
            className="w-full min-h-[44px] text-base"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full min-h-[44px] text-base"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
