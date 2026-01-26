import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id?: string;
  storage_path: string;
  url: string;
  photoType: string;
  caption?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photo: Photo) => void;
  showType?: boolean;
  editable?: boolean;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}

export function PhotoGallery({
  photos,
  onDelete,
  showType = true,
  editable = false,
  className,
  columns = 3,
}: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const columnsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  };

  const typeColors: Record<string, string> = {
    before: "bg-warning",
    after: "bg-primary",
    quote: "bg-secondary",
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    
    if (direction === "prev") {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1);
    } else {
      setSelectedIndex(selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0);
    }
  };

  if (photos.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        No photos yet
      </div>
    );
  }

  return (
    <>
      <div className={cn(`grid gap-3 ${columnsClass[columns]}`, className)}>
        {photos.map((photo, index) => (
          <div
            key={photo.id || photo.storage_path}
            className="relative group aspect-square"
          >
            <img
              src={photo.url}
              alt={photo.caption || `${photo.photoType} photo`}
              className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => setSelectedIndex(index)}
            />
            
            {/* Type badge */}
            {showType && (
              <Badge
                className={cn(
                  "absolute top-2 left-2 capitalize text-primary-foreground",
                  typeColors[photo.photoType] || "bg-muted"
                )}
              >
                {photo.photoType}
              </Badge>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="mr-2"
                onClick={() => setSelectedIndex(index)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {editable && onDelete && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(photo);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          {selectedIndex !== null && photos[selectedIndex] && (
            <div className="relative">
              <img
                src={photos[selectedIndex].url}
                alt={photos[selectedIndex].caption || "Photo"}
                className="w-full max-h-[80vh] object-contain"
              />
              
              {/* Navigation */}
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => navigatePhoto("prev")}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => navigatePhoto("next")}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <Badge
                    className={cn(
                      "capitalize text-primary-foreground",
                      typeColors[photos[selectedIndex].photoType] || "bg-muted"
                    )}
                  >
                    {photos[selectedIndex].photoType}
                  </Badge>
                  <span className="text-sm">
                    {selectedIndex + 1} / {photos.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
