import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadOptions {
  bucket: "booking-photos" | "quote-photos";
  bookingId?: string;
  photoType: "before" | "after" | "quote";
}

interface UploadedPhoto {
  id?: string;
  storage_path: string;
  url: string;
  photoType: string;
}

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getSignedUrl = async (bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry
    if (error || !data?.signedUrl) {
      console.error("Error creating signed URL:", error);
      return "";
    }
    return data.signedUrl;
  };

  const uploadPhoto = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadedPhoto | null> => {
    const { bucket, bookingId, photoType } = options;

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const folder = bookingId || "quotes";
      const fileName = `${folder}/${photoType}-${timestamp}-${randomId}.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      setProgress(100);

      // Get signed URL (buckets are now private)
      const signedUrl = await getSignedUrl(bucket, data.path);

      // If we have a booking ID, also save to booking_photos table
      if (bookingId) {
        const { data: photoRecord, error: dbError } = await supabase
          .from("booking_photos")
          .insert({
            booking_id: bookingId,
            storage_path: data.path,
            photo_type: photoType,
          } as any)
          .select("id")
          .single();

        if (dbError) {
          console.error("Error saving photo record:", dbError);
        }

        const recordId = (photoRecord as any)?.id;

        return {
          id: recordId,
          storage_path: data.path,
          url: signedUrl,
          photoType,
        };
      }

      return {
        storage_path: data.path,
        url: signedUrl,
        photoType,
      };
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (
    files: File[],
    options: UploadOptions
  ): Promise<UploadedPhoto[]> => {
    const results: UploadedPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      const result = await uploadPhoto(files[i], options);
      if (result) results.push(result);
    }

    setProgress(100);
    return results;
  };

  const deletePhoto = async (
    bucket: "booking-photos" | "quote-photos",
    storagePath: string,
    photoId?: string
  ): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database if we have a record ID
      if (photoId) {
        const { error: dbError } = await supabase
          .from("booking_photos")
          .delete()
          .eq("id", photoId as any);

        if (dbError) throw dbError;
      }

      toast.success("Photo deleted");
      return true;
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete photo");
      return false;
    }
  };

  const getBookingPhotos = async (bookingId: string): Promise<UploadedPhoto[]> => {
    try {
      const { data, error } = await supabase
        .from("booking_photos")
        .select("*" as any)
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Use signed URLs since buckets are now private
      const photos = await Promise.all(
        (data || []).map(async (photo: any) => {
          const signedUrl = await getSignedUrl("booking-photos", photo.storage_path);
          return {
            id: photo.id,
            storage_path: photo.storage_path,
            url: signedUrl,
            photoType: photo.photo_type,
          };
        })
      );

      return photos;
    } catch (error) {
      console.error("Error fetching photos:", error);
      return [];
    }
  };

  return {
    uploadPhoto,
    uploadMultiple,
    deletePhoto,
    getBookingPhotos,
    getSignedUrl,
    uploading,
    progress,
  };
}
