import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientVehicle {
  vehicle_type: string;
  year: string;
  make: string;
  model: string;
  color?: string;
}

const emptyVehicle = (): ClientVehicle => ({
  vehicle_type: "car",
  year: "",
  make: "",
  model: "",
  color: "",
});

const clientSchema = z.object({
  first_name: z.string().trim().max(100, "First name must be less than 100 characters").optional().or(z.literal("")),
  last_name: z.string().trim().max(100, "Last name must be less than 100 characters").optional().or(z.literal("")),
  full_name: z.string().trim().max(200, "Full name must be less than 200 characters").optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  address_line1: z.string().trim().max(255, "Address must be less than 255 characters").optional().or(z.literal("")),
  address_line2: z.string().trim().max(255, "Address must be less than 255 characters").optional().or(z.literal("")),
  city: z.string().trim().max(100, "City must be less than 100 characters").optional().or(z.literal("")),
  state: z.string().trim().max(50, "State must be less than 50 characters").optional().or(z.literal("")),
  zip: z.string().trim().max(20, "ZIP must be less than 20 characters").optional().or(z.literal("")),
  notes: z.string().trim().max(1000, "Notes must be less than 1000 characters").optional().or(z.literal("")),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  vehicles?: ClientVehicle[] | null;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess: () => void;
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<ClientVehicle[]>([]);
  const [vehicleErrors, setVehicleErrors] = useState<Record<number, { year?: string; make?: string; model?: string }>>({});
  const isEditing = !!client;

  const currentYear = new Date().getFullYear();
  const validateVehicles = (list: ClientVehicle[]) => {
    const errs: Record<number, { year?: string; make?: string; model?: string }> = {};
    list.forEach((v, idx) => {
      const hasAny = (v.year || v.make || v.model || v.color)?.toString().trim();
      if (!hasAny) return; // skip fully-empty rows (they'll be filtered out)
      const e: { year?: string; make?: string; model?: string } = {};
      const yearTrim = (v.year || '').trim();
      if (!yearTrim) e.year = "Year is required";
      else if (!/^\d{4}$/.test(yearTrim)) e.year = "Enter a 4-digit year";
      else {
        const y = parseInt(yearTrim, 10);
        if (y < 1900 || y > currentYear + 2) e.year = `Year must be 1900–${currentYear + 2}`;
      }
      if (!(v.make || '').trim()) e.make = "Make is required";
      if (!(v.model || '').trim()) e.model = "Model is required";
      if (Object.keys(e).length) errs[idx] = e;
    });
    return errs;
  };



  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      full_name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        first_name: client.first_name || "",
        last_name: client.last_name || "",
        full_name: client.full_name || "",
        email: client.email || "",
        phone: client.phone || "",
        address_line1: client.address_line1 || "",
        address_line2: client.address_line2 || "",
        city: client.city || "",
        state: client.state || "",
        zip: client.zip || "",
        notes: client.notes || "",
      });
      setVehicles(Array.isArray(client.vehicles) ? client.vehicles : []);
      setVehicleErrors({});
    } else {
      form.reset({
        first_name: "",
        last_name: "",
        full_name: "",
        email: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip: "",
        notes: "",
      });
      setVehicles([]);
      setVehicleErrors({});
    }
  }, [client, form]);

  const updateVehicle = (idx: number, patch: Partial<ClientVehicle>) => {
    setVehicles((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
    setVehicleErrors((prev) => {
      if (!prev[idx]) return prev;
      const next = { ...prev };
      const row = { ...next[idx] };
      Object.keys(patch).forEach((k) => {
        if (k === 'year' || k === 'make' || k === 'model') delete (row as any)[k];
      });
      if (Object.keys(row).length === 0) delete next[idx];
      else next[idx] = row;
      return next;
    });
  };
  const addVehicle = () => setVehicles((prev) => [...prev, emptyVehicle()]);
  const removeVehicle = (idx: number) => {
    setVehicles((prev) => prev.filter((_, i) => i !== idx));
    setVehicleErrors((prev) => {
      const next: typeof prev = {};
      Object.entries(prev).forEach(([k, v]) => {
        const n = Number(k);
        if (n < idx) next[n] = v;
        else if (n > idx) next[n - 1] = v;
      });
      return next;
    });
  };


  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return digits ? `+${digits}` : '';
  };

  const onSubmit = async (data: ClientFormData) => {
    // Validate vehicles before saving
    const vErrs = validateVehicles(vehicles);
    setVehicleErrors(vErrs);
    if (Object.keys(vErrs).length > 0) {
      const firstIdx = Number(Object.keys(vErrs)[0]);
      const firstErr = vErrs[firstIdx];
      const missing = Object.values(firstErr).filter(Boolean) as string[];
      toast.error(`Vehicle #${firstIdx + 1}: ${missing.join(", ")}`, {
        description: "Fix the highlighted vehicle fields and try again.",
      });
      return;
    }

    setSaving(true);
    try {
      // Build client data, filtering out empty strings
      const clientData: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value && value.trim()) {
          clientData[key] = key === 'phone' ? normalizePhone(value) : value.trim();
        } else {
          clientData[key] = null;
        }
      });

      // Generate full_name if not provided but first/last are
      if (!clientData.full_name && (clientData.first_name || clientData.last_name)) {
        clientData.full_name = [clientData.first_name, clientData.last_name].filter(Boolean).join(' ');
      }

      // Set source for new clients
      if (!isEditing) {
        clientData.source = 'manual';
      }

      // Clean & include vehicles (drop fully-empty rows)
      const cleanedVehicles = vehicles
        .map((v) => ({
          vehicle_type: (v.vehicle_type || 'car').trim(),
          year: (v.year || '').trim(),
          make: (v.make || '').trim(),
          model: (v.model || '').trim(),
          color: (v.color || '').trim(),
        }))
        .filter((v) => v.year || v.make || v.model);
      clientData.vehicles = cleanedVehicles;

      console.log('[ClientFormDialog] Saving client payload:', clientData);

      if (isEditing && client) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id);

        if (error) throw error;
        toast.success("Client updated successfully");
      } else {
        const { error } = await supabase
          .from('clients')
          .insert(clientData);

        if (error) throw error;
        toast.success("Client added successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving client:', error);
      const code = error?.code ? ` (code ${error.code})` : '';
      const detail = error?.details || error?.hint || '';
      const msg = error?.message || "Failed to save client";
      // Friendlier messages for common Postgres errors
      let friendly = msg;
      if (error?.code === '23505') friendly = "A client with this email or phone already exists.";
      else if (error?.code === '23502') friendly = "A required field is missing.";
      else if (error?.code === '23514') friendly = "One of the fields has an invalid value.";
      else if (error?.code === '42501' || /permission/i.test(msg)) friendly = "You don't have permission to save this client.";
      toast.error(`Failed to save client${code}`, {
        description: detail ? `${friendly} — ${detail}` : friendly,
      });
    } finally {

      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the client's information below." : "Enter the new client's information below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (or Business)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe or Company Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(225) 555-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">* At least one contact method is required</p>

            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Baton Rouge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="LA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input placeholder="70801" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vehicles */}
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Car className="h-4 w-4" />
                  Vehicles ({vehicles.length})
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVehicle}>
                  <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                </Button>
              </div>
              {vehicles.length === 0 && (
                <p className="text-xs text-muted-foreground">No vehicles yet. Click "Add Vehicle" to add one.</p>
              )}
              {vehicles.map((v, idx) => (
                <div key={idx} className="space-y-2 rounded border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Vehicle #{idx + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeVehicle(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Type</label>
                      <Select value={v.vehicle_type} onValueChange={(val) => updateVehicle(idx, { vehicle_type: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="car">Car / Sedan</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="suv_large">SUV (Large)</SelectItem>
                          <SelectItem value="truck">Truck</SelectItem>
                          <SelectItem value="boat">Boat</SelectItem>
                          <SelectItem value="rv">RV</SelectItem>
                          <SelectItem value="aircraft">Aircraft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Year</label>
                      <Input
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="2024"
                        value={v.year}
                        onChange={(e) => updateVehicle(idx, { year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Make</label>
                      <Input placeholder="Toyota" value={v.make} onChange={(e) => updateVehicle(idx, { make: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Model</label>
                      <Input placeholder="Camry" value={v.model} onChange={(e) => updateVehicle(idx, { model: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Color (optional)</label>
                    <Input placeholder="Black" value={v.color || ''} onChange={(e) => updateVehicle(idx, { color: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>


            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about this client..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
