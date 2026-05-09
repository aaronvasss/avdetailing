import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Clock,
  MessageSquare,
  Bell,
  TestTube,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  Car,
  Shield,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  userName?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "calendar", label: "Calendar", icon: <CalendarDays className="h-4 w-4" /> },
  { id: "bookings", label: "Bookings", icon: <Calendar className="h-4 w-4" /> },
  { id: "appointments", label: "Appointments", icon: <Clock className="h-4 w-4" /> },
  { id: "clients", label: "Clients", icon: <Users className="h-4 w-4" /> },
  { id: "memberships", label: "Memberships", icon: <Users className="h-4 w-4" />, adminOnly: true },
  { id: "quotes", label: "Quotes", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "services", label: "Services", icon: <Car className="h-4 w-4" />, adminOnly: true },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, adminOnly: true },
  { id: "messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "reminders", label: "Reminders", icon: <Bell className="h-4 w-4" /> },
  { id: "sms-debug", label: "SMS Debug", icon: <TestTube className="h-4 w-4" />, adminOnly: true },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" />, adminOnly: true },
];

export function AdminLayout({ 
  children, 
  currentTab, 
  onTabChange, 
  isAdmin,
  userName 
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotesAttentionCount, setQuotesAttentionCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fetchAttention = async () => {
      const { data } = await supabase
        .from("quotes")
        .select("id, status, created_at, expires_at")
        .in("status", ["pending", "quoted"]);
      if (cancelled || !data) return;
      const now = Date.now();
      const followups = JSON.parse(localStorage.getItem("quote_followups") || "{}");
      const count = data.filter((q: any) => {
        const ageDays = (now - new Date(q.created_at).getTime()) / 86400000;
        const expiresInDays = q.expires_at
          ? (new Date(q.expires_at).getTime() - now) / 86400000
          : null;
        const noFollowup = !followups[q.id];
        const stalePending = q.status === "pending" && ageDays >= 3 && noFollowup;
        const expiringSoon = expiresInDays !== null && expiresInDays <= 2 && expiresInDays >= 0;
        return stalePending || expiringSoon;
      }).length;
      setQuotesAttentionCount(count);
    };
    fetchAttention();
    const interval = setInterval(fetchAttention, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg hidden sm:inline">AV Detailing</span>
            </Link>
            <Badge variant="outline" className="gap-1 hidden sm:flex">
              {isAdmin ? (
                <>
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  Admin
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3" />
                  Staff
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {userName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:pt-0 pt-16",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-1 p-4">
            <div className="mb-4 px-3">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Dashboard
              </h2>
            </div>
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  currentTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <div className="mt-6 mb-4 px-3">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Quick Links
              </h2>
            </div>
            <Link
              to="/account"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Users className="h-4 w-4" />
              My Account
            </Link>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Car className="h-4 w-4" />
              View Website
            </Link>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
