import { useState, useEffect } from "react";
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
import { 
  Calendar as CalendarIcon, Clock, MapPin, Phone, Mail, User, Car, 
  DollarSign, Save, Loader2, CreditCard, Banknote, StickyNote, 
  Receipt, ExternalLink, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTimeSlots, getPackageDuration, PACKAGE_DURATIONS, formatDuration } from "@/lib/scheduling";

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
  internal_notes: string | null;
  duration_minutes: number | null;
  user_id: string | null;
  service_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  services: { name: string; slug: string } | null;
  profile_name?: string | null;
  profile_phone?: string | null;
  profile_email?: string | null;
}

interface InternalNote {
  id: string;
  note: string;
  created_at: string;
  created_by: string | null;
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
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "check", label: "Check" },
];

export function BookingEditDialog({ booking, open, onOpenChange, onSave, isAdmin }: BookingEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
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

  // Initialize form when booking changes
  useEffect(() => {
    if (booking) {
      setScheduledDate(parseISO(booking.scheduled_date));
      setScheduledTime(booking.scheduled_time);
      setStatus(booking.status);
      setPaymentStatus(booking.payment_status || "unpaid");
      setPaymentMethod(booking.payment_method || "in_person");
      setInternalNotes(booking.internal_notes || "");
      fetchInternalNotes(booking.id);
      fetchAvailableSlots(booking.scheduled_date, booking.id);
    }
  }, [booking]);

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
    
    // Get existing bookings for the date
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id, scheduled_time, duration_minutes")
      .eq("scheduled_date", date)
      .neq("id", excludeBookingId)
      .neq("status", "cancelled");
    
    const duration = booking.duration_minutes || getPackageDuration(booking.services?.slug || "") || 120;
    const slots = generateTimeSlots(duration, existingBookings || []);
    
    // Add current time if not in slots
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

  const handleSave = async () => {
    if (!booking || !scheduledDate) return;
    
    setSaving(true);
    
    const updates: any = {
      scheduled_date: format(scheduledDate, "yyyy-MM-dd"),
      scheduled_time: scheduledTime,
      status,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      internal_notes: internalNotes || null,
    };
    
    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", booking.id);
    
    if (error) {
      toast.error("Failed to save changes");
      console.error("Update error:", error);
    } else {
      toast.success("Booking updated successfully");

      // Auto-send review request when status changes to "completed"
      if (status === "completed" && booking.status !== "completed") {
        const customerName = booking.profile_name || booking.guest_name || "Customer";
        const customerPhone = booking.profile_phone || booking.guest_phone;
        const customerEmail = booking.profile_email || booking.guest_email;

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
            // Don't show error to admin - review request is secondary
          }
        }
      }

      onSave();
      onOpenChange(false);
    }
    
    setSaving(false);
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
    
    const customerName = booking.profile_name || booking.guest_name || "Customer";
    const serviceName = booking.services?.name || "Detailing Service";
    
    const receiptContent = `
AV DETAILING - RECEIPT
========================
Date: ${format(new Date(), "MMMM d, yyyy")}
Receipt #: ${booking.id.slice(0, 8).toUpperCase()}

CUSTOMER
${customerName}
${booking.profile_email || booking.guest_email || ""}
${booking.profile_phone || booking.guest_phone || ""}

SERVICE
${serviceName}
${booking.vehicle_make || ""} ${booking.vehicle_model || ""} (${booking.vehicle_type || ""})
Date: ${format(parseISO(booking.scheduled_date), "MMMM d, yyyy")}
Time: ${booking.scheduled_time}

LOCATION
${booking.service_address || ""}
${booking.service_city || ""}, ${booking.service_state || "LA"} ${booking.service_zip || ""}

PAYMENT
${"-".repeat(30)}
Subtotal:      $${(booking.subtotal || booking.total_price || 0).toFixed(2)}
Add-ons:       $${(booking.add_ons_total || 0).toFixed(2)}
${"-".repeat(30)}
TOTAL:         $${(booking.total_price || 0).toFixed(2)}

Payment Method: ${booking.payment_method || "N/A"}
Payment Status: ${booking.payment_status || "N/A"}

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

  const customerName = booking.profile_name || booking.guest_name || "Unknown";
  const customerPhone = booking.profile_phone || booking.guest_phone;
  const customerEmail = booking.profile_email || booking.guest_email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Booking
            <Badge variant="outline" className="ml-2">
              #{booking.id.slice(0, 8).toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="font-medium">{customerName}</div>
                  {customerPhone && (
                    <a href={`tel:${customerPhone}`} className="text-primary hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customerPhone}
                    </a>
                  )}
                  {customerEmail && (
                    <a href={`mailto:${customerEmail}`} className="text-primary hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customerEmail}
                    </a>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="font-medium">
                    {booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}
                  </div>
                  <div className="text-muted-foreground">
                    Type: {booking.vehicle_type} • Size: {booking.vehicle_size}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Location
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.service_address}, ${booking.service_city}, ${booking.service_state} ${booking.service_zip}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {booking.service_address}, {booking.service_city}, {booking.service_state} {booking.service_zip}
                </a>
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
                <Label>Service</Label>
                <Input 
                  value={`${booking.services?.name || "Detailing"} (${formatDuration(booking.duration_minutes || 120)})`} 
                  disabled 
                />
              </div>
            </div>

            {booking.customer_notes && (
              <div className="space-y-2">
                <Label>Customer Notes</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {booking.customer_notes}
                </div>
              </div>
            )}
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
                      disabled={(date) => date < new Date()}
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
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">${(booking.total_price || 0).toFixed(2)}</div>
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
                
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {paymentStatus !== "paid" && (
                  <div className="space-y-2">
                    <Label>Quick Actions - Mark as Paid</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleMarkAsPaid("cash")}
                        disabled={saving}
                      >
                        <Banknote className="h-4 w-4 mr-1" />
                        Cash
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleMarkAsPaid("zelle")}
                        disabled={saving}
                      >
                        Zelle
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleMarkAsPaid("venmo")}
                        disabled={saving}
                      >
                        Venmo
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleMarkAsPaid("check")}
                        disabled={saving}
                      >
                        Check
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateReceipt}>
                    <Receipt className="h-4 w-4 mr-1" />
                    Download Receipt
                  </Button>
                  
                  {booking.stripe_payment_intent_id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://dashboard.stripe.com/payments/${booking.stripe_payment_intent_id}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View in Stripe
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

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
