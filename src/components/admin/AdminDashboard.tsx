import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { AdminSidebar, type AdminSection } from "@/components/admin/AdminSidebar";
import { AdminBookingModal } from "@/components/account/AdminBookingModal";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";

// Lazy-load heavy admin sections so switching tabs only loads what's needed
const AppointmentsTab = lazy(() =>
  import("@/components/account/AppointmentsTab").then((m) => ({ default: m.AppointmentsTab }))
);
const AccountAnalyticsTab = lazy(() =>
  import("@/components/account/AccountAnalyticsTab").then((m) => ({ default: m.AccountAnalyticsTab }))
);
const AdminClientsTab = lazy(() =>
  import("@/components/admin/AdminClientsTab").then((m) => ({ default: m.AdminClientsTab }))
);
const AdminMembershipsTab = lazy(() =>
  import("@/components/admin/AdminMembershipsTab").then((m) => ({ default: m.AdminMembershipsTab }))
);
const AdminSettingsTab = lazy(() =>
  import("@/components/admin/AdminSettingsTab").then((m) => ({ default: m.AdminSettingsTab }))
);
const AdminTeamChatTab = lazy(() =>
  import("@/components/admin/AdminTeamChatTab").then((m) => ({ default: m.AdminTeamChatTab }))
);
const AdminTeamTrackingTab = lazy(() =>
  import("@/components/admin/AdminTeamTrackingTab").then((m) => ({ default: m.AdminTeamTrackingTab }))
);
const AdminPayrollTab = lazy(() =>
  import("@/components/admin/AdminPayrollTab").then((m) => ({ default: m.AdminPayrollTab }))
);
const AdminErrorLogsTab = lazy(() =>
  import("@/components/admin/AdminErrorLogsTab").then((m) => ({ default: m.AdminErrorLogsTab }))
);

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
  "team-chat": "Team Chat",
  payroll: "Team & Payroll",
  "team-tracking": "Team Tracking",
  "error-logs": "Error Logs",
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
      case "team-chat":
        return <AdminTeamChatTab />;
      case "payroll":
        return <AdminPayrollTab />;
      case "error-logs":
        return <AdminErrorLogsTab />;
      case "team-tracking":

        return <AdminTeamTrackingTab />;
      case "settings":
        return <AdminSettingsTab />;
      default:
        return <AdminOverviewTab isAdmin onViewBooking={() => {}} onTextCustomer={() => {}} />;
    }
  };

  return (
    <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden overscroll-none bg-background">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 flex-col min-w-0 overflow-hidden">
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
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-background/50">
          <div className="p-4 sm:p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              }
            >
              {renderContent()}
            </Suspense>
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
