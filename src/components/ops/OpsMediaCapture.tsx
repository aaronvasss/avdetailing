import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { OPS_BUCKET, OpsMediaItem, OpsPhase, opsMediaUrls } from "@/lib/ops-workflow";
import { Button } from "@/components/ui/button";
import { Camera, Check, Loader2, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const db = supabase as any;

interface Props {
  jobId: string;
  phase: OpsPhase;
  /** Required photo categories rendered as big capture tiles. */
  categories?: string[];
  media: OpsMediaItem[];
  onChange: () => void;
  allowVideo?: boolean;
  allowDelete?: boolean;
  readOnly?: boolean;
}

export function OpsMediaCapture({
  jobId,
  phase,
  categories,
  media,
  onChange,
  allowVideo = true,
  allowDelete = true,
  readOnly = false,
}: Props) {
  const [busyCategory, setBusyCategory] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingRef = useRef<{ category: string | null; video: boolean }>({
    category: null,
    video: false,
  });

  const phaseMedia = media.filter((m) => m.phase === phase);

  useEffect(() => {
    const paths = phaseMedia.map((m) => m.storage_path).filter((p) => !urls[p]);
    if (paths.length === 0) return;
    let active = true;
    void opsMediaUrls(paths).then((next) => {
      if (active) setUrls((prev) => ({ ...prev, ...next }));
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseMedia.map((m) => m.storage_path).join("|")]);

  const openPicker = (category: string | null, video: boolean) => {
    pendingRef.current = { category, video };
    if (!inputRef.current) return;
    inputRef.current.accept = video ? "video/*" : "image/*";
    inputRef.current.setAttribute("capture", "environment");
    inputRef.current.value = "";
    inputRef.current.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const { category, video } = pendingRef.current;
    setBusyCategory(category ?? "__extra__");

    try {
      const { data: userData } = await supabase.auth.getUser();
      for (const raw of Array.from(files)) {
        const isVideo = raw.type.startsWith("video/") || video;
        if (isVideo && raw.size > 100 * 1024 * 1024) {
          toast.error("Videos must be under 100MB");
          continue;
        }
        const file = isVideo ? raw : await compressImage(raw);
        const ext = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
        const path = `${jobId}/${phase}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(OPS_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;

        const { error: dbError } = await db.from("ops_job_media").insert({
          job_id: jobId,
          phase,
          category,
          media_type: isVideo ? "video" : "photo",
          storage_path: path,
          uploaded_by: userData.user?.id ?? null,
        });
        if (dbError) throw dbError;
      }
      onChange();
    } catch (e: any) {
      console.error("ops media upload failed", e);
      toast.error(e.message || "Upload failed");
    } finally {
      setBusyCategory(null);
    }
  };

  const remove = async (item: OpsMediaItem) => {
    const { error } = await db.from("ops_job_media").delete().eq("id", item.id);
    if (error) {
      toast.error("Could not delete media");
      return;
    }
    await supabase.storage.from(OPS_BUCKET).remove([item.storage_path]);
    onChange();
  };

  const renderThumb = (item: OpsMediaItem) => (
    <div key={item.id} className="relative overflow-hidden rounded-lg border bg-muted">
      {item.media_type === "video" ? (
        <video src={urls[item.storage_path]} controls className="h-28 w-full object-cover" />
      ) : (
        <img
          src={urls[item.storage_path]}
          alt={item.category ? `${item.category} ${phase} photo` : `${phase} photo`}
          loading="lazy"
          className="h-28 w-full object-cover"
        />
      )}
      {!readOnly && allowDelete && (
        <button
          type="button"
          onClick={() => remove(item)}
          aria-label="Delete media"
          className="absolute right-1 top-1 rounded-full bg-background/90 p-1.5 text-destructive shadow"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {categories && categories.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((category) => {
            const items = phaseMedia.filter(
              (m) => (m.category || "").toLowerCase() === category.toLowerCase(),
            );
            const done = items.length > 0;
            const busy = busyCategory === category;
            return (
              <div key={category} className="space-y-2">
                <button
                  type="button"
                  disabled={readOnly || busy}
                  onClick={() => openPicker(category, false)}
                  className={cn(
                    "flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-2 text-center text-sm font-medium transition",
                    done
                      ? "border-primary/60 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50",
                    readOnly && "opacity-70",
                  )}
                >
                  {busy ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : done ? (
                    <Check className="h-6 w-6 text-primary" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                  <span className="leading-tight">{category}</span>
                  {done && <span className="text-xs text-muted-foreground">{items.length} file(s)</span>}
                </button>
                {items.length > 0 && <div className="grid gap-2">{items.map(renderThumb)}</div>}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={busyCategory !== null}
            onClick={() => openPicker(null, false)}
          >
            {busyCategory === "__extra__" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Add photo
          </Button>
          {allowVideo && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={busyCategory !== null}
              onClick={() => openPicker(null, true)}
            >
              <Video className="mr-2 h-4 w-4" />
              Add video
            </Button>
          )}
        </div>
      )}

      {(() => {
        const extras = phaseMedia.filter(
          (m) =>
            !categories ||
            !categories.some((c) => c.toLowerCase() === (m.category || "").toLowerCase()),
        );
        if (extras.length === 0) return null;
        return (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Additional media</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{extras.map(renderThumb)}</div>
          </div>
        );
      })()}
    </div>
  );
}
