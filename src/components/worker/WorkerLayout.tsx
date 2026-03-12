import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, ClipboardList, DollarSign, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WorkerLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/worker", label: "Today", icon: CalendarDays },
  { path: "/worker/jobs", label: "All Jobs", icon: ClipboardList },
  { path: "/worker/earnings", label: "Earnings", icon: DollarSign },
  { path: "/worker/profile", label: "Profile", icon: User },
];

export function WorkerLayout({ children }: WorkerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [workerName, setWorkerName] = useState("");

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/worker/login");
        return;
      }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["staff", "admin"])
        .maybeSingle();

      if (!role) {
        toast.error("You don't have worker access");
        navigate("/worker/login");
        return;
      }

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
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{workerName}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {children}
        </div>
      </main>

      {/* Bottom mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur lg:relative lg:border-t-0 lg:border-b">
        <div className="flex justify-around max-w-4xl mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-4 text-xs transition-colors min-w-[64px]",
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
        </div>
      </nav>
    </div>
  );
}
