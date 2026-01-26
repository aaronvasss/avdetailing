import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { Camera } from "lucide-react";

interface BookingPhotosSectionProps {
  bookingId: string;
  isAdmin?: boolean;
}

interface Photo {
  id?: string;
  storage_path: string;
  url: string;
  photoType: string;
}

export function BookingPhotosSection({ bookingId, isAdmin = false }: BookingPhotosSectionProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { getBookingPhotos, deletePhoto } = usePhotoUpload();

  const loadPhotos = async () => {
    setLoading(true);
    const fetchedPhotos = await getBookingPhotos(bookingId);
    setPhotos(fetchedPhotos);
    setLoading(false);
  };

  useEffect(() => {
    loadPhotos();
  }, [bookingId]);

  const handleUploadComplete = (newPhotos: { storage_path: string; url: string }[]) => {
    loadPhotos(); // Refresh all photos
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!photo.id) return;
    const success = await deletePhoto("booking-photos", photo.storage_path, photo.id);
    if (success) {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    }
  };

  const beforePhotos = photos.filter((p) => p.photoType === "before");
  const afterPhotos = photos.filter((p) => p.photoType === "after");

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading photos...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Booking Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="before" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="before">
              Before ({beforePhotos.length})
            </TabsTrigger>
            <TabsTrigger value="after">
              After ({afterPhotos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-4 mt-4">
            {isAdmin && (
              <PhotoUploader
                bucket="booking-photos"
                bookingId={bookingId}
                photoType="before"
                onUploadComplete={handleUploadComplete}
                maxFiles={10}
              />
            )}
            <PhotoGallery
              photos={beforePhotos}
              onDelete={isAdmin ? handleDeletePhoto : undefined}
              editable={isAdmin}
              showType={false}
            />
          </TabsContent>

          <TabsContent value="after" className="space-y-4 mt-4">
            {isAdmin && (
              <PhotoUploader
                bucket="booking-photos"
                bookingId={bookingId}
                photoType="after"
                onUploadComplete={handleUploadComplete}
                maxFiles={10}
              />
            )}
            <PhotoGallery
              photos={afterPhotos}
              onDelete={isAdmin ? handleDeletePhoto : undefined}
              editable={isAdmin}
              showType={false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
