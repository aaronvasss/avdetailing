import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { compressImage } from "@/lib/image-compress";
import { getChecklistItems } from "@/lib/checklists";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Clock, Phone, MapPin, Navigation, Car, Wrench,
  Play, CheckCircle2, Loader2, Camera, ChevronDown, ChevronUp,
  StickyNote, Package, Upload, Trash2, ImageIcon, Lock,
  DollarSign, MessageSquare, Mail, Copy, PartyPopper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStopwatch, formatHm } from "@/lib/duration-format";
import { checkRecentNotification, logNotification, COOLDOWN_HOURS, type RecentNotification } from "@/lib/notification-log";
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
  service_id?: string | null;
  custom_service_description?: string | null;
  services?: { name: string } | null;
  booking_add_ons?: { name: string; price: number }[];
  boat_type?: string | null;
  boat_length?: string | null;
  boat_brand?: string | null;
  aircraft_type?: string | null;
  tail_number?: string | null;
  clock_in_at?: string | null;
  clock_out_at?: string | null;
  actual_duration_minutes?: number | null;
  duration_minutes?: number | null;
  tip_amount?: number | null;
  manage_token?: string | null;
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
  const [expanded, setExpanded] = useState(booking.status === "in_progress");
  const [checklistItems, setChecklistItems] = useState<{ text: string; checked: boolean; id?: string }[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<any[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingService, setStartingService] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const beforeCameraRef = useRef<HTMLInputElement>(null);
  const beforeGalleryRef = useRef<HTMLInputElement>(null);
  const afterCameraRef = useRef<HTMLInputElement>(null);
  const afterGalleryRef = useRef<HTMLInputElement>(null);
  const { uploadMultiple, getBookingPhotos, deletePhoto } = usePhotoUpload();

  const [packageName, setPackageName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sid = (booking as any).service_id;
    const vt = booking.vehicle_size || booking.vehicle_type;
    if (!sid || !vt) { setPackageName(null); return; }
    supabase
      .from("service_packages")
      .select("name")
      .eq("service_id", sid)
      .eq("vehicle_type", vt)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setPackageName(data?.name || null); });
    return () => { cancelled = true; };
  }, [booking.id]);

  const serviceName = packageName || booking.custom_service_description || (booking.services as any)?.name || "Service";
  const addOns = (booking.booking_add_ons || []).map((a) => a.name);
  const customerName = booking.guest_name || "Customer";
  const firstName = customerName.split(" ")[0];
  const fullAddress = [booking.service_address, booking.service_city, booking.service_state, booking.service_zip]
    .filter(Boolean)
    .join(", ");

  const isInProgress = booking.status === "in_progress";
  const isCompleted = booking.status === "completed";
  const canStart = ["pending", "confirmed"].includes(booking.status);

  // Load data when expanded
  useEffect(() => {
    if (expanded && !isCompleted) {
      loadChecklist();
      loadPhotos();
    }
  }, [expanded, booking.id]);

  // Auto-expand in-progress
  useEffect(() => {
    if (isInProgress) setExpanded(true);
  }, [isInProgress]);

  const loadChecklist = async () => {
    const { data } = await supabase
      .from("booking_checklist_items")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at");

    if (data && data.length > 0) {
      setChecklistItems(data.map((d: any) => ({ text: d.item_text, checked: d.is_completed, id: d.id })));
    } else {
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
    if (!isInProgress) return;
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

  const handlePhotoUpload = async (files: FileList | null, photoType: "before" | "after") => {
    if (!files || files.length === 0) return;
    const setter = photoType === "before" ? setUploadingBefore : setUploadingAfter;
    setter(true);

    try {
      // Compress all files
      const fileArray = Array.from(files);
      const compressed = await Promise.all(fileArray.map((f) => compressImage(f)));

      const results = await uploadMultiple(compressed, {
        bucket: "booking-photos",
        bookingId: booking.id,
        photoType,
      });

      if (results.length > 0) {
        if (photoType === "before") {
          setBeforePhotos((prev) => [...prev, ...results]);
        } else {
          setAfterPhotos((prev) => [...prev, ...results]);
        }
        toast.success(`${results.length} ${photoType} photo${results.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err) {
      toast.error("Failed to upload photos");
    } finally {
      setter(false);
    }
  };

  const handleDeletePhoto = async (photo: any, photoType: "before" | "after") => {
    if (!photo.id) return;
    const success = await deletePhoto("booking-photos", photo.storage_path, photo.id);
    if (success) {
      if (photoType === "before") {
        setBeforePhotos((prev) => prev.filter((p) => p.id !== photo.id));
      } else {
        setAfterPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      }
    }
  };

  const handleStartService = async () => {
    if (beforePhotos.length === 0) {
      toast.error("Please upload at least 1 before photo before starting");
      return;
    }

    // Already clocked in? Confirm overwrite.
    if (booking.clock_in_at) {
      const prev = format(new Date(booking.clock_in_at), "h:mm a");
      const ok = window.confirm(`You already clocked in at ${prev}. Reset the clock to now?`);
      if (!ok) return;
    } else {
      // Block if another job is already in progress for this worker today
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const today = booking.scheduled_date;
          const { data: others } = await supabase
            .from("bookings")
            .select("id, guest_name, scheduled_time, clock_in_at")
            .eq("status", "in_progress")
            .eq("assigned_worker_id", user.id)
            .eq("scheduled_date", today)
            .neq("id", booking.id)
            .limit(1);
          if (others && others.length > 0) {
            const o = others[0] as any;
            const t = o.scheduled_time ? formatTime(o.scheduled_time) : "earlier";
            toast.error(`⚠️ You have another job in progress: ${o.guest_name || "Customer"} at ${t}. Clock out of that job first.`, { duration: 6000 });
            return;
          }
        }
      } catch (err) {
        console.error("in-progress check failed", err);
      }
    }

    setStartingService(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "in_progress",
          in_progress_at: nowIso,
          clock_in_at: nowIso,
        })
        .eq("id", booking.id);

      if (error) throw error;

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

  const checkedCount = checklistItems.filter((c) => c.checked).length;
  const allChecked = checklistItems.length > 0 && checkedCount === checklistItems.length;
  const hasBeforePhoto = beforePhotos.length > 0;
  const hasAfterPhoto = afterPhotos.length > 0;
  const canComplete = allChecked && hasBeforePhoto && hasAfterPhoto;
  const checklistProgress = checklistItems.length > 0 ? (checkedCount / checklistItems.length) * 100 : 0;

  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const update: Record<string, any> = {
        status: "completed",
        clock_out_at: nowIso,
        completed_at: nowIso,
      };
      if (booking.clock_in_at) {
        const startedMs = new Date(booking.clock_in_at).getTime();
        const endedMs = new Date(nowIso).getTime();
        update.actual_duration_minutes = Math.max(1, Math.round((endedMs - startedMs) / 60000));
      }
      const { error } = await supabase
        .from("bookings")
        .update(update)
        .eq("id", booking.id);

      if (error) throw error;

      if (booking.guest_phone && booking.manage_token) {
        await supabase.functions.invoke("send-sms", {
          body: {
            to: booking.guest_phone,
            message: `Hi ${firstName}! Your detail is done! 🚗✨ Thank you for choosing AV Detailing. We hope you love the results! Rate your experience: ${window.location.origin}/rate/${booking.id}?token=${booking.manage_token}`,
          },
        });
      }

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
      setShowCompleteDialog(false);
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

  const PhotoSection = ({ type, photos, uploading, cameraRef, galleryRef, locked, lockMessage }: {
    type: "before" | "after";
    photos: any[];
    uploading: boolean;
    cameraRef: React.RefObject<HTMLInputElement>;
    galleryRef: React.RefObject<HTMLInputElement>;
    locked?: boolean;
    lockMessage?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          {type === "before" ? "Before" : "After"} Photos
          {photos.length > 0 && (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {photos.length} uploaded
            </Badge>
          )}
          {photos.length === 0 && !locked && (
            <span className="text-xs text-destructive font-normal">(min. 1 required)</span>
          )}
        </h4>
      </div>

      {locked ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Lock className="h-4 w-4 shrink-0" />
          <span>{lockMessage}</span>
        </div>
      ) : (
        <>
          {/* Photo thumbnails */}
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photos.map((p: any, i: number) => (
                <div key={p.id || i} className="relative w-20 h-20 group">
                  <img
                    src={p.url}
                    alt={`${type} photo`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(p, type)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload buttons */}
          <div className="flex gap-2">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                handlePhotoUpload(e.target.files, type);
                e.target.value = "";
              }}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handlePhotoUpload(e.target.files, type);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              className="flex-1 h-12"
              disabled={uploading}
              onClick={() => cameraRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              Take Photo
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12"
              disabled={uploading}
              onClick={() => galleryRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
              Gallery
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
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
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  📍 {fullAddress}
                </a>
                <Button variant="outline" size="sm" onClick={openNavigation} className="shrink-0">
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </div>
            )}
          </div>

          {/* Vehicle / Boat / Aircraft info */}
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {booking.boat_type ? (
                [booking.boat_type, booking.boat_length && `${booking.boat_length}ft`, booking.boat_brand].filter(Boolean).join(" · ")
              ) : booking.aircraft_type ? (
                [booking.aircraft_type, booking.tail_number && `Tail: ${booking.tail_number}`].filter(Boolean).join(" · ")
              ) : (
                [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model]
                  .filter(Boolean)
                  .join(" ") || "Vehicle info not provided"
              )}
              {!booking.boat_type && !booking.aircraft_type && booking.vehicle_type && ` (${booking.vehicle_type})`}
            </span>
          </div>

          {/* Charge amount */}
          {booking.total_price != null && booking.total_price > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-sm font-bold text-emerald-400">
                Charge Customer: ${Number(booking.total_price).toFixed(2)}
              </span>
            </div>
          )}

          {/* Live timer while in_progress */}
          {isInProgress && booking.clock_in_at && (
            <>
              <JobTimer startedAt={booking.clock_in_at} />
              <p className="text-xs text-muted-foreground pl-1">
                🕐 Clocked in at {format(new Date(booking.clock_in_at), "h:mm a")}
              </p>
            </>
          )}

          {/* Actual vs estimated duration when completed */}
          {isCompleted && booking.actual_duration_minutes != null && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                <span className="font-bold">Job took {formatHm(booking.actual_duration_minutes)}</span>
                {booking.duration_minutes != null && (
                  <span className="text-muted-foreground"> · Estimated: {formatHm(booking.duration_minutes)}</span>
                )}
              </span>
            </div>
          )}

          {/* Clock in/out times when completed */}
          {isCompleted && booking.clock_in_at && booking.clock_out_at && (
            <p className="text-xs text-muted-foreground pl-1">
              🕐 In: {format(new Date(booking.clock_in_at), "h:mm a")} → Out: {format(new Date(booking.clock_out_at), "h:mm a")}
              {booking.actual_duration_minutes != null && ` · Duration: ${formatHm(booking.actual_duration_minutes)}`}
            </p>
          )}

          {/* Tip section (completed jobs) */}
          {isCompleted && (
            <TipSection booking={booking} customerName={customerName} firstName={firstName} serviceName={serviceName} />
          )}

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

          {/* === EXPANDED SECTION === */}
          {expanded && !isCompleted && (
            <>
              <Separator />

              {/* STEP 1: Before Photos (always visible when not completed) */}
              <PhotoSection
                type="before"
                photos={beforePhotos}
                uploading={uploadingBefore}
                cameraRef={beforeCameraRef as any}
                galleryRef={beforeGalleryRef as any}
              />

              {/* Start Service button */}
              {canStart && (
                <Button
                  className="w-full h-14 text-base"
                  onClick={handleStartService}
                  disabled={startingService || !hasBeforePhoto}
                >
                  {startingService ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-5 w-5" />
                  )}
                  {!hasBeforePhoto ? "Upload before photo to start" : "Start Service"}
                </Button>
              )}

              {/* STEP 2: Checklist (only when in_progress) */}
              {isInProgress && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Service Checklist
                      </h4>
                      <span className="text-xs text-muted-foreground font-medium">
                        {checkedCount}/{checklistItems.length}
                      </span>
                    </div>
                    <Progress value={checklistProgress} className="h-2" />
                    <div className="space-y-1">
                      {checklistItems.map((item, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer active:bg-muted/70 transition-colors"
                        >
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() => handleChecklistToggle(i)}
                            className="h-5 w-5"
                          />
                          <span className={cn("text-sm", item.checked && "line-through text-muted-foreground")}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* STEP 3: After Photos (locked until checklist complete) */}
                  <PhotoSection
                    type="after"
                    photos={afterPhotos}
                    uploading={uploadingAfter}
                    cameraRef={afterCameraRef as any}
                    galleryRef={afterGalleryRef as any}
                    locked={!allChecked}
                    lockMessage="Complete all checklist items to unlock after photos"
                  />

                  <Separator />

                  {/* STEP 4: Mark Complete */}
                  <Button
                    className="w-full h-14 text-base"
                    onClick={() => setShowCompleteDialog(true)}
                    disabled={!canComplete || loading}
                    variant={canComplete ? "default" : "secondary"}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                    )}
                    {!allChecked
                      ? `Complete checklist (${checkedCount}/${checklistItems.length})`
                      : !hasAfterPhoto
                        ? "Upload after photo to complete"
                        : "Mark Complete"}
                  </Button>
                </>
              )}
            </>
          )}

          {/* Collapsed state for non-completed */}
          {!expanded && !isCompleted && (
            <Button variant="outline" className="w-full" onClick={() => setExpanded(true)}>
              {isInProgress ? "View Checklist & Photos" : "View Job Details"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Completion Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Job Complete?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this job as complete? The customer will receive a completion notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkComplete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function JobTimer({ startedAt, className }: { startedAt: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = now - new Date(startedAt).getTime();
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <span className="text-sm font-bold text-primary tabular-nums">
        Time on Job: {formatStopwatch(elapsed)}
      </span>
    </div>
  );
}

function TipSection({
  booking,
  customerName,
  firstName,
  serviceName,
}: {
  booking: BookingData;
  customerName: string;
  firstName: string;
  serviceName: string;
}) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentNotification | null>(null);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState<"sms" | "email" | null>(null);
  const [justSent, setJustSent] = useState(false);

  const tipAmount = Number(booking.tip_amount || 0);
  const hasTip = tipAmount > 0;

  const manageLink = booking.manage_token
    ? `${window.location.origin}/booking/manage?token=${booking.manage_token}`
    : `${window.location.origin}/booking`;

  const smsMessage = `Hi ${firstName}! 🚗✨ This is AV Detailing — your ${serviceName} detail is complete! If you loved the service, a tip for your tech means the world: ${manageLink} Thank you! 🙏`;
  const emailSubject = `Thank you from AV Detailing! 🚗✨`;
  const emailBody = `Hi ${firstName}!\n\nThank you for choosing AV Detailing. Your ${serviceName} is complete and we hope you love the result!\n\nIf you're happy with your service today, we'd love a tip for your technician — every bit means the world to them.\n\nLeave a tip here: ${manageLink}\n\nThank you so much! 🙏\nAV Detailing`;

  const refreshRecent = async () => {
    setChecking(true);
    const r = await checkRecentNotification(booking.id, "tip_request");
    setRecent(r);
    setChecking(false);
  };

  useEffect(() => {
    if (!hasTip) refreshRecent();
    else setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.id, hasTip]);

  // Tip received — celebrate
  if (hasTip) {
    return (
      <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/40 rounded-lg px-3 py-2.5">
        <PartyPopper className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-sm font-bold text-green-500">
          💰 ${tipAmount.toFixed(2)} tip received!
        </span>
      </div>
    );
  }

  if (checking) return null;

  // Already requested
  if (recent) {
    const sentAt = new Date(recent.created_at);
    return (
      <div className="flex items-center justify-between gap-2 bg-muted/50 border border-border/60 rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>Tip requested {format(sentAt, "MMM d 'at' h:mm a")}</span>
        </div>
        <Badge variant="outline" className="text-[10px]">Pending</Badge>
      </div>
    );
  }

  const sendTipRequest = async (channel: "sms" | "email") => {
    const recipient = channel === "sms" ? booking.guest_phone : booking.guest_email;
    if (!recipient) {
      toast.error(`No ${channel === "sms" ? "phone" : "email"} on file for this customer`);
      return;
    }
    setSending(channel);
    try {
      if (channel === "sms") {
        const { error } = await supabase.functions.invoke("send-booking-sms", {
          body: { to: recipient, message: smsMessage },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.functions.invoke("send-contact-email", {
          body: {
            name: "AV Detailing",
            email: recipient,
            service: emailSubject,
            message: emailBody,
          },
        });
        if (error) throw error;
      }
      await logNotification({
        bookingId: booking.id,
        notificationType: "tip_request",
        recipient,
        status: "sent",
      });
      toast.success(`Tip request sent to ${customerName}! 🙏`);
      setJustSent(true);
      setOpen(false);
      await refreshRecent();
    } catch (err: any) {
      console.error("Tip request error:", err);
      await logNotification({
        bookingId: booking.id,
        notificationType: "tip_request",
        recipient,
        status: "failed",
        errorMessage: String(err?.message || err),
      });
      toast.error(`Failed to send tip request: ${err?.message || "Unknown error"}`);
    } finally {
      setSending(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(manageLink);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full border-green-500/40 text-green-500 hover:bg-green-500/10 hover:text-green-500"
        onClick={() => setOpen(true)}
        disabled={justSent}
      >
        <DollarSign className="h-4 w-4 mr-1.5" />
        Request Tip 💰
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request a Tip</DialogTitle>
            <DialogDescription>
              Send {firstName} a friendly tip request for today's service.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
            {smsMessage}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => sendTipRequest("sms")}
              disabled={!booking.guest_phone || sending !== null}
            >
              {sending === "sms" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-1.5" />
              )}
              Send via SMS
            </Button>
            <Button
              variant="secondary"
              onClick={() => sendTipRequest("email")}
              disabled={!booking.guest_email || sending !== null}
            >
              {sending === "email" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-1.5" />
              )}
              Send via Email
            </Button>
            <Button variant="outline" onClick={copyLink} disabled={sending !== null}>
              <Copy className="h-4 w-4 mr-1.5" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
