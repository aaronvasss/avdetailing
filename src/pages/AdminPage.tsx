import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { AdminBookingsTab } from "@/components/admin/AdminBookingsTab";
import { AdminMessagesTab } from "@/components/admin/AdminMessagesTab";
import { AdminRemindersTab } from "@/components/admin/AdminRemindersTab";
import { Calendar, MessageSquare, Bell, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, isLoading, user } = useAdminCheck();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth?redirect=/admin");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-6">
                You don't have permission to access the admin dashboard.
              </p>
              <Button onClick={() => navigate("/account")}>
                Go to My Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage bookings, view customer messages, and send reminders.
          </p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Reminders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <AdminBookingsTab />
          </TabsContent>

          <TabsContent value="messages">
            <AdminMessagesTab />
          </TabsContent>

          <TabsContent value="reminders">
            <AdminRemindersTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
