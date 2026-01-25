import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const GOOGLE_PLACE_ID = Deno.env.get("GOOGLE_PLACE_ID")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface PlaceDetailsResponse {
  result: {
    name: string;
    rating: number;
    user_ratings_total: number;
    reviews?: GoogleReview[];
  };
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Debug: Log what we have (without exposing full keys)
    const hasApiKey = !!GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY.length > 10;
    const hasPlaceId = !!GOOGLE_PLACE_ID && GOOGLE_PLACE_ID.length > 5;
    
    console.log("Config check - API Key present:", hasApiKey, "length:", GOOGLE_PLACES_API_KEY?.length || 0);
    console.log("Config check - Place ID present:", hasPlaceId, "value:", GOOGLE_PLACE_ID);
    
    if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
      console.error("Missing Google Places configuration");
      return new Response(
        JSON.stringify({ 
          error: "Google Places not configured",
          details: { hasApiKey, hasPlaceId }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch place details including reviews from Google Places API
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", GOOGLE_PLACE_ID);
    url.searchParams.set("fields", "name,rating,user_ratings_total,reviews");
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    console.log("Fetching from Google Places API for place:", GOOGLE_PLACE_ID);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Google Places API HTTP error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to fetch reviews from Google" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: PlaceDetailsResponse = await response.json();
    
    console.log("Google API response status:", data.status);

    if (data.status !== "OK") {
      console.error("Google Places API status:", data.status, "- Full response:", JSON.stringify(data));
      
      // Provide helpful error messages based on status
      let errorMessage = `Google API error: ${data.status}`;
      if (data.status === "INVALID_REQUEST") {
        errorMessage = "Invalid Place ID format. Place IDs should start with 'ChIJ' and be ~27 characters long.";
      } else if (data.status === "REQUEST_DENIED") {
        errorMessage = "API key is invalid or Places API is not enabled in Google Cloud Console.";
      } else if (data.status === "NOT_FOUND") {
        errorMessage = "Place not found. Please verify your Google Place ID.";
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, status: data.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform reviews for frontend consumption
    const reviews = (data.result.reviews || []).map((review) => ({
      authorName: review.author_name,
      authorPhoto: review.profile_photo_url || null,
      rating: review.rating,
      relativeTime: review.relative_time_description,
      text: review.text,
      timestamp: review.time,
    }));

    return new Response(
      JSON.stringify({
        businessName: data.result.name,
        overallRating: data.result.rating,
        totalReviews: data.result.user_ratings_total,
        reviews,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          // Cache for 1 hour to reduce API calls
          "Cache-Control": "public, max-age=3600",
        } 
      }
    );
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
