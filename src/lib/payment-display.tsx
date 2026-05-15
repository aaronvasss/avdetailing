import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Check, Clock, XCircle, AlertCircle, RotateCcw, Ban,
  CreditCard, Banknote, Smartphone, DollarSign,
  ExternalLink, Copy,
} from "lucide-react";

export const getPaymentBadge = (status: string | null | undefined) => {
  const s = (status || "unpaid").toLowerCase();
  const map: Record<string, { className: string; icon?: React.ReactNode; label?: string }> = {
    paid: { className: "border-green-500 bg-green-500/10 text-green-600", icon: <Check className="h-3 w-3" />, label: "Paid" },
    completed: { className: "border-green-500 bg-green-500/10 text-green-600", icon: <Check className="h-3 w-3" />, label: "Paid" },
    succeeded: { className: "border-green-500 bg-green-500/10 text-green-600", icon: <Check className="h-3 w-3" />, label: "Paid" },
    unpaid: { className: "border-amber-500 bg-amber-500/10 text-amber-600", icon: <AlertCircle className="h-3 w-3" />, label: "Unpaid" },
    pending: { className: "border-blue-500 bg-blue-500/10 text-blue-600", icon: <Clock className="h-3 w-3" />, label: "Pending" },
    partial: { className: "border-yellow-500 bg-yellow-500/10 text-yellow-600", icon: <Clock className="h-3 w-3" />, label: "Partial" },
    failed: { className: "border-red-500 bg-red-500/10 text-red-600", icon: <XCircle className="h-3 w-3" />, label: "Failed" },
    refunded: { className: "border-purple-500 bg-purple-500/10 text-purple-600", icon: <RotateCcw className="h-3 w-3" />, label: "Refunded" },
    expired: { className: "border-muted-foreground/40 bg-muted text-foreground", icon: <Ban className="h-3 w-3" />, label: "Expired" },
    cancelled: { className: "border-muted-foreground/40 bg-muted text-foreground", icon: <Ban className="h-3 w-3" />, label: "Cancelled" },
  };
  const cfg = map[s] || { className: "border-muted-foreground/40 bg-muted text-foreground", label: s };
  return (
    <Badge variant="outline" className={cn("gap-1", cfg.className)}>
      {cfg.icon}
      {cfg.label || s}
    </Badge>
  );
};

export const getStatusBadge = (status: string | null | undefined) => {
  const s = (status || "pending").toLowerCase();
  const map: Record<string, { className: string; icon?: React.ReactNode; label: string }> = {
    pending: { className: "border-amber-500 bg-amber-500/10 text-amber-600", icon: <AlertCircle className="h-3 w-3" />, label: "Pending" },
    pending_payment: { className: "border-orange-500 bg-orange-500/10 text-orange-600", icon: <Clock className="h-3 w-3" />, label: "Awaiting Payment" },
    confirmed: { className: "border-blue-500 bg-blue-500/10 text-blue-600", icon: <Check className="h-3 w-3" />, label: "Confirmed" },
    in_progress: { className: "border-purple-500 bg-purple-500/10 text-purple-600", icon: <Clock className="h-3 w-3" />, label: "In Progress" },
    completed: { className: "border-green-500 bg-green-500/10 text-green-600", icon: <Check className="h-3 w-3" />, label: "Completed" },
    cancelled: { className: "border-red-500 bg-red-500/10 text-red-600", icon: <XCircle className="h-3 w-3" />, label: "Cancelled" },
    no_show: { className: "border-muted-foreground/40 bg-muted text-foreground", icon: <Ban className="h-3 w-3" />, label: "No Show" },
  };
  const cfg = map[s] || { className: "border-muted-foreground/40 bg-muted text-foreground", label: s };
  return (
    <Badge variant="outline" className={cn("gap-1", cfg.className)}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
};

export const formatPaymentMethod = (method: string | null | undefined) => {
  if (!method) return "In Person";
  const map: Record<string, string> = {
    online: "Online (Stripe)",
    stripe: "Online (Stripe)",
    in_person: "In Person",
    cash: "Cash",
    venmo: "Venmo",
    zelle: "Zelle",
    card: "Card",
  };
  return map[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1);
};

export const getPaymentMethodIcon = (method: string | null | undefined) => {
  const m = (method || "in_person").toLowerCase();
  if (m === "online" || m === "stripe" || m === "card") return <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />;
  if (m === "cash") return <Banknote className="h-3.5 w-3.5 text-muted-foreground" />;
  if (m === "venmo" || m === "zelle") return <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />;
  return <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />;
};

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Failed to copy");
  }
};

const CopyableId = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <div className="text-xs text-muted-foreground">{label}</div>
    <button
      type="button"
      onClick={() => copy(value, label)}
      className="w-full flex items-center gap-2 font-mono text-xs bg-muted/50 hover:bg-muted px-2 py-1.5 rounded border text-left break-all"
      title="Click to copy"
    >
      <Copy className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
      <span className="truncate">{value}</span>
    </button>
  </div>
);

interface PaymentDetailsProps {
  payment_method?: string | null;
  payment_status?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  subtotal?: number | null;
  add_ons_total?: number | null;
  tip_amount?: number | null;
  total_price?: number | null;
}

export const PaymentDetailsSection = (b: PaymentDetailsProps) => {
  const sessionId = b.stripe_checkout_session_id || undefined;
  const intentId = b.stripe_payment_intent_id || undefined;

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="text-sm font-semibold">Payment Details</div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          {getPaymentMethodIcon(b.payment_method)}
          <span className="text-muted-foreground">Method:</span>
          <span className="font-medium">{formatPaymentMethod(b.payment_method)}</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-muted-foreground">Status:</span>
          {getPaymentBadge(b.payment_status)}
        </div>
      </div>

      {sessionId && <CopyableId label="Stripe Session ID" value={sessionId} />}
      {intentId && <CopyableId label="Stripe Payment Intent" value={intentId} />}

      {(sessionId || intentId) && (
        <div className="flex flex-wrap gap-2">
          {intentId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://dashboard.stripe.com/payments/${intentId}`, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              View in Stripe
            </Button>
          )}
          {sessionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(`https://pay.stripe.com/receipts/${sessionId}`, "Receipt link")}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy Receipt Link
            </Button>
          )}
        </div>
      )}

      <div className="border-t pt-2 space-y-1 text-sm">
        {b.subtotal != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${Number(b.subtotal).toFixed(2)}</span>
          </div>
        )}
        {b.add_ons_total != null && Number(b.add_ons_total) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Add-ons</span>
            <span>${Number(b.add_ons_total).toFixed(2)}</span>
          </div>
        )}
        {b.tip_amount != null && Number(b.tip_amount) > 0 && (
          <div className="flex justify-between text-emerald-500">
            <span>Tip</span>
            <span>${Number(b.tip_amount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-1 border-t">
          <span>Total</span>
          <span className="text-primary">${Number(b.total_price || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
