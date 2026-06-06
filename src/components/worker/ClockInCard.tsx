import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, LogIn, LogOut, MapPin, Shield } from "lucide-react";
import { useShiftTracking } from "@/hooks/useShiftTracking";
import { formatStopwatch } from "@/lib/duration-format";
import { format } from "date-fns";

export function ClockInCard() {
  const { loading, working, activeShift, hasConsent, clockIn, clockOut, grantConsent } =
    useShiftTracking();
  const [consentOpen, setConsentOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeShift) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeShift]);

  const handleClockInClick = async () => {
    if (!hasConsent) {
      setConsentOpen(true);
      return;
    }
    await clockIn();
  };

  const handleConsent = async () => {
    if (!agreed) return;
    const ok = await grantConsent();
    if (ok) {
      setConsentOpen(false);
      await clockIn();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const elapsed = activeShift ? now - new Date(activeShift.clock_in_at).getTime() : 0;

  return (
    <>
      <Card
        className={
          activeShift
            ? "border-primary/40 bg-primary/5"
            : "border-border"
        }
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {activeShift ? (
                <>
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-primary">On the clock</p>
                    <p className="text-[11px] text-muted-foreground">
                      Started at {format(new Date(activeShift.clock_in_at), "h:mm a")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-bold">Off the clock</p>
                    <p className="text-[11px] text-muted-foreground">
                      Clock in to start your shift
                    </p>
                  </div>
                </>
              )}
            </div>

            {activeShift && (
              <Badge variant="outline" className="font-mono tabular-nums text-sm">
                {formatStopwatch(elapsed)}
              </Badge>
            )}
          </div>

          {activeShift ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={clockOut}
              disabled={working}
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Clock Out
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleClockInClick}
              disabled={working}
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Clock In
            </Button>
          )}

          {activeShift && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Location is being recorded every 5 minutes while on the clock.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Location Tracking Consent
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2 text-left">
              <span className="block">
                To clock in, AV Detailing needs your consent to record your GPS
                location while you are on the clock.
              </span>
              <span className="block font-medium text-foreground">What we record:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your location when you clock in and out</li>
                <li>A GPS ping approximately every 5 minutes while clocked in</li>
              </ul>
              <span className="block font-medium text-foreground pt-2">Why:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Verify on-site arrival and time worked</li>
                <li>Route planning and dispatch</li>
                <li>Payroll and timesheet accuracy</li>
              </ul>
              <span className="block text-xs pt-2">
                Tracking stops the moment you clock out. Only owners and admins can
                see your location data. You can revoke this consent any time from
                your Profile.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 py-2">
            <Checkbox
              id="loc-consent"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(Boolean(v))}
            />
            <label
              htmlFor="loc-consent"
              className="text-sm leading-tight cursor-pointer"
            >
              I consent to having my GPS location recorded while I am clocked in.
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConsentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConsent} disabled={!agreed}>
              Agree & Clock In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
