import { Button } from "@/components/ui/button";
import { CreditCard, Wallet, ArrowLeft, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethodType = 'in_person' | 'online';

interface PaymentMethodStepProps {
  selectedMethod: PaymentMethodType | null;
  onSelectMethod: (method: PaymentMethodType) => void;
  onBack: () => void;
  onContinue: () => void;
  totalPrice: number;
  isSubmitting?: boolean;
  stripeAvailable?: boolean;
}

export const PaymentMethodStep = ({
  selectedMethod,
  onSelectMethod,
  onBack,
  onContinue,
  totalPrice,
  isSubmitting = false,
  stripeAvailable = true,
}: PaymentMethodStepProps) => {
  const processingFee = Math.round(totalPrice * 0.035 * 100) / 100;
  const onlineTotal = totalPrice + processingFee;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">How Would You Like to Pay?</h2>
        <p className="text-muted-foreground mb-4">Choose your preferred payment method</p>
        <div className="inline-block bg-muted/50 rounded-xl px-6 py-3 border border-border">
          <p className="text-sm text-muted-foreground">Package Total</p>
          <p className="text-3xl font-bold text-foreground">${totalPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pay in Person Option */}
        <button
          onClick={() => onSelectMethod('in_person')}
          disabled={isSubmitting}
          className={cn(
            "p-6 rounded-xl border-2 transition-all text-left hover:border-primary relative",
            selectedMethod === 'in_person' 
              ? "border-primary bg-primary/5" 
              : "border-border"
          )}
        >
          {selectedMethod === 'in_person' && (
            <div className="absolute top-3 right-3">
              <Check className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Pay in Person</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Pay after service is complete
              </p>
              <p className="text-xs text-muted-foreground">
                Cash, Venmo, or Cash App accepted
              </p>
            </div>
          </div>
        </button>

        {/* Pay Online Option */}
        <button
          onClick={() => stripeAvailable && onSelectMethod('online')}
          disabled={isSubmitting || !stripeAvailable}
          className={cn(
            "p-6 rounded-xl border-2 transition-all text-left relative",
            !stripeAvailable 
              ? "border-muted bg-muted/30 cursor-not-allowed opacity-60"
              : selectedMethod === 'online'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary"
          )}
        >
          {selectedMethod === 'online' && stripeAvailable && (
            <div className="absolute top-3 right-3">
              <Check className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Pay Online</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Secure checkout via Stripe
              </p>
              <p className="text-xs text-muted-foreground">
                A 3.5% processing fee (${processingFee.toFixed(2)}) will be added at checkout
              </p>
            </div>
          </div>
          {!stripeAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Online payment unavailable</span>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Dynamic Total Summary */}
      {selectedMethod && (
        <div className="bg-muted/30 rounded-xl p-4 border border-border text-center">
          {selectedMethod === 'in_person' ? (
            <p className="text-lg font-semibold text-foreground">
              Total: <span className="text-primary">${totalPrice.toFixed(2)}</span>
            </p>
          ) : (
            <p className="text-lg font-semibold text-foreground">
              Total: <span className="text-primary">${onlineTotal.toFixed(2)}</span>
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (includes ${processingFee.toFixed(2)} processing fee)
              </span>
            </p>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          className="flex-1 glow-red" 
          onClick={onContinue}
          disabled={!selectedMethod || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
