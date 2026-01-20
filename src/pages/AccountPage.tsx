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
  Calendar,
  CreditCard,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { ProfileTab } from "@/components/account/ProfileTab";
import { VehiclesTab } from "@/components/account/VehiclesTab";
import { AddressesTab } from "@/components/account/AddressesTab";
import { BookingsTab } from "@/components/account/BookingsTab";
import { MembershipsTab } from "@/components/account/MembershipsTab";

export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-custom">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Account</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <a href="/book">
                  <Plus className="mr-2 h-4 w-4" />
                  Book Service
                </a>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50">
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="memberships" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Memberships</span>
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Vehicles</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Addresses</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <BookingsTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="memberships">
              <MembershipsTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="vehicles">
              <VehiclesTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="addresses">
              <AddressesTab userId={user?.id} />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab userId={user?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
