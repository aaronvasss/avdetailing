import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Download, Home, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { generateICS } from "@/lib/calendar";

interface BookingDetails {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  service_address: string;
  service_city: string;
  total_price: number;
  guest_name: string | null;
  guest_email: string | null;
  services?: {
    name: string;
  };
}

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchBookingBySession();
    } else if (bookingId) {
      fetchBookingById();
    } else {
      setLoading(false);
    }
  }, [sessionId, bookingId]);

  const fetchBookingBySession = async () => {
    try {
      // Find booking by checkout session ID
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          service_address,
          service_city,
          total_price,
          guest_name,
          guest_email,
          payment_status,
          services (name)
        `)
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBooking(data);
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Unable to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingById = async () => {
    try {
      // Find booking by ID
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          service_address,
          service_city,
          total_price,
          guest_name,
          guest_email,
          payment_status,
          services (name)
        `)
        .eq("id", bookingId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBooking(data);
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Unable to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadICS = () => {
    if (!booking) return;

    const startDate = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const icsContent = generateICS({
      title: `AV Detailing - ${booking.services?.name || 'Detailing Service'}`,
      description: `Your vehicle detailing appointment at ${booking.service_address}, ${booking.service_city}`,
      startDate,
      endDate,
      location: `${booking.service_address}, ${booking.service_city}`,
    });

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'av-detailing-appointment.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-custom max-w-2xl">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Booking Confirmed!</CardTitle>
              <p className="text-muted-foreground mt-2">
                Your payment was successful and your appointment has been scheduled.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {booking && (
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg">{booking.services?.name || 'Detailing Service'}</h3>
                  
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {format(new Date(booking.scheduled_date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{booking.scheduled_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-right">
                        {booking.service_address}<br />
                        {booking.service_city}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Total Paid</span>
                      <span className="font-bold text-primary">
                        ${booking.total_price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-center text-muted-foreground">{error}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {booking && (
                  <Button variant="outline" className="flex-1" onClick={handleDownloadICS}>
                    <Download className="mr-2 h-4 w-4" />
                    Add to Calendar
                  </Button>
                )}
                <Button asChild className="flex-1">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Return Home
                  </Link>
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                A confirmation email has been sent with your appointment details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
