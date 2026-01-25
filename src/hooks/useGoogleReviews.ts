import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleReview {
  authorName: string;
  authorPhoto: string | null;
  rating: number;
  relativeTime: string;
  text: string;
  timestamp: number;
}

export interface GoogleReviewsData {
  businessName: string;
  overallRating: number;
  totalReviews: number;
  reviews: GoogleReview[];
}

async function fetchGoogleReviews(): Promise<GoogleReviewsData> {
  const { data, error } = await supabase.functions.invoke("get-google-reviews");
  
  if (error) {
    console.error("Error fetching Google reviews:", error);
    throw new Error("Failed to fetch reviews");
  }
  
  return data;
}

export function useGoogleReviews() {
  return useQuery({
    queryKey: ["google-reviews"],
    queryFn: fetchGoogleReviews,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });
}
