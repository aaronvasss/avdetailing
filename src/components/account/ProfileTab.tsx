import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Calendar, Mail, Bell, Smartphone, Info, Copy, RefreshCw, Link2, Shield } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
    calendar_token: "",
  });
  const [generatingToken, setGeneratingToken] = useState(false);

  // Notification preferences (stored in localStorage for now)
  const [notifications, setNotifications] = useState({
    email_reminders: true,
    sms_reminders: true,
    marketing_emails: false,
  });

  useEffect(() => {
    fetchProfile();
    checkAdminRole();
    loadNotificationPreferences();
  }, [userId]);

  const checkAdminRole = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "staff"])
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

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
        calendar_token: (data as any).calendar_token || "",
      });
    }
    setLoading(false);
  };

  const generateCalendarToken = async () => {
    setGeneratingToken(true);
    try {
      // Generate a new token
      const newToken = crypto.randomUUID() + crypto.randomUUID();
      
      const { error } = await supabase
        .from("profiles")
        .update({ calendar_token: newToken } as any)
        .eq("user_id", userId);

      if (error) throw error;

      setProfile({ ...profile, calendar_token: newToken });
      toast.success("New calendar subscription URL generated");
    } catch (error) {
      console.error("Error generating token:", error);
      toast.error("Failed to generate new URL");
    } finally {
      setGeneratingToken(false);
    }
  };

  const getCalendarSubscriptionUrl = () => {
    if (!profile.calendar_token) return "";
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${baseUrl}/functions/v1/calendar-feed?user_id=${userId}&token=${profile.calendar_token}`;
  };

  const copySubscriptionUrl = () => {
    const url = getCalendarSubscriptionUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Calendar URL copied to clipboard");
    }
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
      {/* Admin Dashboard Link */}
      {isAdmin && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              Admin Access
            </CardTitle>
            <CardDescription>
              You have admin privileges for this account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Open Admin Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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

          {/* ICS Subscription Feed */}
          <div className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary">
                  <Link2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Calendar Subscription</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Live Sync
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Subscribe once, appointments sync automatically
                  </p>
                </div>
              </div>
            </div>
            
            {profile.calendar_token ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={getCalendarSubscriptionUrl()}
                    className="bg-background text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copySubscriptionUrl}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Paste this URL in Apple Calendar → File → New Calendar Subscription
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateCalendarToken}
                    disabled={generatingToken}
                    className="text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${generatingToken ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={generateCalendarToken}
                disabled={generatingToken}
                variant="outline"
                className="w-full"
              >
                {generatingToken ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate Subscription URL
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Apple Calendar / ICS Manual */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Manual Download</p>
                <p className="text-sm text-muted-foreground">
                  Download .ics files from the Appointments tab
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Download individual .ics files from each appointment card.
                  Works with Apple Calendar, Outlook, and other calendar apps.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
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
