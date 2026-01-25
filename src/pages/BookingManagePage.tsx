import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, Car, DollarSign, Check, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  serviceZip: string;
  vehicleInfo: string;
  vehicleType: string;
  totalPrice: number;
  subtotal: number;
  addOnsTotal: number;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addOns: Array<{ name: string; price: number }>;
}

const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];

export default function BookingManagePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
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

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a new date and time");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: {
          token,
          action: "reschedule",
          newDate: format(selectedDate, "yyyy-MM-dd"),
          newTime: selectedTime,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to reschedule. Please try again.");
        return;
      }

      setSuccess(true);
      toast.success("Appointment rescheduled successfully!");
    } catch (err) {
      console.error("Error rescheduling:", err);
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
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>Appointment Rescheduled!</CardTitle>
              <CardDescription>
                Your new appointment is scheduled for{" "}
                <span className="font-semibold text-foreground">
                  {selectedDate && format(selectedDate, "MMMM d, yyyy")} at {selectedTime}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation to your email and phone.
              </p>
              <Button onClick={() => navigate("/")}>Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reschedule Your Appointment</h1>
          <p className="text-muted-foreground">Select a new date and time for your detailing service</p>
        </div>

        {booking && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Current Booking Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      {booking.serviceCity}, {booking.serviceState} {booking.serviceZip}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">${booking.totalPrice?.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total price</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reschedule Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select New Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">New Date</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">New Time</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleReschedule}
                  disabled={!selectedDate || !selectedTime || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    "Confirm Reschedule"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Need to cancel instead?{" "}
                  <a
                    href={`/booking/cancel?token=${token}`}
                    className="text-primary hover:underline"
                  >
                    Cancel booking
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
