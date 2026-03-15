import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Car,
  MapPin,
  CalendarDays,
  CreditCard,
  LogOut,
  Plus,
  Settings,
  Gift,
} from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ProfileTab } from "@/components/account/ProfileTab";
import { VehiclesTab } from "@/components/account/VehiclesTab";
import { AddressesTab } from "@/components/account/AddressesTab";
import { AppointmentsTab } from "@/components/account/AppointmentsTab";
import { MembershipsTab } from "@/components/account/MembershipsTab";
import { ReferralTab } from "@/components/account/ReferralTab";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Redirect staff-only workers to /worker
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const roleSet = new Set((roles || []).map((r) => r.role));
      if (roleSet.has("staff") && !roleSet.has("admin")) {
        navigate("/worker", { replace: true });
        return;
      }

      setUser(session.user);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        setProfileName(profile.full_name);
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        } else if (session) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading || adminLoading) {
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

  // Admin gets the full dashboard layout
  if (isAdmin) {
    return <AdminDashboard user={user} profileName={profileName} />;
  }

  // Regular customer view
  const firstName = profileName?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-custom max-w-6xl">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 p-6 sm:p-8 mb-8">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-primary mb-1">Welcome back</p>
                <h1 className="text-2xl sm:text-3xl font-bold">{firstName}</h1>
                <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
              </div>
              <div className="flex gap-3">
                <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                  <a href="/book">
                    <Plus className="mr-2 h-4 w-4" />
                    Book Service
                  </a>
                </Button>
                <Button variant="outline" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") || "appointments"} className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-card border border-border/50 p-1 h-auto">
                <TabsTrigger
                  value="appointments"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Appointments</span>
                </TabsTrigger>
                <TabsTrigger
                  value="memberships"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Memberships</span>
                </TabsTrigger>
                <TabsTrigger
                  value="vehicles"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Car className="h-4 w-4" />
                  <span>Vehicles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="addresses"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Addresses</span>
                </TabsTrigger>
                <TabsTrigger
                  value="referrals"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Gift className="h-4 w-4" />
                  <span>Referrals</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="appointments" className="mt-6">
              <AppointmentsTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="memberships" className="mt-6">
              <MembershipsTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="vehicles" className="mt-6">
              <VehiclesTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="addresses" className="mt-6">
              <AddressesTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="referrals" className="mt-6">
              <ReferralTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <ProfileTab userId={user?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
