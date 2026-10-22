import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Banknote, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SavedCardWallet } from "./SavedCardWallet";

interface PaymentLinks {
  venmo_link?: string;
  cashapp_link?: string;
  zelle_link?: string;
}

const PaymentsTab = ({ userId }: { userId?: string }) => {
  const [links, setLinks] = useState<PaymentLinks>({});
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("business_settings")
          .select("key, value")
          .in("key", ["venmo_link", "cashapp_link", "zelle_link"]);
        const map: PaymentLinks = {};
        (data || []).forEach((row: { key: string; value: string }) => {
          const v = typeof row.value === "string" ? row.value.replace(/^"|"$/g, "") : String(row.value ?? "");
          if (v) map[row.key as keyof PaymentLinks] = v;
        });
        setLinks(map);
      } catch {
        // Non-fatal: links section just falls back to generic text
      } finally {
        setLoadingLinks(false);
      }
    };
    load();
  }, []);

  const openBillingPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error(data?.error || "No portal URL returned");
      }
    } catch (e) {
      toast.error(
        "Your card wallet activates after your first online payment. Book any service and pay online once to save cards here."
      );
    } finally {
      setOpeningPortal(false);
    }
  };

  const payLinks = [
    { key: "venmo_link" as const, label: "Venmo", href: links.venmo_link },
    { key: "cashapp_link" as const, label: "Cash App", href: links.cashapp_link },
    { key: "zelle_link" as const, label: "Zelle", href: links.zelle_link },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Saved Cards
          </CardTitle>
          <CardDescription>
            Cards are securely stored by Stripe. AV Detailing never stores your full card number or security code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SavedCardWallet userId={userId} />
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            Online card payments include a 3.5% processing fee. Paying with Venmo, Cash App,
            Zelle or cash has no fee.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Other Ways to Pay
          </CardTitle>
          <CardDescription>
            Prefer to pay in person? We accept Venmo, Cash App, Zelle and cash at your
            appointment, with no processing fee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLinks ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payment options…
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {payLinks.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
                >
                  <span className="font-medium">{p.label} <span className="text-xs text-muted-foreground">· External</span></span>
                  {p.href ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(p.href, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Open
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ask us at your appointment</span>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
                <span className="font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  Cash
                </span>
                <span className="text-xs text-muted-foreground">Pay your technician directly</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsTab;
