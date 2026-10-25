import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recoveryEmailSchema, recoveryUrl, RECOVERY_CONFIRMATION } from "@/lib/password-recovery";

export function ForgotPasswordForm({ destination, onBack }: { destination: string | null; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current) return;
    const parsed = recoveryEmailSchema.safeParse(email);
    if (!parsed.success) { setError("Enter a valid email address."); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const { error: failure } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: recoveryUrl(window.location.origin, destination),
      });
      // Never repeat provider errors that could disclose account existence.
      if (failure && (failure.status === 429 || (failure.status ?? 0) >= 500 || failure.name === "AuthRetryableFetchError")) {
        setError("Unable to request a reset link right now. Please wait a few minutes and try again.");
      } else setSent(true);
    } catch { setError("Unable to request a reset link right now. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  };
  return <div className="space-y-4">
    {sent ? <p role="status" className="text-muted-foreground">{RECOVERY_CONFIRMATION}</p> :
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email</Label>
          <Input id="recovery-email" type="email" autoComplete="email" maxLength={255} value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!error} aria-describedby={error ? "recovery-error" : undefined} />
        </div>
        {error && <p id="recovery-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Requesting…" : "Send reset link"}</Button>
      </form>}
    <Button variant="link" className="w-full" onClick={onBack} disabled={busy}>Back to sign in</Button>
  </div>;
}