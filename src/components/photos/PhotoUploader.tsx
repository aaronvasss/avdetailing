import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  bucket: "booking-photos" | "quote-photos";
  bookingId?: string;
  photoType: "before" | "after" | "quote";
  onUploadComplete?: (photos: { storage_path: string; url: string }[]) => void;
  maxFiles?: number;
  className?: string;
  compact?: boolean;
}

export function PhotoUploader({
  bucket,
  bookingId,
  photoType,
  onUploadComplete,
  maxFiles = 5,
  className,
  compact = false,
}: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultiple, uploading, progress } = usePhotoUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxFiles - previews.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;

    const files = previews.map((p) => p.file);
    const results = await uploadMultiple(files, {
      bucket,
      bookingId,
      photoType,
    });

    if (results.length > 0) {
      onUploadComplete?.(results);
      // Clean up previews
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
      setPreviews([]);
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={previews.length >= maxFiles || uploading}
          >
            <Camera className="h-4 w-4 mr-1" />
            Add Photos
          </Button>
          
          {previews.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload ({previews.length})
            </Button>
          )}
        </div>

        {previews.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {previews.map((p, i) => (
              <div key={i} className="relative w-16 h-16">
                <img
                  src={p.preview}
                  alt=""
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploading && <Progress value={progress} className="h-1" />}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-primary/5",
          previews.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Click to select photos or drag and drop
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxFiles} photos, 5MB each
        </p>
      </div>

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square">
              <img
                src={p.preview}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Upload button */}
      {previews.length > 0 && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Upload {previews.length} Photo{previews.length > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}
