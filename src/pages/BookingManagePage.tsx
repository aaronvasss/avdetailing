import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { parseDateString, formatTime12h, businessToday } from "@/lib/time-format";
import { CancelBookingDialog } from "@/components/account/CancelBookingDialog";
import { RescheduleDialog } from "@/components/account/RescheduleDialog";
import { cancellationProblem } from "../../supabase/functions/_shared/cancellation-rules";
import { Helmet } from "react-helmet-async";

interface Appointment {
  id: string; scheduled_date: string; scheduled_time: string; status: string; deposit_amount: number | null;
  duration_minutes?: number | null; total_price: number; service_address: string; service_city: string; service_state: string;
  vehicle_year?: number | null; vehicle_make?: string | null; vehicle_model?: string | null; vehicle_type?: string | null;
  services: { name: string; slug?: string } | null;
}
export default function BookingManagePage({ defaultAction = "reschedule" }: { defaultAction?: "manage" | "cancel" | "reschedule" }) {
  const [params] = useSearchParams();
  const { bookingId: legacyId } = useParams();
  const token = params.get("token") || undefined;
  const bookingId = params.get("booking") || legacyId || undefined;
  const action = params.get("action") || defaultAction;
  const [booking, setBooking] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState("");
  const [notice, setNotice] = useState("");
  const load = async (openAction = false) => {
    setLoading(true); setError("");
    try {
      if (!token && !bookingId) { setError("This link is missing its security token. Use your latest appointment email or contact us."); return; }
      const { data, error: requestError } = await supabase.functions.invoke("manage-booking", { body: { token, bookingId, action: "get" } });
      if (requestError || !data?.booking) {
        let message = data?.error;
        try { if (!message && requestError?.context instanceof Response) message = (await requestError.context.json()).error; } catch { /* safe fallback */ }
        setError(message || "This appointment link is invalid or expired. Use your latest email, sign in to your account, or contact us."); return;
      }
      setBooking(data.booking);
      if (openAction && ["cancel", "reschedule"].includes(action) && ["pending", "confirmed"].includes(data.booking.status)) setDialog(action);
    } catch { setError("We couldn't load your appointment. Please retry or contact us."); }
    finally { setLoading(false); }
  };
  useEffect(() => { setDialog(""); setBooking(null); void load(true); }, [token, bookingId, action]);
  const problem = booking ? cancellationProblem(booking, businessToday()) : null;
  const success = (kind: string) => { setDialog(""); setNotice(kind === "cancel" ? "Appointment cancelled." : "Appointment rescheduled — pending confirmation."); void load(); };
  return <Layout>
    <Helmet><meta name="referrer" content="no-referrer" /></Helmet>
    <SEOHead title="Manage Appointment" description="Secure access to your AV Detailing appointment." path="/booking/manage" noIndex />
    <div className="container max-w-lg py-12 space-y-6">
      <h1 className="text-2xl font-bold">Manage appointment</h1>
      {loading && <p role="status">Verifying appointment link…</p>}
      {error && <div className="space-y-4"><p role="alert" className="text-destructive">{error}</p><Button variant="outline" onClick={() => void load(true)}>Retry</Button><Button asChild variant="outline"><a href="/account">My account</a></Button></div>}
      {!loading && !error && booking && <>
        {notice && <p role="status" className="text-primary">{notice}</p>}
        <dl className="space-y-4 border-y border-border py-5">
          <div><dt className="text-muted-foreground">Service</dt><dd className="font-semibold">{booking.services?.name || "Detailing Service"}</dd></div>
          <div><dt className="text-muted-foreground">Vehicle</dt><dd>{[booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || booking.vehicle_type}</dd></div>
          <div><dt className="text-muted-foreground">Appointment</dt><dd>{format(parseDateString(booking.scheduled_date), "EEEE, MMMM d, yyyy")} at {formatTime12h(booking.scheduled_time)} Central Time</dd></div>
          <div><dt className="text-muted-foreground">Location</dt><dd className="break-words">{[booking.service_address, booking.service_city, booking.service_state].filter(Boolean).join(", ")}</dd></div>
          <div><dt className="text-muted-foreground">Appointment status</dt><dd>{booking.status === "pending" ? "Pending confirmation" : booking.status}</dd></div>
          <div><dt className="text-muted-foreground">Total</dt><dd>${Number(booking.total_price).toFixed(2)}</dd></div>
        </dl>
        {problem ? <p role="alert">{problem}</p> : <div className="flex flex-wrap gap-3"><Button onClick={() => setDialog("reschedule")}>Reschedule</Button><Button variant="outline" className="text-destructive border-destructive/30" onClick={() => setDialog("cancel")}>Cancel appointment</Button></div>}
        <RescheduleDialog booking={booking} open={dialog === "reschedule"} onOpenChange={o => setDialog(o ? "reschedule" : "")} onSuccess={() => success("reschedule")} manageToken={token} emailLink />
        <CancelBookingDialog booking={booking} open={dialog === "cancel"} onOpenChange={o => setDialog(o ? "cancel" : "")} onSuccess={() => success("cancel")} manageToken={token} />
      </>}
      <div className="flex flex-wrap gap-3"><Button asChild variant="outline"><a href="tel:2255216264">Call us</a></Button><Button asChild variant="outline"><a href="sms:2255216264">Text us</a></Button></div>
    </div>
  </Layout>;
}
