import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ShieldCheck } from "lucide-react";
import { SavedCardWallet } from "./SavedCardWallet";

const PaymentsTab = ({ userId }: { userId?: string }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Saved Cards
        </CardTitle>
        <CardDescription>
          We accept credit and debit cards only. Cards are securely stored by Stripe. AV Detailing never stores your full card number or security code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SavedCardWallet userId={userId} />
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          Pay any remaining appointment balance here with your saved card. No additional processing fee is added to the balance shown.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default PaymentsTab;
