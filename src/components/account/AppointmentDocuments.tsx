import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Plus, Printer, ExternalLink, StickyNote } from "lucide-react";
import { generateBookingReceiptHTML, openReceiptPrintWindow, ReceiptBooking, ReceiptAddOn } from "@/lib/generateReceipt";

type Note = { id: string; note: string; created_at: string };
type Payment = { id: string; amount_cents: number; status: string | null; receipt_url: string | null; created_at: string | null };

export function AppointmentDocuments({ bookingId, isAdmin = false, booking }: { bookingId: string; isAdmin?: boolean; booking?: ReceiptBooking & { booking_add_ons?: ReceiptAddOn[] } }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notesError, setNotesError] = useState(false);
  const [paymentsError, setPaymentsError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotes([]);
    setPayments([]);
    setNote("");
    setNotesError(false);
    setPaymentsError(false);
    const load = async () => {
      const results = await Promise.allSettled([
        supabase.from("customer_service_notes").select("id,note,created_at").eq("booking_id", bookingId).order("created_at", { ascending: false }),
        supabase.from("payment_records").select("id,amount_cents,status,receipt_url,created_at").eq("booking_id", bookingId).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      const [n, p] = results;
      if (n.status === "fulfilled" && !n.value.error) setNotes(n.value.data ?? []);
      else setNotesError(true);
      if (p.status === "fulfilled" && !p.value.error) setPayments(p.value.data ?? []);
      else setPaymentsError(true);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [bookingId, version]);

  const publish = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Please sign in");
      const { error } = await supabase.from("customer_service_notes").insert({ booking_id: bookingId, note: note.trim(), created_by: data.user.id });
      if (error) throw error;
      setVersion(v => v + 1);
      toast.success("Service note shared with customer");
    } catch { toast.error("Unable to save service note"); }
    finally { setBusy(false); }
  };

  return <section className="space-y-6" aria-label="Appointment records">
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-medium"><FileText className="h-4 w-4 text-primary" />Receipts</h4>
      {booking?.payment_status === "paid" && <Button size="sm" variant="outline" onClick={() => openReceiptPrintWindow(generateBookingReceiptHTML(booking, null, booking.booking_add_ons))}><Printer className="mr-2 h-4 w-4" />Print Appointment Receipt</Button>}
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading receipts…</p> : paymentsError ? <p role="alert" className="text-sm text-destructive">Unable to load payment receipts.</p> : payments.length ? payments.map(payment => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm">
        <span>${(payment.amount_cents / 100).toFixed(2)} · {(payment.status ?? "pending").replace(/_/g, " ")}{payment.created_at ? ` · ${new Date(payment.created_at).toLocaleDateString()}` : ""}</span>
        {payment.receipt_url && <Button asChild variant="outline" size="sm"><a href={payment.receipt_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View Receipt</a></Button>}
      </div>) : <p className="text-sm text-muted-foreground">No online payment receipts recorded.</p>}
    </div>
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-medium"><StickyNote className="h-4 w-4 text-primary" />Service Notes</h4>
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading service notes…</p> : notesError ? <p role="alert" className="text-sm text-destructive">Unable to load service notes.</p> : notes.length ? notes.map(item => <div key={item.id} className="space-y-1 border-l-2 border-primary pl-3"><p className="whitespace-pre-wrap break-words text-sm">{item.note}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p></div>) : <p className="text-sm text-muted-foreground">No service notes shared yet.</p>}
      {isAdmin && <div className="space-y-2"><Textarea aria-label="Customer-visible service note" placeholder="Service note for the customer" value={note} onChange={e => setNote(e.target.value)} maxLength={4000} /><Button disabled={busy || !note.trim()} variant="outline" onClick={publish}><Plus className="mr-2 h-4 w-4" />Share Service Note</Button></div>}
    </div>
    {(notesError || paymentsError) && <Button size="sm" variant="outline" onClick={() => setVersion(v => v + 1)}>Retry Records</Button>}
  </section>;
}