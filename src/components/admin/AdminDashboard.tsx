import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { AdminSidebar, type AdminSection } from "@/components/admin/AdminSidebar";
import { AdminBookingModal } from "@/components/account/AdminBookingModal";

// Content sections (lazy-loaded via existing components)
import { AppointmentsTab } from "@/components/account/AppointmentsTab";
import { AccountAnalyticsTab } from "@/components/account/AccountAnalyticsTab";
import { MembershipsTab } from "@/components/account/MembershipsTab";
import { ProfileTab } from "@/components/account/ProfileTab";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminClientsTab } from "@/components/admin/AdminClientsTab";
import { AdminMembershipsTab } from "@/components/admin/AdminMembershipsTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminTeamChatTab } from "@/components/admin/AdminTeamChatTab";

interface AdminDashboardProps {
  user: any;
  profileName: string | null;
}

const sectionTitles: Record<AdminSection, string> = {
  dashboard: "Dashboard",
  calendar: "Booking Calendar",
  appointments: "Appointments",
  customers: "Customers",
  memberships: "Memberships",
  analytics: "Analytics",
  settings: "Settings",
};

export default function AdminDashboard({ user, profileName }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const tabParam = searchParams.get("tab") as AdminSection | null;
  const [activeSection, setActiveSection] = useState<AdminSection>(
    tabParam && Object.keys(sectionTitles).includes(tabParam) ? tabParam : "calendar"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminBookingOpen, setAdminBookingOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const firstName = profileName?.split(" ")[0] || "Boss";

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setSearchParams({ tab: section });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminOverviewTab isAdmin onViewBooking={() => {}} onTextCustomer={() => {}} />;
      case "calendar":
        return (
          <AppointmentsTab
            key={refreshKey}
            userId={user?.id}
            isAdmin
            onAdminBook={() => setAdminBookingOpen(true)}
            defaultView="calendar"
          />
        );
      case "appointments":
        return (
          <AppointmentsTab
            key={`list-${refreshKey}`}
            userId={user?.id}
            isAdmin
            onAdminBook={() => setAdminBookingOpen(true)}
            defaultView="list"
          />
        );
      case "customers":
        return <AdminClientsTab />;
      case "memberships":
        return <AdminMembershipsTab />;
      case "analytics":
        return <AccountAnalyticsTab />;
      case "settings":
        return <AdminSettingsTab />;
      default:
        return <AdminOverviewTab isAdmin onViewBooking={() => {}} onTextCustomer={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className={cn(
          "h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/30 bg-card/50 backdrop-blur-sm flex-shrink-0",
          isMobile && "pl-14"
        )}>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold">
                {sectionTitles[activeSection]}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Hey Boss 👋 — {user?.email}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            className="shadow-lg shadow-primary/20"
            onClick={() => setAdminBookingOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">New</span>
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background/50">
          <div className="p-4 sm:p-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Admin Booking Modal */}
      <AdminBookingModal
        open={adminBookingOpen}
        onOpenChange={setAdminBookingOpen}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}
