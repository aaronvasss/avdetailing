import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export type AdminSection =
  | "dashboard"
  | "calendar"
  | "appointments"
  | "customers"
  | "memberships"
  | "analytics"
  | "team-chat"
  | "settings";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onSignOut: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const navItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Booking Calendar", icon: CalendarDays },
  { id: "appointments", label: "Appointments", icon: ListChecks },
  { id: "customers", label: "Customers", icon: Users },
  { id: "memberships", label: "Memberships", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "team-chat", label: "Team Chat", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({
  activeSection,
  onSectionChange,
  onSignOut,
  collapsed,
  onCollapsedChange,
}: AdminSidebarProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (section: AdminSection) => {
    onSectionChange(section);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2 px-4 h-16 border-b border-border/30 flex-shrink-0",
        collapsed && !isMobile && "justify-center px-2"
      )}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-1 font-bold text-lg tracking-tight">
            <span className="text-foreground">AV</span>
            <span className="text-primary">DETAILING</span>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="font-bold text-lg text-primary">AV</div>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground border border-transparent",
                collapsed && !isMobile && "justify-center px-2"
              )}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="px-2 py-2 border-t border-border/30">
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="px-2 pb-4 border-t border-border/30 pt-2">
        <button
          onClick={onSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && !isMobile && "justify-center px-2"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 bg-card/80 backdrop-blur-sm border border-border/50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-border/30 flex-shrink-0 h-screen sticky top-0 z-40 transition-all duration-300",
          isMobile
            ? cn(
                "fixed top-0 left-0 h-full w-[260px] transform",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              )
            : collapsed
            ? "w-[68px]"
            : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
