import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Download,
  Home,
  Loader2,
  Mail,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { generateICS } from "@/lib/calendar";
import { TipSection } from "@/components/booking/TipSection";
import { SEOHead } from "@/components/seo/SEOHead";

interface BookingDetails {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  service_address: string | null;
  service_city: string | null;
  service_zip: string | null;
  total_price: number | null;
  subtotal: number | null;
  add_ons_total: number | null;
  tip_amount: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  payment_status: string | null;
  payment_method: string | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  service_id: string | null;
  manage_token: string | null;
  services?: { name: string; slug?: string } | null;
  booking_add_ons?: { name: string; price: number }[] | null;
}

const BOOKING_SELECT = `
  id,
  scheduled_date,
  scheduled_time,
  service_address,
  service_city,
  service_zip,
  total_price,
  subtotal,
  add_ons_total,
  tip_amount,
  guest_name,
  guest_email,
  guest_phone,
  payment_status,
  payment_method,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  service_id,
  manage_token,
  services (name, slug),
  booking_add_ons (name, price)
`;

const VEHICLE_LABELS: Record<string, string> = {
  sedan: "Car / Sedan",
  "suv-5": "SUV (5-seater)",
  "suv-8": "SUV (Large)",
  truck: "Truck",
  car: "Car",
  suv: "SUV",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  online: "Online (Stripe)",
  stripe: "Online (Stripe)",
  card: "Online (Stripe)",
  cash: "Cash",
  in_person: "Pay In Person",
  zelle: "Zelle",
  venmo: "Venmo",
};

function formatTime(time: string) {
  try {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, "h:mm a");
  } catch {
    return time;
  }
}

function PaymentBanner({ status }: { status: string | null | undefined }) {
  if (status === "paid") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-4 py-3 flex items-center gap-3 font-semibold">
        <CheckCircle className="h-5 w-5 shrink-0" />
        <span>Payment Confirmed — Your booking is confirmed!</span>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 flex items-center gap-3 font-semibold">
        <XCircle className="h-5 w-5 shrink-0" />
        <span>Payment Failed — Please contact us at (225) 521-6264</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 px-4 py-3 flex items-center gap-3 font-semibold">
      <ClipboardList className="h-5 w-5 shrink-0" />
      <span>Booking Received — Payment not yet processed</span>
    </div>
  );
}

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  const tipStatus = searchParams.get("tip");
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [packageName, setPackageName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let query = supabase.from("bookings").select(BOOKING_SELECT);
        if (sessionId) query = query.eq("stripe_checkout_session_id", sessionId);
        else if (bookingId) query = query.eq("id", bookingId);
        else { setLoading(false); return; }

        const { data, error: err } = await query.maybeSingle();
        if (err) throw err;
        if (data) setBooking(data as unknown as BookingDetails);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Unable to load booking details");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, bookingId]);

  // Fetch package name from service_packages
  useEffect(() => {
    if (!booking?.service_id || !booking.vehicle_type) { setPackageName(null); return; }
    let cancelled = false;
    supabase
      .from("service_packages")
      .select("name")
      .eq("service_id", booking.service_id)
      .eq("vehicle_type", booking.vehicle_type)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setPackageName((data as any)?.name || null); });
    return () => { cancelled = true; };
  }, [booking?.service_id, booking?.vehicle_type]);

  const handleDownloadICS = () => {
    if (!booking) return;
    const startDate = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const fullAddress = [booking.service_address, booking.service_city, booking.service_zip].filter(Boolean).join(", ");
    const vehicleLine = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ");
    const displayName = packageName || booking.services?.name || "Detailing Service";

    const icsContent = generateICS({
      title: `AV Detailing — ${displayName}`,
      description: [
        `Package: ${displayName}`,
        vehicleLine && `Vehicle: ${vehicleLine}`,
        fullAddress && `Address: ${fullAddress}`,
        booking.total_price != null && `Total: $${Number(booking.total_price).toFixed(2)}`,
      ].filter(Boolean).join("\n"),
      startDate,
      endDate,
      location: fullAddress,
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

  const displayName = packageName || booking?.services?.name || "Detailing Service";
  const baseServiceName = booking?.services?.name || null;
  const vehicleLine = booking
    ? [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ")
    : "";
  const vehicleTypeLabel = booking?.vehicle_type ? VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type : "";
  const fullAddress = booking
    ? [booking.service_address, booking.service_city, booking.service_zip].filter(Boolean).join(", ")
    : "";
  const subtotal = Number(booking?.subtotal ?? 0);
  const addOnsTotal = Number(booking?.add_ons_total ?? 0);
  const tip = Number(booking?.tip_amount ?? 0);
  const total = Number(booking?.total_price ?? 0);
  const paymentMethodLabel = booking?.payment_method
    ? PAYMENT_METHOD_LABELS[booking.payment_method] || booking.payment_method.replace("_", " ")
    : "—";

  return (
    <Layout>
      <SEOHead title="Booking Confirmed" description="Private page." path="/booking/success" noIndex />
      <div className="section-padding">
        <div className="container-custom max-w-2xl space-y-4">
          {booking && <PaymentBanner status={booking.payment_status} />}

          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">
                {booking?.payment_status === "paid" ? "Booking Confirmed!" : "Booking Received!"}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {booking?.payment_status === "paid"
                  ? "Your payment was successful and your appointment has been scheduled."
                  : "We've received your booking request. You'll get a confirmation shortly."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-primary/40 bg-primary/5">
                <Mail className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Please check your email inbox for your full booking confirmation. It contains important pre-appointment instructions to help us give you the best results.
                </AlertDescription>
              </Alert>

              {booking && (
                <>
                  {/* Booking Summary */}
                  <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                    <h3 className="font-semibold text-lg">Booking Summary</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-medium text-right">{displayName}</span>
                      </div>
                      {baseServiceName && baseServiceName !== displayName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service</span>
                          <span className="font-medium text-right">{baseServiceName}</span>
                        </div>
                      )}
                      {(vehicleLine || vehicleTypeLabel) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vehicle</span>
                          <span className="font-medium text-right">
                            {vehicleLine || ""}
                            {vehicleLine && vehicleTypeLabel ? " · " : ""}
                            {vehicleTypeLabel}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">
                          {format(new Date(booking.scheduled_date), 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">{formatTime(booking.scheduled_time)}</span>
                      </div>
                      {fullAddress && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Location</span>
                          <span className="font-medium text-right">{fullAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                    <h3 className="font-semibold text-lg mb-2">Price Breakdown</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Package</span>
                      <span>${(subtotal || total - addOnsTotal - tip).toFixed(2)}</span>
                    </div>

                    {addOnsTotal > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Add-ons</span>
                          <span>${addOnsTotal.toFixed(2)}</span>
                        </div>
                        {booking.booking_add_ons && booking.booking_add_ons.length > 0 && (
                          <div className="pl-4 space-y-0.5">
                            {booking.booking_add_ons.map((a, i) => (
                              <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                <span>+ {a.name}</span>
                                <span>${Number(a.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {tip > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tip</span>
                        <span className="text-emerald-500">${tip.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="font-semibold text-base">
                        {booking.payment_status === "paid" ? "Total Paid" : "Total"}
                      </span>
                      <span className="font-bold text-lg text-primary">
                        ${total.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Payment Method</span>
                      <span>{paymentMethodLabel}</span>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <p className="text-center text-muted-foreground">{error}</p>
              )}

              {/* Tip Section */}
              {booking && tipStatus !== "success" && (
                <TipSection bookingId={booking.id} serviceTotal={booking.total_price || 0} />
              )}
              {tipStatus === "success" && (
                <Alert className="border-primary/40 bg-primary/5">
                  <AlertDescription className="text-sm text-center">
                    <strong>Thank you for the tip!</strong> Your generosity means a lot to our team. ❤️
                  </AlertDescription>
                </Alert>
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
