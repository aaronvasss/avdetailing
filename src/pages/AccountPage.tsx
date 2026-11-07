import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Car, CreditCard, LifeBuoy, RotateCcw } from "lucide-react";
import { PortalShell, type PortalSection } from "@/components/portal/PortalShell";
import { PortalAccount, PortalHelp, PortalSubpage } from "@/components/portal/PortalAccount";
import { PortalMembershipSummary } from "@/components/portal/PortalMembershipSummary";
import { centralGreeting, displayFirstName, initialsOf } from "@/components/portal/portal-format";
import { useAuth } from "@/hooks/useAuth";
import { ProfileTab } from "@/components/account/ProfileTab";
import { VehiclesTab } from "@/components/account/VehiclesTab";
import { AddressesTab } from "@/components/account/AddressesTab";
import { AppointmentsTab } from "@/components/account/AppointmentsTab";
import { MembershipsTab } from "@/components/account/MembershipsTab";
import { ReferralTab } from "@/components/account/ReferralTab";
import PaymentsTab from "@/components/account/PaymentsTab";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { SEOHead } from "@/components/seo/SEOHead";
import { PrepChecklist } from "@/components/account/PrepChecklist";
import { AccountActivity } from "@/components/account/AccountActivity";

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, role, isAdmin, loading: authLoading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [profilePhone, setProfilePhone] = useState<string | null>(null);
  const [section, setSection] = useState<PortalSection>(initialSection);
  const [receipts, setReceipts] = useState(false);


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?redirect=/account", { replace: true });
      return;
    }
    if (role === "staff") {
      navigate("/worker", { replace: true });
    }
  }, [authLoading, navigate, role, user]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!user) {
        setProfileName(null);
        setProfileError(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      try {
        const request = supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", user.id)
          .maybeSingle();

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 15000)
        );

        const { data: profile, error } = (await Promise.race([request, timeout])) as Awaited<
          typeof request
        >;

        if (cancelled) return;

        if (error) {
          setProfileError(error.message || "Could not load your account.");
        } else {
          setProfileName(profile?.full_name || null);
          setProfilePhone(profile?.phone || null);
        }
      } catch (err) {
        if (!cancelled) {
          setProfileError(
            err instanceof Error ? err.message : "Could not load your account."
          );
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading your account...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (profileError) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <h1 className="text-xl font-bold">We couldn't load your account</h1>
            <p className="text-muted-foreground text-sm">{profileError}</p>
            <div className="flex gap-3">
              <Button onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }


  // Admin gets the full dashboard layout
  if (isAdmin && new URLSearchParams(window.location.search).get('view')!=='client') {
    return <AdminDashboard user={user} profileName={profileName} />;
  }

  // Regular customer view (portal shell; same data components as before)
  const firstName = displayFirstName(profileName, user?.email);
  const fullName = profileName?.trim() || firstName;
  const initials = initialsOf(profileName, user?.email);
  const go = (next: PortalSection, opts?: { receipts?: boolean }) => {
    setReceipts(!!opts?.receipts);
    setSection(next);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0 });
  };
  const back = () => go("account");
  const uid = user?.id as string;

  let screen: ReactNode;
  switch (section) {
    case "appointments":
      screen = <AppointmentsTab key={receipts ? "past" : "upcoming"} userId={uid} mode="list" initialListTab={receipts ? "past" : "upcoming"} />;
      break;
    case "vehicles":
      screen = <VehiclesTab userId={uid} />;
      break;
    case "account":
      screen = <PortalAccount name={fullName} email={user?.email ?? ""} phone={profilePhone} initials={initials} onNavigate={go} onSignOut={handleSignOut} />;
      break;
    case "payments":
      screen = <PortalSubpage title="Payments" onBack={back}><PaymentsTab userId={uid} /></PortalSubpage>;
      break;
    case "memberships":
      screen = <PortalSubpage title="Memberships" onBack={back}><MembershipsTab userId={uid} /></PortalSubpage>;
      break;
    case "addresses":
      screen = <PortalSubpage title="Addresses" onBack={back}><AddressesTab userId={uid} /></PortalSubpage>;
      break;
    case "notifications":
      screen = <PortalSubpage title="Notifications & profile" onBack={back}><ProfileTab userId={uid} /></PortalSubpage>;
      break;
    case "referrals":
      screen = <PortalSubpage title="Referrals" onBack={back}><ReferralTab userId={uid} /></PortalSubpage>;
      break;
    case "help":
      screen = <PortalSubpage title="Help" onBack={back}><PortalHelp /></PortalSubpage>;
      break;
    default:
      screen = (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{centralGreeting()}, {firstName}</h1>
          <AppointmentsTab
            userId={uid}
            mode="home"
            afterNext={<PrepChecklist />}
            onSeeAll={() => go("appointments", { receipts: true })}
            homeExtras={(lastId) => (
              <div className="space-y-4">
                <section aria-label="Quick actions" className="grid grid-cols-2 gap-3">
                  <QuickAction icon={RotateCcw} label="Book again" to={lastId ? `/book?repeat=${lastId}` : "/book"} />
                  <QuickAction icon={Car} label="My vehicles" onClick={() => go("vehicles")} />
                  <QuickAction icon={CreditCard} label="Payments" onClick={() => go("payments")} />
                  <QuickAction icon={LifeBuoy} label="Get help" onClick={() => go("help")} />
                </section>
                <PortalMembershipSummary userId={uid} onOpen={() => go("memberships")} />
              </div>
            )}
          />
          <AccountActivity userId={uid} />
        </div>
      );
  }

  return (
    <>
      <SEOHead title="My Account" description="Private page." path="/account" noIndex />
      <PortalShell
        section={section}
        onNavigate={go}
        name={fullName}
        email={user?.email ?? ""}
        initials={initials}
        isAdmin={isAdmin}
        onBackToAdmin={() => navigate("/account")}
        onSignOut={handleSignOut}
      >
        {screen}
      </PortalShell>
    </>
  );
}

function QuickAction({ icon: Icon, label, to, onClick }: { icon: typeof Car; label: string; to?: string; onClick?: () => void }) {
  const cls = "flex min-h-[72px] flex-col items-start justify-between gap-2 rounded-2xl border border-border/60 bg-card p-3.5 text-left font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const body = <><Icon className="h-5 w-5 text-primary" aria-hidden="true" />{label}</>;
  return to ? <Link to={to} className={cls}>{body}</Link> : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

const LEGACY_TABS: Record<string, PortalSection> = { settings: "notifications" };
function initialSection(): PortalSection {
  const tab = new URLSearchParams(window.location.search).get("tab") || "home";
  const mapped = (LEGACY_TABS[tab] ?? tab) as PortalSection;
  const valid: PortalSection[] = ["home", "appointments", "vehicles", "account", "payments", "memberships", "addresses", "notifications", "referrals", "help"];
  return valid.includes(mapped) ? mapped : "home";
}
