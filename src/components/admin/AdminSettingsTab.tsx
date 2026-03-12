import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Phone, Mail, Settings2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CsvImportSection } from "./CsvImportSection";
import { DangerZoneSection } from "./DangerZoneSection";
import { WorkerManagementSection } from "./WorkerManagementSection";

interface BusinessSetting {
  key: string;
  value: string;
  description: string | null;
}

const SETTING_LABELS: Record<string, { label: string; icon: React.ReactNode; type: "text" | "tel" | "email" | "textarea" }> = {
  public_business_phone: { label: "Public Business Phone (Display)", icon: <Phone className="h-4 w-4" />, type: "tel" },
  public_business_phone_e164: { label: "Public Business Phone (E.164 Format)", icon: <Phone className="h-4 w-4" />, type: "tel" },
  sms_sender_phone: { label: "SMS Sender Phone (Twilio)", icon: <Phone className="h-4 w-4" />, type: "tel" },
  business_email: { label: "Business Email", icon: <Mail className="h-4 w-4" />, type: "email" },
  support_email: { label: "Support Email", icon: <Mail className="h-4 w-4" />, type: "email" },
};

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<BusinessSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [newSettingDescription, setNewSettingDescription] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .order("key");

      if (error) throw error;

      setSettings(data || []);
      const values: Record<string, string> = {};
      data?.forEach((s) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_settings")
        .update({ value: editedValues[key], updated_at: new Date().toISOString() })
        .eq("key", key);

      if (error) throw error;

      toast.success(`Updated ${SETTING_LABELS[key]?.label || key}`);
      fetchSettings();
    } catch (err) {
      console.error("Error saving setting:", err);
      toast.error("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async () => {
    if (!newSettingKey.trim() || !newSettingValue.trim()) {
      toast.error("Key and value are required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_settings")
        .insert({
          key: newSettingKey.trim().toLowerCase().replace(/\s+/g, "_"),
          value: newSettingValue.trim(),
          description: newSettingDescription.trim() || null,
        });

      if (error) throw error;

      toast.success("Setting added successfully");
      setNewSettingKey("");
      setNewSettingValue("");
      setNewSettingDescription("");
      fetchSettings();
    } catch (err: any) {
      console.error("Error adding setting:", err);
      if (err.code === "23505") {
        toast.error("A setting with this key already exists");
      } else {
        toast.error("Failed to add setting");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) return;

    try {
      const { error } = await supabase
        .from("business_settings")
        .delete()
        .eq("key", key);

      if (error) throw error;

      toast.success("Setting deleted");
      fetchSettings();
    } catch (err) {
      console.error("Error deleting setting:", err);
      toast.error("Failed to delete setting");
    }
  };

  const hasChanges = (key: string) => {
    const original = settings.find((s) => s.key === key);
    return original && original.value !== editedValues[key];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const phoneSettings = settings.filter((s) => s.key.includes("phone"));
  const emailSettings = settings.filter((s) => s.key.includes("email"));
  const otherSettings = settings.filter(
    (s) => !s.key.includes("phone") && !s.key.includes("email")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Settings</h1>
        <p className="text-muted-foreground">
          Manage phone numbers, email addresses, and other business configuration
        </p>
      </div>

      {/* Phone Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Numbers
          </CardTitle>
          <CardDescription>
            Configure public business phone and SMS sender numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phoneSettings.map((setting) => (
            <SettingRow
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ""}
              onChange={(v) => handleValueChange(setting.key, v)}
              onSave={() => handleSave(setting.key)}
              onDelete={() => handleDelete(setting.key)}
              hasChanges={hasChanges(setting.key)}
              saving={saving}
            />
          ))}
          {phoneSettings.length === 0 && (
            <p className="text-sm text-muted-foreground">No phone settings configured</p>
          )}
        </CardContent>
      </Card>

      {/* Email Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Addresses
          </CardTitle>
          <CardDescription>
            Configure business and support email addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSettings.map((setting) => (
            <SettingRow
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ""}
              onChange={(v) => handleValueChange(setting.key, v)}
              onSave={() => handleSave(setting.key)}
              onDelete={() => handleDelete(setting.key)}
              hasChanges={hasChanges(setting.key)}
              saving={saving}
            />
          ))}
          {emailSettings.length === 0 && (
            <p className="text-sm text-muted-foreground">No email settings configured</p>
          )}
        </CardContent>
      </Card>

      {/* Other Settings */}
      {otherSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Other Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherSettings.map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                value={editedValues[setting.key] || ""}
                onChange={(v) => handleValueChange(setting.key, v)}
                onSave={() => handleSave(setting.key)}
                onDelete={() => handleDelete(setting.key)}
                hasChanges={hasChanges(setting.key)}
                saving={saving}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add New Setting */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Setting</CardTitle>
          <CardDescription>
            Create a new business configuration value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-key">Setting Key</Label>
              <Input
                id="new-key"
                placeholder="e.g., business_email"
                value={newSettingKey}
                onChange={(e) => setNewSettingKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Value</Label>
              <Input
                id="new-value"
                placeholder="e.g., contact@example.com"
                value={newSettingValue}
                onChange={(e) => setNewSettingValue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-description">Description (optional)</Label>
            <Textarea
              id="new-description"
              placeholder="What is this setting used for?"
              value={newSettingDescription}
              onChange={(e) => setNewSettingDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={handleAddSetting} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Setting
          </Button>
        </CardContent>
      </Card>

      {/* CSV Import Section */}
      <Separator className="my-8" />
      <CsvImportSection />

      {/* Danger Zone */}
      <Separator className="my-8" />
      <DangerZoneSection />
    </div>
  );
}

interface SettingRowProps {
  setting: BusinessSetting;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  hasChanges: boolean;
  saving: boolean;
}

function SettingRow({
  setting,
  value,
  onChange,
  onSave,
  onDelete,
  hasChanges,
  saving,
}: SettingRowProps) {
  const config = SETTING_LABELS[setting.key];
  const label = config?.label || setting.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const icon = config?.icon || <Settings2 className="h-4 w-4" />;
  const inputType = config?.type || "text";

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </Label>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-1">Save</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      {setting.description && (
        <p className="text-xs text-muted-foreground">{setting.description}</p>
      )}
      <Input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Key: <code className="rounded bg-muted px-1">{setting.key}</code>
      </p>
    </div>
  );
}
