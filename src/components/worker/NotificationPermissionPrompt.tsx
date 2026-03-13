import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      const dismissed = sessionStorage.getItem("notif-prompt-dismissed");
      if (!dismissed) setShow(true);
    }
  }, []);

  const handleAllow = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("AV Detailing", { body: "You'll now receive job notifications! 🚗" });
    }
    setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("notif-prompt-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <Bell className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Enable notifications</p>
          <p className="text-xs text-muted-foreground">Get alerted when new jobs are assigned</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={handleDismiss}>Later</Button>
          <Button size="sm" onClick={handleAllow}>Allow</Button>
        </div>
      </CardContent>
    </Card>
  );
}
