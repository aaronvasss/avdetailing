import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/seo/SEOHead";
import { recoveryCredentials, recoveryDestination, replacementPasswordSchema } from "@/lib/password-recovery";

// Capture the implicit recovery intent before the provider consumes the hash.
const initialRecovery = recoveryCredentials(window.location.hash);

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const destination = recoveryDestination(params.get("redirect"));
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "success">("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const verifiedUser = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    const credentials = recoveryCredentials(window.location.hash) ?? initialRecovery;
    const verify = async (recoveryUserId?: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || (!recoveryUserId && session.access_token !== credentials?.accessToken) ||
          (recoveryUserId && session.user.id !== recoveryUserId)) {
          if (active) setState("invalid"); return;
        }
        const { data, error: failure } = await supabase.auth.getUser();
        if (!active) return;
        if (failure || !data.user || data.user.id !== session.user.id) { setState("invalid"); return; }
        verifiedUser.current = data.user.id; setState("ready");
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch { if (active) setState("invalid"); }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setTimeout(() => { if (active) void verify(session.user.id); }, 0);
      if (event === "SIGNED_OUT" && active) { verifiedUser.current = null; setState(current => current === "success" ? current : "invalid"); }
    });
    void verify();
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current || state !== "ready") return;
    const parsed = replacementPasswordSchema.safeParse({ password, confirmation });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your password."); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const { data, error: invalid } = await supabase.auth.getUser();
      if (invalid || !data.user || data.user.id !== verifiedUser.current) { setState("invalid"); return; }
      const { error: failure } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (failure) {
        if (failure.status === 401 || failure.status === 403 || failure.code === "session_not_found" || failure.code === "refresh_token_not_found") setState("invalid");
        else setError(failure.code === "weak_password" ? "Choose a stronger password and try again." : failure.code === "same_password" ? "Choose a password different from your current password." : "Unable to save your password. Please try again or request a new link.");
        return;
      }
      setPassword(""); setConfirmation(""); setState("success"); verifiedUser.current = null;
      await supabase.auth.signOut({ scope: "local" });
    } catch { setError("Unable to save your password. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  };
  const signIn = `/auth?redirect=${encodeURIComponent(destination)}&recovered=1`;
  return <Layout>
    <SEOHead title="Reset Password" description="Securely reset your AV Detailing account password." path="/reset-password" noIndex />
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">{state === "success" ? "Password updated" : "Reset password"}</h1>
        {state === "checking" && <p role="status" className="text-muted-foreground text-center">Checking your recovery link…</p>}
        {state === "invalid" && <div className="space-y-4">
          <p role="alert" className="text-muted-foreground">This recovery link is invalid or has expired. Request a new link and open the latest email.</p>
          <Button className="w-full" onClick={() => navigate(`/auth?mode=recovery&redirect=${encodeURIComponent(destination)}`)}>Request a new link</Button>
          <Button variant="link" className="w-full" onClick={() => navigate(signIn)}>Back to sign in</Button>
        </div>}
        {state === "ready" && <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-muted-foreground">Choose a new password with at least 6 characters.</p>
          <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" maxLength={100} value={password} onChange={event => setPassword(event.target.value)} aria-describedby={error ? "password-error" : undefined} /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" maxLength={100} value={confirmation} onChange={event => setConfirmation(event.target.value)} aria-describedby={error ? "password-error" : undefined} /></div>
          {error && <p id="password-error" role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
        </form>}
        {state === "success" && <div className="space-y-4"><p role="status" className="text-muted-foreground">Your password has been updated. Sign in with your new password to return to your account.</p><Button className="w-full" onClick={() => navigate(signIn)} disabled={busy}>Back to sign in</Button></div>}
      </div>
    </div>
  </Layout>;
}