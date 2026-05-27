import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TipSectionProps {
  bookingId: string;
  serviceTotal?: number;
  manageToken?: string | null;
}

const PERCENTAGE_OPTIONS = [
  { label: "15%", value: 0.15 },
  { label: "20%", value: 0.20 },
  { label: "25%", value: 0.25 },
];

const FIXED_OPTIONS = [5, 10, 20, 30];

export function TipSection({ bookingId, serviceTotal = 0, manageToken }: TipSectionProps) {
  const [tipType, setTipType] = useState<"percentage" | "fixed" | "custom">("percentage");
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tipSent, setTipSent] = useState(false);

  const tipAmount = (() => {
    if (tipType === "percentage" && selectedTip !== null) {
      return Math.round(serviceTotal * selectedTip * 100) / 100;
    }
    if (tipType === "fixed" && selectedTip !== null) {
      return selectedTip;
    }
    if (tipType === "custom" && customAmount) {
      return parseFloat(customAmount) || 0;
    }
    return 0;
  })();

  const handleSendTip = async () => {
    if (tipAmount <= 0) {
      toast.error("Please select a tip amount");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tip-checkout", {
        body: {
          booking_id: bookingId,
          tip_amount: tipAmount,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Tip checkout error:", err);
      toast.error("Unable to process tip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (tipSent) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="font-semibold">Thank you for your generosity!</p>
          <p className="text-sm text-muted-foreground">Your tip means a lot to our team.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Leave a Tip
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Show appreciation for great service — 100% goes to your detailer
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tip type toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setTipType("percentage"); setSelectedTip(null); }}
            className={cn(
              "flex-1 text-sm font-medium py-2 rounded-md transition-colors",
              tipType === "percentage"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Percentage
          </button>
          <button
            type="button"
            onClick={() => { setTipType("fixed"); setSelectedTip(null); }}
            className={cn(
              "flex-1 text-sm font-medium py-2 rounded-md transition-colors",
              tipType === "fixed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Fixed
          </button>
          <button
            type="button"
            onClick={() => { setTipType("custom"); setSelectedTip(null); }}
            className={cn(
              "flex-1 text-sm font-medium py-2 rounded-md transition-colors",
              tipType === "custom"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Custom
          </button>
        </div>

        {/* Percentage options */}
        {tipType === "percentage" && serviceTotal > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {PERCENTAGE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setSelectedTip(opt.value)}
                className={cn(
                  "rounded-lg border p-3 text-center transition-all",
                  selectedTip === opt.value
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-lg font-bold">{opt.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ${(serviceTotal * opt.value).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Fixed options */}
        {tipType === "fixed" && (
          <div className="grid grid-cols-4 gap-2">
            {FIXED_OPTIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedTip(amount)}
                className={cn(
                  "rounded-lg border p-3 text-center transition-all",
                  selectedTip === amount
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-lg font-bold">${amount}</span>
              </button>
            ))}
          </div>
        )}

        {/* Custom amount */}
        {tipType === "custom" && (
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              max="500"
              step="1"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="pl-8 text-lg font-semibold"
            />
          </div>
        )}

        {/* Tip summary + send */}
        {tipAmount > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Tip amount: <span className="font-semibold text-foreground">${tipAmount.toFixed(2)}</span>
            </span>
            <Button onClick={handleSendTip} disabled={submitting} size="sm">
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Heart className="h-4 w-4 mr-1" />
              )}
              Send Tip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
