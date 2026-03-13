import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GOOGLE_REVIEW_URL = "https://g.page/r/CYyQqJOk3f1hEBM/review";

export default function RatingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExisting();
  }, [bookingId]);

  const checkExisting = async () => {
    if (!bookingId) { setLoading(false); return; }

    // Check if already rated
    const { data: existingRating } = await supabase
      .from("booking_ratings")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existingRating) {
      setAlreadyRated(true);
      setLoading(false);
      return;
    }

    // Get booking info
    const { data: b } = await supabase
      .from("bookings")
      .select("id, guest_name, services(name)")
      .eq("id", bookingId)
      .maybeSingle();

    setBooking(b);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!rating || !bookingId) return;
    setSubmitting(true);

    const { error } = await supabase.from("booking_ratings").insert({
      booking_id: bookingId,
      rating,
      comment: comment.trim() || null,
      customer_name: booking?.guest_name || null,
    });

    if (error) {
      toast.error("Failed to submit rating");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (alreadyRated || submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">
              <span className="text-foreground">AV</span>{" "}
              <span className="text-primary">DETAILING</span>
            </h1>
          </div>
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Thank You! 🎉</h2>
          <p className="text-muted-foreground">
            {submitted ? "Your feedback means the world to us!" : "You've already submitted your rating."}
          </p>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-2">Help us even more with a Google review!</p>
            <Button asChild className="w-full" size="lg">
              <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
                ⭐ Leave a Google Review
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-foreground">AV</span>{" "}
            <span className="text-primary">DETAILING</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {booking?.services?.name || "Your Detail"}
          </p>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">How did we do?</h2>
          <p className="text-muted-foreground text-sm">
            Tap a star to rate your experience
          </p>
        </div>

        {/* Star selector */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={cn(
                  "h-12 w-12 transition-colors",
                  (hoveredRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-sm font-medium">
            {rating === 5 ? "Amazing! 🤩" : rating === 4 ? "Great! 😊" : rating === 3 ? "Good 👍" : rating === 2 ? "Could be better 😕" : "We're sorry 😞"}
          </p>
        )}

        <Textarea
          placeholder="Any comments? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />

        <Button
          onClick={handleSubmit}
          disabled={!rating || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Submit Rating
        </Button>
      </div>
    </div>
  );
}
