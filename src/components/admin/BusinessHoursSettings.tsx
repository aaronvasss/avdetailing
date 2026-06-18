import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, Save, Loader2 } from "lucide-react";

interface HoursConfig {
  business_hours_start: string;
  business_hours_end: string;
  buffer_minutes: string;
  default_duration: string;
  slot_interval: string;
}

const DEFAULTS: HoursConfig = {
  business_hours_start: "00:00",
  business_hours_end: "23:59",
  buffer_minutes: "15",
  default_duration: "135",
  slot_interval: "30",
};

export function BusinessHoursSettings() {
  const [config, setConfig] = useState<HoursConfig>(DEFAULTS);
  const [original, setOriginal] = useState<HoursConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from("business_settings")
        .select("key, value")
        .in("key", Object.keys(DEFAULTS));

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => {
          map[r.key] = r.value;
        });
        const merged = { ...DEFAULTS, ...map } as HoursConfig;
        setConfig(merged);
        setOriginal(merged);
      }
    } catch (err) {
      console.error("Error fetching business hours:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(config)) {
        await supabase
          .from("business_settings")
          .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );
      }
      toast.success("Business hours updated");
      setOriginal(config);
    } catch (err) {
      console.error("Error saving business hours:", err);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Business Hours & Scheduling
        </CardTitle>
        <CardDescription>
          Set your operating hours, buffer time, and scheduling defaults. Changes apply immediately to the booking calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hours-start">Opening Time</Label>
            <Input
              id="hours-start"
              type="time"
              value={config.business_hours_start}
              onChange={(e) => setConfig((c) => ({ ...c, business_hours_start: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours-end">Closing Time</Label>
            <Input
              id="hours-end"
              type="time"
              value={config.business_hours_end}
              onChange={(e) => setConfig((c) => ({ ...c, business_hours_end: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="buffer">Buffer Between Jobs (min)</Label>
            <Input
              id="buffer"
              type="number"
              min={0}
              max={120}
              value={config.buffer_minutes}
              onChange={(e) => setConfig((c) => ({ ...c, buffer_minutes: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Time between appointments</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Default Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={720}
              value={config.default_duration}
              onChange={(e) => setConfig((c) => ({ ...c, default_duration: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Fallback service duration</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interval">Slot Interval (min)</Label>
            <Input
              id="interval"
              type="number"
              min={15}
              max={120}
              step={15}
              value={config.slot_interval}
              onChange={(e) => setConfig((c) => ({ ...c, slot_interval: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Time between slot options</p>
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
