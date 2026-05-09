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
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold mb-1">Payment Method</h2>
        <p className="text-sm text-muted-foreground">Choose how you'd like to pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pay in Person */}
        <button
          onClick={() => onSelectMethod('in_person')}
          disabled={isSubmitting}
          className={cn(
            "p-5 rounded-xl border-2 transition-all text-center relative",
            selectedMethod === 'in_person'
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          {selectedMethod === 'in_person' && (
            <div className="absolute top-3 right-3">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <Wallet className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-base mb-1">Pay in Person</h3>
          <p className="text-xs text-muted-foreground">Cash • Venmo • Cash App</p>
          <p className="text-sm font-semibold mt-2">${totalPrice.toFixed(2)}</p>
        </button>

        {/* Pay Online */}
        <button
          onClick={() => stripeAvailable && onSelectMethod('online')}
          disabled={isSubmitting || !stripeAvailable}
          className={cn(
            "p-5 rounded-xl border-2 transition-all text-center relative",
            !stripeAvailable
              ? "border-muted bg-muted/30 cursor-not-allowed opacity-60"
              : selectedMethod === 'online'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
          )}
        >
          {selectedMethod === 'online' && stripeAvailable && (
            <div className="absolute top-3 right-3">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <CreditCard className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-base mb-1">Pay Online</h3>
          <p className="text-xs text-muted-foreground">via Stripe • All major cards accepted</p>
          <p className="text-sm font-semibold mt-2">${totalPrice.toFixed(2)}</p>
          {!stripeAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Unavailable</span>
              </div>
            </div>
          )}
        </button>
      </div>

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
