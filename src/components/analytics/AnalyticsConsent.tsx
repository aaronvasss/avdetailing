import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ANALYTICS_PREFERENCE_KEY, publicAnalyticsPage, readAnalyticsPreference, type AnalyticsPreference } from "@/lib/analytics-policy";
import { AnalyticsRuntime, browserAnalyticsPort, observeAnalyticsNavigation } from "@/lib/analytics-runtime";

const ConsentContext = createContext<{ openSettings: () => void } | null>(null);

export function AnalyticsSettingsControl() {
  const context = useContext(ConsentContext);
  if (!context) return null;
  return <Button variant="link" className="h-auto p-0 text-muted-foreground whitespace-normal" onClick={context.openSettings}>
    Analytics settings
  </Button>;
}

export function AnalyticsConsentProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  // Preference state is client-only; prerender remains collection-disabled.
  const [hydrated, setHydrated] = useState(false);
  const [preference, setPreference] = useState<AnalyticsPreference>("unset");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const runtime = useRef<AnalyticsRuntime | null>(null);

  useEffect(() => {
    const controller = new AnalyticsRuntime(browserAnalyticsPort());
    runtime.current = controller;
    const saved = readAnalyticsPreference(window.localStorage);
    controller.navigate(window.location.pathname);
    controller.setPreference(saved);
    setPreference(saved);
    setHydrated(true);
    const stopObserving = observeAnalyticsNavigation(controller);
    const storageChanged = (event: StorageEvent) => {
      if (event.key !== ANALYTICS_PREFERENCE_KEY && event.key !== null) return;
      const choice = readAnalyticsPreference(window.localStorage);
      controller.setPreference(choice);
      setPreference(choice);
    };
    window.addEventListener("storage", storageChanged);
    return () => {
      stopObserving(); controller.dispose(); runtime.current = null;
      window.removeEventListener("storage", storageChanged);
    };
  }, []);

  useEffect(() => { runtime.current?.navigate(location.pathname); }, [location.pathname]);

  const choose = (choice: "accepted" | "declined") => {
    // Stop collection before attempting storage/UI updates on withdrawal.
    runtime.current?.setPreference(choice);
    try { window.localStorage.setItem(ANALYTICS_PREFERENCE_KEY, choice); }
    catch { /* Choice applies in-memory; a future visit remains fail-closed. */ }
    setPreference(choice);
    setSettingsOpen(false);
  };

  const publicPage = Boolean(publicAnalyticsPage(location.pathname));
  const actions = <div className="flex flex-wrap gap-3">
    <Button variant="outline" onClick={() => choose("declined")}>Decline analytics</Button>
    <Button onClick={() => choose("accepted")}>Accept analytics</Button>
  </div>;

  return <ConsentContext.Provider value={{ openSettings: () => setSettingsOpen(true) }}>
    {children}
    {hydrated && preference === "unset" && publicPage && <section aria-label="Optional analytics" className="fixed bottom-16 lg:bottom-4 left-3 right-3 z-40 mx-auto max-w-xl border border-border rounded-md bg-card p-4 shadow-lg">
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Optional analytics</h2>
        <p className="text-sm text-muted-foreground">Allow Google Analytics to measure visits to public pages? Booking works either way.</p>
        {actions}
      </div>
    </section>}
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-md">
        <DialogHeader>
          <DialogTitle>Optional analytics</DialogTitle>
          <DialogDescription>Choose whether Google Analytics may measure visits to public pages. You can change this preference anytime.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Current preference: {preference === "accepted" ? "Accepted" : preference === "declined" ? "Declined" : "Not chosen"}</p>
        <p className="text-sm text-muted-foreground">Declining stops future collection; it does not remove visits already measured.</p>
        {actions}
      </DialogContent>
    </Dialog>
  </ConsentContext.Provider>;
}