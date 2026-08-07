import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays,
  ClipboardList,
  DollarSign,
  User,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Wrench,
  BookOpen,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { WorkerNotificationBell } from "./WorkerNotificationBell";
import { NotificationPermissionPrompt } from "./NotificationPermissionPrompt";
import { ClockInCard } from "./ClockInCard";

interface WorkerLayoutProps {
  children: ReactNode;
}

const primaryNavItems = [
  { path: "/worker", label: "Today", icon: CalendarDays },
  { path: "/worker/ops", label: "Jobs", icon: Wrench },
  { path: "/worker/sop", label: "SOPs", icon: BookOpen },
  { path: "/worker/chat", label: "Chat", icon: MessageSquare },
];

const moreNavItems = [
  { path: "/worker/pay", label: "Pay & Hours", icon: DollarSign },
  { path: "/worker/profile", label: "Profile", icon: User },
  { path: "/worker/jobs", label: "Bookings", icon: ClipboardList },
];

const managerMoreItems = [
  { path: "/worker/qc", label: "QC", icon: ShieldCheck },
  { path: "/admin", label: "Booking Calendar", icon: CalendarDays },
];


export function WorkerLayout({ children }: WorkerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [workerName, setWorkerName] = useState("");
  const [showNotifPrompt, setShowNotifPrompt] = useState(true);
  const [canReviewQc, setCanReviewQc] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const moreItems = canReviewQc ? [...moreNavItems, ...managerMoreItems] : moreNavItems;


  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/worker/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roleSet = new Set((roles || []).map((r) => r.role));
      const hasPortalAccess =
        roleSet.has("staff") ||
        roleSet.has("admin") ||
        roleSet.has("manager") ||
        roleSet.has("marketing");
      if (!hasPortalAccess) {
        toast.error("You don't have worker access");
        navigate("/account");
        return;
      }
      setCanReviewQc(roleSet.has("admin") || roleSet.has("manager"));


      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      setWorkerName(profile?.full_name || user.email || "Worker");
    };

    checkAccess();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/worker/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <span className="text-lg font-bold">
              <span className="text-foreground">AV</span>{" "}
              <span className="text-primary">DETAILING</span>
            </span>
            <span className="ml-2 text-xs text-muted-foreground">Worker</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{workerName}</span>
            <WorkerNotificationBell />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
          <NotificationPermissionPrompt />
          <ClockInCard />
          {children}
        </div>
      </main>

      {/* Bottom mobile nav — exactly 5 items */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur lg:relative lg:border-t-0 lg:border-b">
        <div className="flex max-w-4xl mx-auto lg:justify-around">
          {primaryNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/worker" && location.pathname.startsWith(`${item.path}/`));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs transition-colors min-w-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs transition-colors min-w-0",
              moreItems.some((i) => location.pathname.startsWith(i.path))
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {/* More menu */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="mt-3 space-y-1 pb-4">
            {moreItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  setMoreOpen(false);
                  navigate(item.path);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
