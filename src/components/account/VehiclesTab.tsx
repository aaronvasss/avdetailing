import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Car, Trash2, Star, Pencil, History, Camera } from "lucide-react";
import { compressImage } from "@/lib/image-compress";
import { format } from "date-fns";
import { Link } from 'react-router-dom';

interface VehiclesTabProps {
  userId: string;
}

interface Vehicle {
  id: string;
  vehicle_type: string;
  nickname: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  license_plate: string | null;
  notes: string | null;
  service_address: string | null;
  photo_path: string | null;
  is_default: boolean | null;
}

type Form = {
  vehicle_type: string; nickname: string; make: string; model: string; year: string;
  color: string; license_plate: string; notes: string; service_address: string;
};

const EMPTY: Form = { vehicle_type: "car", nickname: "", make: "", model: "", year: "", color: "", license_plate: "", notes: "", service_address: "" };

const TYPES = [
  ["car", "Car"], ["suv", "SUV"], ["truck", "Truck"], ["boat", "Boat"], ["rv", "RV"], ["aircraft", "Aircraft"],
];

export function VehiclesTab({ userId }: VehiclesTabProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [historyFor, setHistoryFor] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { fetchVehicles(); }, [userId]);

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from("customer_vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    const list = (data ?? []) as Vehicle[];
    setVehicles(list);
    setLoading(false);
    const paths = list.flatMap(v=>v.photo_path?[v.photo_path]:[]);
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("vehicle-photos").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      signed?.forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      setPhotoUrls(map);
    }
  };

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setPhoto(null); setDialogOpen(true); };
  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      vehicle_type: v.vehicle_type, nickname: v.nickname ?? "", make: v.make ?? "", model: v.model ?? "",
      year: v.year ? String(v.year) : "", color: v.color ?? "", license_plate: v.license_plate ?? "",
      notes: v.notes ?? "", service_address: v.service_address ?? "",
    });
    setPhoto(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (form.year && !/^\d{4}$/.test(form.year)) { toast.error("Year must be 4 digits"); return; }
    setSaving(true);
    let photo_path: string | undefined;
    if (photo) {
      const file = await compressImage(photo);
      if(!file.type.startsWith('image/')||file.size>1024*1024){toast.error('Choose an image smaller than 1 MB');setSaving(false);return;}
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage.from("vehicle-photos").upload(path, file, { contentType: file.type || "image/jpeg" });
      if (upErr) { toast.error("Photo upload failed"); setSaving(false); return; }
      photo_path = path;
    }
    const payload = {
      vehicle_type: form.vehicle_type,
      nickname: form.nickname.trim() || null,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: form.year ? parseInt(form.year) : null,
      color: form.color.trim() || null,
      license_plate: form.license_plate.trim() || null,
      notes: form.notes.trim() || null,
      service_address: form.service_address.trim() || null,
      ...(photo_path ? { photo_path } : {}),
    };
    const { error } = editingId
      ? await supabase.from("customer_vehicles").update(payload).eq("id", editingId)
      : await supabase.from("customer_vehicles").insert({ ...payload, user_id: userId, is_default: vehicles.length === 0 });
    setSaving(false);
    if (error) { toast.error("Could not save vehicle"); return; }
    toast.success(editingId ? "Vehicle updated" : "Vehicle added");
    setDialogOpen(false);
    fetchVehicles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this vehicle?")) return;
    const { error } = await supabase.from("customer_vehicles").delete().eq("id", id);
    if (error) toast.error("Failed to remove vehicle");
    else { toast.success("Vehicle removed"); fetchVehicles(); }
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from("customer_vehicles").update({ is_default: false }).eq("user_id", userId);
    const { error } = await supabase.from("customer_vehicles").update({ is_default: true }).eq("id", id);
    if (error) toast.error("Failed to set default");
    else { toast.success("Default vehicle updated"); fetchVehicles(); }
  };

  const openHistory = async (v: Vehicle) => {
    setHistoryFor(v);
    setHistory([]);
    const { data } = await supabase
      .from("bookings")
      .select("id, scheduled_date, status, total_price, vehicle_id, vehicle_make, vehicle_model, vehicle_year, services(name)")
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: false });
    const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
    setHistory((data ?? []).filter((b: any) =>
      b.vehicle_id === v.id ||
      (!b.vehicle_id && v.make && v.model && norm(b.vehicle_make) === norm(v.make) && norm(b.vehicle_model) === norm(v.model)),
    ));
  };

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  if (loading) return <div className="animate-pulse">Loading vehicles...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Vehicles</h2>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Vehicle</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nickname</Label><Input value={form.nickname} onChange={set("nickname")} placeholder="Daily driver" maxLength={60} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Year</Label><Input value={form.year} onChange={set("year")} placeholder="2024" inputMode="numeric" maxLength={4} /></div>
              <div className="space-y-2"><Label>Make</Label><Input value={form.make} onChange={set("make")} placeholder="Toyota" maxLength={60} /></div>
              <div className="space-y-2"><Label>Model</Label><Input value={form.model} onChange={set("model")} placeholder="Camry" maxLength={60} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Color</Label><Input value={form.color} onChange={set("color")} placeholder="Black" maxLength={40} /></div>
              <div className="space-y-2"><Label>License Plate / Tail #</Label><Input value={form.license_plate} onChange={set("license_plate")} maxLength={20} /></div>
            </div>
            <div className="space-y-2"><Label>Usual Service Address</Label><Input value={form.service_address} onChange={set("service_address")} placeholder="123 Main St, Baton Rouge" maxLength={200} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={set("notes")} placeholder="Pet hair, existing scratches, etc." maxLength={1000} /></div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving…" : editingId ? "Save Changes" : "Add Vehicle"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyFor} onOpenChange={(o) => !o && setHistoryFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Service History: {historyFor?.nickname || `${historyFor?.make ?? ""} ${historyFor?.model ?? ""}`}</DialogTitle></DialogHeader>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services recorded for this vehicle yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((b) => (
                <li key={b.id} className="py-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span>{format(new Date(b.scheduled_date + "T12:00:00"), "MMM d, yyyy")} · {b.services?.name ?? "Service"}</span>
                  <span className="text-muted-foreground capitalize">{b.status}{b.total_price != null ? ` · $${Number(b.total_price).toFixed(2)}` : ""}</span>
                  <Button asChild variant="outline" size="sm"><Link to={`/book?repeat=${b.id}`}>Book Again</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No vehicles added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your cars, trucks, boats, RVs or aircraft for faster booking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} className={`overflow-hidden ${v.is_default ? "border-primary" : ""}`}>
              {v.photo_path && photoUrls[v.photo_path] ? (
                <img src={photoUrls[v.photo_path]} alt={v.nickname || `${v.make} ${v.model}`} className="h-36 w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-20 bg-muted/40 flex items-center justify-center"><Camera className="h-6 w-6 text-muted-foreground" /></div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {v.nickname || `${v.make ?? ""} ${v.model ?? ""}`.trim() || "Vehicle"}
                  {v.is_default && <Star className="h-4 w-4 fill-primary text-primary" />}
                </CardTitle>
                <CardDescription>
                  {[v.year, v.make, v.model].filter(Boolean).join(" ")} · {v.vehicle_type.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                  {(v.color || v.license_plate) && <p>{[v.color, v.license_plate].filter(Boolean).join(" · ")}</p>}
                  {v.service_address && <p>📍 {v.service_address}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openHistory(v)}><History className="h-4 w-4 mr-1" />History</Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(v)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
                  {!v.is_default && <Button variant="outline" size="sm" onClick={() => handleSetDefault(v.id)}>Set Default</Button>}
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(v.id)} aria-label="Remove vehicle">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
