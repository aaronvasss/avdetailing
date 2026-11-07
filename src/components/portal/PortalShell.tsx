import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Car, ChevronRight, Home, LogOut, Plus, User, Bell, CreditCard, BadgePercent, MapPin, Gift, LifeBuoy, Receipt, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PortalSection =
  | "home" | "appointments" | "vehicles" | "account"
  | "payments" | "memberships" | "addresses" | "notifications" | "referrals" | "help";

export const ACCOUNT_SECTIONS: PortalSection[] = ["account", "payments", "memberships", "addresses", "notifications", "referrals", "help"];

const MAIN_NAV = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "appointments" as const, label: "Appointments", icon: CalendarDays },
  { id: "vehicles" as const, label: "Vehicles", icon: Car },
  { id: "account" as const, label: "Account", icon: User },
];

const ACCOUNT_NAV = [
  { id: "payments" as const, label: "Payments", icon: CreditCard },
  { id: "memberships" as const, label: "Memberships", icon: BadgePercent },
  { id: "addresses" as const, label: "Addresses", icon: MapPin },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "referrals" as const, label: "Referrals", icon: Gift },
  { id: "help" as const, label: "Help", icon: LifeBuoy },
];

interface PortalShellProps {
  section: PortalSection;
  onNavigate: (section: PortalSection, opts?: { receipts?: boolean }) => void;
  name: string;
  email: string;
  initials: string;
  isAdmin?: boolean;
  onBackToAdmin?: () => void;
  onSignOut: () => void;
  children: ReactNode;
}

const isActive = (current: PortalSection, id: PortalSection) =>
  id === "account" ? current === "account" : current === id;

export function PortalShell({ section, onNavigate, name, email, initials, isAdmin, onBackToAdmin, onSignOut, children }: PortalShellProps) {
  const accountArea = ACCOUNT_SECTIONS.includes(section);
  return (
    <div className="min-h-screen bg-background text-foreground text-[15px] overflow-x-hidden">
      <header className="sticky top-0 z-40 h-14 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="text-lg font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label="AV Detailing home">
            AV <span className="text-primary">DETAILING</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && onBackToAdmin && (
              <Button variant="outline" size="sm" onClick={onBackToAdmin} className="h-9">
                <Shield className="h-4 w-4 mr-1.5" />Admin
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open account menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {initials}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
                <SheetHeader className="border-b border-border/60 p-5 text-left">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">{initials}</span>
                    <div className="min-w-0">
                      <SheetTitle className="truncate text-base">{name}</SheetTitle>
                      <p className="truncate text-sm text-muted-foreground">{email}</p>
                    </div>
                  </div>
                </SheetHeader>
                <nav className="p-2" aria-label="Account menu">
                  <SheetRow icon={User} label="Account" onClick={() => onNavigate("account")} />
                  <SheetRow icon={Bell} label="Notifications" onClick={() => onNavigate("notifications")} />
                  <SheetRow icon={Receipt} label="Receipts" onClick={() => onNavigate("appointments", { receipts: true })} />
                  <SheetRow icon={LifeBuoy} label="Help" onClick={() => onNavigate("help")} />
                  <button type="button" onClick={onSignOut} className="mt-2 flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 text-left font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <LogOut className="h-5 w-5" />Sign out
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 lg:px-4">
        <aside className="hidden lg:block w-60 shrink-0 py-6" aria-label="Portal navigation">
          <nav className="sticky top-20 space-y-1">
            <Link to="/book" className="mb-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Plus className="h-4 w-4" />Book a detail
            </Link>
            {MAIN_NAV.map(item => (
              <SideItem key={item.id} {...item} active={item.id === "account" ? accountArea : isActive(section, item.id)} onClick={() => onNavigate(item.id)} />
            ))}
            <p className="px-3 pt-5 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
            {ACCOUNT_NAV.map(item => (
              <SideItem key={item.id} {...item} active={section === item.id} onClick={() => onNavigate(item.id)} />
            ))}
            <button type="button" onClick={onSignOut} className="mt-4 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <LogOut className="h-4 w-4" />Sign out
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:px-0 lg:py-6">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Portal navigation"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {MAIN_NAV.slice(0, 2).map(item => <BottomItem key={item.id} {...item} active={isActive(section, item.id)} onClick={() => onNavigate(item.id)} />)}
          <li className="flex justify-center">
            <Link to="/book" aria-label="Book a detail" className="flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-primary focus-visible:outline-none">
              <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background">
                <Plus className="h-6 w-6" />
              </span>
              Book
            </Link>
          </li>
          {MAIN_NAV.slice(2).map(item => <BottomItem key={item.id} {...item} active={item.id === "account" ? accountArea : isActive(section, item.id)} onClick={() => onNavigate(item.id)} />)}
        </ul>
      </nav>
    </div>
  );
}

function SheetRow({ icon: Icon, label, onClick }: { icon: typeof Home; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function SideItem({ icon: Icon, label, active, onClick }: { icon: typeof Home; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />{label}
    </button>
  );
}

function BottomItem({ icon: Icon, label, active, onClick }: { icon: typeof Home; label: string; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-[60px] w-full flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {label}
      </button>
    </li>
  );
}
