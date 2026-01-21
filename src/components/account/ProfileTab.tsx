import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Calendar, Mail, Bell, Smartphone, ExternalLink, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileTabProps {
  userId: string;
}

export function ProfileTab({ userId }: ProfileTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
  });

  // Notification preferences (stored in localStorage for now)
  const [notifications, setNotifications] = useState({
    email_reminders: true,
    sms_reminders: true,
    marketing_emails: false,
  });

  useEffect(() => {
    fetchProfile();
    loadNotificationPreferences();
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        email: data.email || "",
      });
    }
    setLoading(false);
  };

  const loadNotificationPreferences = () => {
    const saved = localStorage.getItem(`notifications_${userId}`);
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq("user_id", userId);

    // Save notification preferences
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
    setSaving(false);
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/3 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="(225) 555-1234"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose how you'd like to be notified about your appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Email Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Receive appointment reminders via email
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.email_reminders}
              onCheckedChange={(checked) =>
                handleNotificationChange("email_reminders", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">SMS Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get text message reminders before appointments
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.sms_reminders}
              onCheckedChange={(checked) =>
                handleNotificationChange("sms_reminders", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Marketing & Promotions</p>
                <p className="text-sm text-muted-foreground">
                  Special offers and seasonal deals
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.marketing_emails}
              onCheckedChange={(checked) =>
                handleNotificationChange("marketing_emails", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Calendar Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync your appointments with your favorite calendar app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Google Calendar</p>
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Auto-sync appointments to Google Calendar
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" disabled>
                  Connect
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Google Calendar sync coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Apple Calendar / ICS */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Apple Calendar / iCal</p>
                <p className="text-sm text-muted-foreground">
                  Use "Add to Calendar" on each appointment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                Available
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Download .ics files for individual appointments from the
                    Appointments tab. Works with Apple Calendar, Outlook, and
                    other calendar apps.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Calendar files (.ics) can be imported into most calendar applications
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
