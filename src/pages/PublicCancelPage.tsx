import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Car, MapPin, Check, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEOHead } from "@/components/seo/SEOHead";

interface BookingInfo {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  service_name: string;
  service_address: string;
  service_city: string;
  service_state: string;
  vehicle_info: string;
  status: string;
  guest_name: string;
}

export default function PublicCancelPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError("Invalid cancellation link.");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("This cancellation link is missing its security token. Please use the link from your confirmation email, or manage your booking from your account.");
      setLoading(false);
      return;
    }
    fetchBooking();
  }, [bookingId, token]);

  const fetchBooking = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("cancel-booking-public", {
        body: { booking_id: bookingId, manage_token: token, action: "get" },
      });
      if (fnError || data?.error) {
        setError(data?.error || "Booking not found.");
        return;
      }
      if (data.booking.status === "cancelled") {
        setError("This booking has already been cancelled.");
        return;
      }
      if (data.booking.status === "completed") {
        setError("This booking has already been completed and cannot be cancelled.");
        return;
      }
      setBooking(data.booking);
    } catch {
      setError("Unable to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("cancel-booking-public", {
        body: { booking_id: bookingId, manage_token: token, action: "cancel" },
      });
      if (fnError || data?.error) {
        toast.error(data?.error || "Failed to cancel. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(":");
      let hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      return `${hour}:${minutes?.slice(0, 2) || "00"} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading booking...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Unable to Load Booking</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/contact")}>Contact Us</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>Appointment Cancelled</CardTitle>
              <CardDescription>
                Your appointment has been cancelled. We hope to see you again soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>Return Home</Button>
                <Button onClick={() => navigate("/book")}>Book Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Cancel Booking" description="Private page." path="/cancel" noIndex />
      <div className="container max-w-lg mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cancel Appointment</CardTitle>
            <CardDescription>Are you sure you want to cancel this appointment?</CardDescription>
          </CardHeader>

          {booking && (
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(booking.scheduled_date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatTime(booking.scheduled_time)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.service_name}</p>
                    <p className="text-sm text-muted-foreground">{booking.vehicle_info}</p>
                  </div>
                </div>
                {booking.service_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{booking.service_address}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.service_city}, {booking.service_state}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancel}
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel This Appointment"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Questions? Call us at{" "}
                <a href="tel:+12255216264" className="text-primary hover:underline">
                  (225) 521-6264
                </a>
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}
