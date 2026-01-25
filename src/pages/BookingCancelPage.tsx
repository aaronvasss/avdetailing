import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Car, MapPin, AlertTriangle, Check, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingDetails {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceName: string;
  serviceAddress: string;
  serviceCity: string;
  serviceState: string;
  vehicleInfo: string;
  vehicleType: string;
  totalPrice: number;
  status: string;
  customerName: string;
}

export default function BookingCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid link. Please use the link from your confirmation email.");
      setLoading(false);
      return;
    }

    fetchBooking();
  }, [token]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: { token, action: "get" },
      });

      if (error || data?.error) {
        setError(data?.error || "Unable to find booking. The link may have expired.");
        return;
      }

      setBooking(data.booking);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Unable to load booking details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: {
          token,
          action: "cancel",
          reason,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to cancel. Please try again.");
        return;
      }

      setSuccess(true);
      toast.success("Booking cancelled successfully");
    } catch (err) {
      console.error("Error cancelling:", err);
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

  // Check if cancellation is within 24 hours
  const isLateCancellation = () => {
    if (!booking) return false;
    const appointmentDate = new Date(booking.scheduledDate);
    const [hours] = booking.scheduledTime.split(":");
    appointmentDate.setHours(parseInt(hours), 0, 0, 0);
    const hoursUntil = (appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil < 24;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading your booking...</p>
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
              <CardTitle>Booking Cancelled</CardTitle>
              <CardDescription>
                Your appointment has been cancelled. We've sent a confirmation to your email.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                We hope to see you again soon!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return Home
                </Button>
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
      <div className="container max-w-lg mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cancel Booking</CardTitle>
            <CardDescription>Are you sure you want to cancel this appointment?</CardDescription>
          </CardHeader>

          {booking && (
            <CardContent className="space-y-6">
              {/* Late cancellation warning */}
              {isLateCancellation() && (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-600">Late Cancellation Notice</p>
                    <p className="text-sm text-muted-foreground">
                      This appointment is within 24 hours. Please consider rescheduling instead if possible.
                    </p>
                  </div>
                </div>
              )}

              {/* Booking details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(booking.scheduledDate), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(booking.scheduledTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.serviceName}</p>
                    <p className="text-sm text-muted-foreground">{booking.vehicleInfo || booking.vehicleType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.serviceAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.serviceCity}, {booking.serviceState}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reason for cancellation (optional)
                </label>
                <Textarea
                  placeholder="Let us know why you're cancelling..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/booking/manage?token=${token}`)}
                >
                  Reschedule Instead
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Booking"
                  )}
                </Button>
              </div>

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
