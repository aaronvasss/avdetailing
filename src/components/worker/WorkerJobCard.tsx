import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { getChecklistItems } from "@/lib/checklists";
import { toast } from "sonner";
import {
  Clock, Phone, MapPin, Navigation, Car, Wrench,
  Play, CheckCircle2, Loader2, Camera, ChevronDown, ChevronUp,
  StickyNote, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface BookingData {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_size: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  customer_notes: string | null;
  total_price: number | null;
  user_id: string | null;
  services?: { name: string } | null;
  booking_add_ons?: { name: string; price: number }[];
}

interface WorkerJobCardProps {
  booking: BookingData;
  onStatusChange?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

export function WorkerJobCard({ booking, onStatusChange }: WorkerJobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [checklistItems, setChecklistItems] = useState<{ text: string; checked: boolean; id?: string }[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<any[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingService, setStartingService] = useState(false);
  const { getBookingPhotos } = usePhotoUpload();

  const serviceName = (booking.services as any)?.name || "Detailing Service";
  const addOns = (booking.booking_add_ons || []).map((a) => a.name);
  const customerName = booking.guest_name || "Customer";
  const firstName = customerName.split(" ")[0];
  const fullAddress = [booking.service_address, booking.service_city, booking.service_state, booking.service_zip]
    .filter(Boolean)
    .join(", ");

  const isInProgress = booking.status === "in_progress";
  const isCompleted = booking.status === "completed";
  const canStart = ["pending", "confirmed"].includes(booking.status);

  useEffect(() => {
    if (expanded && !isCompleted) {
      loadChecklist();
      loadPhotos();
    }
  }, [expanded]);

  const loadChecklist = async () => {
    const { data } = await supabase
      .from("booking_checklist_items")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at");

    if (data && data.length > 0) {
      setChecklistItems(data.map((d: any) => ({ text: d.item_text, checked: d.is_completed, id: d.id })));
    } else {
      // Create checklist items
      const items = getChecklistItems(serviceName, addOns);
      const toInsert = items.map((item) => ({
        booking_id: booking.id,
        item_text: item,
        is_completed: false,
      }));

      const { data: inserted } = await supabase
        .from("booking_checklist_items")
        .insert(toInsert)
        .select();

      if (inserted) {
        setChecklistItems(inserted.map((d: any) => ({ text: d.item_text, checked: d.is_completed, id: d.id })));
      }
    }
  };

  const loadPhotos = async () => {
    const photos = await getBookingPhotos(booking.id);
    setBeforePhotos(photos.filter((p) => p.photoType === "before"));
    setAfterPhotos(photos.filter((p) => p.photoType === "after"));
  };

  const handleChecklistToggle = async (index: number) => {
    const item = checklistItems[index];
    if (!item.id) return;

    const newChecked = !item.checked;
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("booking_checklist_items")
      .update({
        is_completed: newChecked,
        completed_by: newChecked ? user?.id : null,
        completed_at: newChecked ? new Date().toISOString() : null,
      })
      .eq("id", item.id);

    setChecklistItems((prev) =>
      prev.map((c, i) => (i === index ? { ...c, checked: newChecked } : c))
    );
  };

  const handleStartService = async () => {
    setStartingService(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "in_progress" })
        .eq("id", booking.id);

      if (error) throw error;

      // Send in-progress SMS
      if (booking.guest_phone) {
        await supabase.functions.invoke("send-sms", {
          body: {
            to: booking.guest_phone,
            message: `Hi ${firstName}! 🚗✨ Great news — we are currently working on your vehicle! Sit back and relax, we'll let you know as soon as we're done. — AV Detailing Team`,
          },
        });
      }

      toast.success("Service started!");
      onStatusChange?.();
    } catch (err: any) {
      toast.error("Failed to start service");
    } finally {
      setStartingService(false);
    }
  };

  const allChecked = checklistItems.length > 0 && checklistItems.every((c) => c.checked);
  const hasBeforePhoto = beforePhotos.length > 0;
  const hasAfterPhoto = afterPhotos.length > 0;
  const canComplete = allChecked && hasBeforePhoto && hasAfterPhoto;

  const handleMarkComplete = async () => {
    if (!canComplete) {
      toast.error("Complete all checklist items and upload before/after photos first");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", booking.id);

      if (error) throw error;

      // Send completion SMS
      if (booking.guest_phone) {
        await supabase.functions.invoke("send-sms", {
          body: {
            to: booking.guest_phone,
            message: `Hi ${firstName}! Your detail is done! 🚗✨ Thank you for choosing AV Detailing. We hope you love the results! Rate your experience: ${window.location.origin}/rate/${booking.id}`,
          },
        });
      }

      // Send review request email
      if (booking.guest_email || booking.guest_phone) {
        await supabase.functions.invoke("send-review-request", {
          body: {
            booking_id: booking.id,
            customer_name: customerName,
            customer_phone: booking.guest_phone,
            customer_email: booking.guest_email,
          },
        });
      }

      toast.success("Job marked complete!");
      onStatusChange?.();
    } catch (err) {
      toast.error("Failed to complete job");
    } finally {
      setLoading(false);
    }
  };

  const openNavigation = () => {
    if (!fullAddress) return;
    const encoded = encodeURIComponent(fullAddress);
    // Try to detect iOS for Apple Maps, fallback to Google Maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${encoded}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(url, "_blank");
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <Card className={cn("transition-all", isCompleted && "opacity-60")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-bold text-lg">{formatTime(booking.scheduled_time)}</span>
              <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[booking.status])}>
                {booking.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <p className="font-semibold text-base">{customerName}</p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-muted-foreground">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Quick info always visible */}
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{serviceName}</span>
          </div>

          {booking.guest_phone && (
            <a href={`tel:${booking.guest_phone}`} className="flex items-center gap-2 text-primary">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{booking.guest_phone}</span>
            </a>
          )}

          {fullAddress && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm">{fullAddress}</span>
              <Button variant="outline" size="sm" onClick={openNavigation} className="shrink-0">
                <Navigation className="h-4 w-4 mr-1" />
                Navigate
              </Button>
            </div>
          )}
        </div>

        {/* Vehicle info */}
        <div className="flex items-center gap-2 text-sm">
          <Car className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            {[booking.vehicle_year, booking.vehicle_make, booking.vehicle_model]
              .filter(Boolean)
              .join(" ") || "Vehicle info not provided"}
            {booking.vehicle_type && ` (${booking.vehicle_type})`}
          </span>
        </div>

        {/* Add-ons */}
        {addOns.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {addOns.map((a, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Customer notes */}
        {booking.customer_notes && (
          <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-md p-2">
            <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground">{booking.customer_notes}</p>
          </div>
        )}

        {/* Start Service button */}
        {canStart && (
          <Button
            className="w-full h-12 text-base"
            onClick={handleStartService}
            disabled={startingService}
          >
            {startingService ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            Start Service
          </Button>
        )}

        {/* Expanded section: checklist + photos */}
        {expanded && isInProgress && (
          <>
            <Separator />

            {/* Checklist */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Job Checklist ({checklistItems.filter((c) => c.checked).length}/{checklistItems.length})
              </h4>
              <div className="space-y-2">
                {checklistItems.map((item, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => handleChecklistToggle(i)}
                    />
                    <span className={cn("text-sm", item.checked && "line-through text-muted-foreground")}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Photo uploads */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Before Photos {hasBeforePhoto ? "✓" : "(required)"}
              </h4>
              {beforePhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {beforePhotos.map((p, i) => (
                    <img key={i} src={p.url} alt="Before" className="w-16 h-16 object-cover rounded-md" />
                  ))}
                </div>
              )}
              <PhotoUploader
                bucket="booking-photos"
                bookingId={booking.id}
                photoType="before"
                compact
                onUploadComplete={(photos) => {
                  setBeforePhotos((prev) => [...prev, ...photos.map((p) => ({ ...p, photoType: "before" }))]);
                  toast.success("Before photos uploaded");
                }}
              />

              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                After Photos {hasAfterPhoto ? "✓" : "(required)"}
              </h4>
              {afterPhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {afterPhotos.map((p, i) => (
                    <img key={i} src={p.url} alt="After" className="w-16 h-16 object-cover rounded-md" />
                  ))}
                </div>
              )}
              <PhotoUploader
                bucket="booking-photos"
                bookingId={booking.id}
                photoType="after"
                compact
                onUploadComplete={(photos) => {
                  setAfterPhotos((prev) => [...prev, ...photos.map((p) => ({ ...p, photoType: "after" }))]);
                  toast.success("After photos uploaded");
                }}
              />
            </div>

            <Separator />

            {/* Complete button */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleMarkComplete}
              disabled={!canComplete || loading}
              variant={canComplete ? "default" : "secondary"}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              {canComplete ? "Mark Complete" : "Complete checklist & photos first"}
            </Button>
          </>
        )}

        {/* Auto-expand in-progress cards */}
        {isInProgress && !expanded && (
          <Button variant="outline" className="w-full" onClick={() => setExpanded(true)}>
            View Checklist & Photos
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
