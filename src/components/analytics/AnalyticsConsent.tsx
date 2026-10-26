import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ANALYTICS_PREFERENCE_KEY, readAnalyticsPreference, type AnalyticsPreference } from "@/lib/analytics-policy";
import { AnalyticsRuntime, browserAnalyticsPort, observeAnalyticsNavigation } from "@/lib/analytics-runtime";
import { contactMethod, type MeasurementEvent } from "@/lib/analytics-events";

const ConsentContext = createContext<{ openSettings: () => void; track: (event: MeasurementEvent | null, occurrence: object) => void } | null>(null);
const ignoreMeasurement = () => {};
export function useLeadMeasurement() {
  return useContext(ConsentContext)?.track || ignoreMeasurement;
}

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
  // No automatic prompt: consent is only collected from the user-opened settings dialog.
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
    const stopObserving = observeAnalyticsNavigation(controller);
    const contactClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const method = contactMethod(event.target.closest("a")?.getAttribute("href") || null);
      if (method) controller.track({ name: "contact_click", params: { method } }, event);
    };
    document.addEventListener("click", contactClick, true);
    const storageChanged = (event: StorageEvent) => {
      if (event.key !== ANALYTICS_PREFERENCE_KEY && event.key !== null) return;
      const choice = readAnalyticsPreference(window.localStorage);
      controller.setPreference(choice);
      setPreference(choice);
    };
    window.addEventListener("storage", storageChanged);
    return () => {
      stopObserving(); controller.dispose(); runtime.current = null;
      document.removeEventListener("click", contactClick, true);
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

  const actions = <div className="flex flex-wrap gap-3">
    <Button variant="outline" onClick={() => choose("declined")}>Decline analytics</Button>
    <Button onClick={() => choose("accepted")}>Accept analytics</Button>
  </div>;

  return <ConsentContext.Provider value={{ openSettings: () => setSettingsOpen(true),
    track: (event, occurrence) => runtime.current?.track(event, occurrence) }}>
    {children}
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