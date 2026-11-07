import type { ReactNode } from "react";
import { BadgePercent, Bell, ChevronLeft, ChevronRight, CreditCard, Gift, LifeBuoy, LogOut, MapPin, MessageSquare, Phone, Receipt } from "lucide-react";
import type { PortalSection } from "./PortalShell";

const BUSINESS_PHONE = "2255216264";

interface AccountProps {
  name: string; email: string; phone?: string | null; initials: string;
  onNavigate: (section: PortalSection, opts?: { receipts?: boolean }) => void;
  onSignOut: () => void;
}

export function PortalAccount({ name, email, phone, initials, onNavigate, onSignOut }: AccountProps) {
  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">{initials}</span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{name}</h1>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
          {phone && <p className="truncate text-sm text-muted-foreground">{phone}</p>}
        </div>
      </section>

      <RowGroup title="Billing">
        <Row icon={CreditCard} label="Payments" hint="Saved cards" onClick={() => onNavigate("payments")} />
        <Row icon={BadgePercent} label="Memberships" onClick={() => onNavigate("memberships")} />
        <Row icon={Receipt} label="Receipts" hint="Past visits" onClick={() => onNavigate("appointments", { receipts: true })} />
      </RowGroup>

      <RowGroup title="Preferences">
        <Row icon={MapPin} label="Addresses" onClick={() => onNavigate("addresses")} />
        <Row icon={Bell} label="Notifications" hint="Profile & reminders" onClick={() => onNavigate("notifications")} />
        <Row icon={Gift} label="Referrals" onClick={() => onNavigate("referrals")} />
      </RowGroup>

      <RowGroup title="Support">
        <Row icon={LifeBuoy} label="Help" onClick={() => onNavigate("help")} />
      </RowGroup>

      <button type="button" onClick={onSignOut} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <LogOut className="h-5 w-5" />Sign out
      </button>
    </div>
  );
}

function RowGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, hint, onClick }: { icon: typeof Bell; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1 font-medium">{label}</span>
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

export function PortalSubpage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onBack} aria-label="Back to account" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function PortalHelp() {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground">Questions about an appointment, a payment or your account? Call or text us.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <a href={`tel:${BUSINESS_PHONE}`} className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Phone className="h-5 w-5 text-primary" />Call (225) 521-6264
        </a>
        <a href={`sms:${BUSINESS_PHONE}`} className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <MessageSquare className="h-5 w-5 text-primary" />Text (225) 521-6264
        </a>
      </div>
    </div>
  );
}
