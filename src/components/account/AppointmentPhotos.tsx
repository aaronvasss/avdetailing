import { useEffect, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoUploader } from "@/components/photos/PhotoUploader";

type Photo = { id: string; photo_type: string; caption: string | null; url: string };

export function AppointmentPhotos({ bookingId, allowUpload = false }: { bookingId: string; allowUpload?: boolean }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<Photo | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPhotos([]);
    setSelected(null);
    const load = async () => {
      try {
        const { data, error: queryError } = await supabase.from("booking_photos")
          .select("id, photo_type, caption, storage_path").eq("booking_id", bookingId)
          .in("photo_type", ["before", "after"]).order("created_at", { ascending: true });
        if (queryError) throw queryError;
        const signed = await Promise.all((data ?? []).map(async (photo) => {
          const { data: image, error: imageError } = await supabase.storage.from("booking-photos")
            .createSignedUrl(photo.storage_path, 3600);
          if (imageError || !image?.signedUrl) throw imageError ?? new Error("Photo unavailable");
          return { id: photo.id, photo_type: photo.photo_type, caption: photo.caption, url: image.signedUrl };
        }));
        if (!cancelled) setPhotos(signed);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [bookingId, version]);

  return (
    <section className="space-y-4" aria-label="Before and after photos">
      <h4 className="flex items-center gap-2 font-medium"><Camera className="h-4 w-4 text-primary" />Before & After Photos</h4>
      {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading photos…</p>
        : error ? <div className="space-y-2"><p role="alert" className="text-sm text-destructive">Unable to load appointment photos.</p><Button size="sm" variant="outline" onClick={() => setVersion(v => v + 1)}>Retry Photos</Button></div>
        : <div className="grid gap-4 sm:grid-cols-2">
          {(["before", "after"] as const).map(phase => {
            const items = photos.filter(photo => photo.photo_type === phase);
            const label = phase === "before" ? "Before" : "After";
            return <div key={phase} className="min-w-0 space-y-2">
              <h5 className="text-sm font-medium">{label} <span className="text-muted-foreground">({items.length})</span></h5>
              {items.length ? <div className="grid grid-cols-2 gap-2">{items.map((photo, index) => <Button key={photo.id} variant="ghost" className="h-auto overflow-hidden p-0" aria-label={`View ${label.toLowerCase()} photo ${index + 1}`} onClick={() => setSelected(photo)}>
                <img src={photo.url} alt={photo.caption || `${label} detailing photo ${index + 1}`} loading="lazy" className="aspect-square w-full rounded-md object-cover" onError={() => setError(true)} />
              </Button>)}</div> : <p className="text-sm text-muted-foreground">No {label.toLowerCase()} photos shared yet.</p>}
            </div>;
          })}
        </div>}
      {allowUpload && <PhotoUploader bucket="booking-photos" bookingId={bookingId} photoType="before" compact onUploadComplete={() => setVersion(v => v + 1)} />}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{selected?.photo_type === "before" ? "Before Detailing" : "After Detailing"}</DialogTitle></DialogHeader>
          {selected && <img src={selected.url} alt={selected.caption || "Appointment photo"} className="max-h-[70vh] w-full object-contain" />}
          {selected?.caption && <p className="break-words text-sm text-muted-foreground">{selected.caption}</p>}
        </DialogContent>
      </Dialog>
    </section>
  );
}