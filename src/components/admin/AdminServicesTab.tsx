import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Pencil, 
  Trash2, 
  Loader2, 
  Plus, 
  DollarSign,
  Clock,
  Check,
  X,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean | null;
  vehicle_types: string[] | null;
  sort_order: number | null;
}

interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  description: string | null;
  is_active: boolean | null;
  service_id: string | null;
}

export function AdminServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<ServiceAddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: 0,
    duration_minutes: 60,
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const [servicesRes, addOnsRes] = await Promise.all([
        supabase.from("services").select("*").order("sort_order", { ascending: true }),
        supabase.from("service_add_ons").select("*").order("name"),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (addOnsRes.error) throw addOnsRes.error;

      setServices(servicesRes.data || []);
      setAddOns(addOnsRes.data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      base_price: service.base_price,
      duration_minutes: service.duration_minutes,
      is_active: service.is_active ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!editingService) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("services")
        .update({
          name: formData.name,
          description: formData.description || null,
          base_price: formData.base_price,
          duration_minutes: formData.duration_minutes,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingService.id);

      if (error) throw error;

      toast.success("Service updated successfully");
      setEditDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  const toggleServiceActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: !service.is_active })
        .eq("id", service.id);

      if (error) throw error;

      toast.success(`Service ${service.is_active ? "disabled" : "enabled"}`);
      fetchServices();
    } catch (error) {
      console.error("Error toggling service:", error);
      toast.error("Failed to update service");
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    setSaving(true);
    try {
      // Soft delete by marking as inactive and adding DELETED prefix
      const { error } = await supabase
        .from("services")
        .update({ 
          is_active: false,
          name: `[DELETED] ${serviceToDelete.name}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceToDelete.id);

      if (error) throw error;

      toast.success("Service removed");
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    } finally {
      setSaving(false);
    }
  };

  const toggleAddOnActive = async (addOn: ServiceAddOn) => {
    try {
      const { error } = await supabase
        .from("service_add_ons")
        .update({ is_active: !addOn.is_active })
        .eq("id", addOn.id);

      if (error) throw error;

      toast.success(`Add-on ${addOn.is_active ? "disabled" : "enabled"}`);
      fetchServices();
    } catch (error) {
      console.error("Error toggling add-on:", error);
      toast.error("Failed to update add-on");
    }
  };

  const activeServices = services.filter(s => !s.name.startsWith("[DELETED]"));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Service & Pricing Control</h2>
          <p className="text-sm text-muted-foreground">
            Manage services, pricing, durations, and availability
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchServices}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Edit prices, durations, and enable/disable services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Base Price</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeServices.map((service) => (
                  <TableRow key={service.id} className={!service.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">${service.base_price}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">{service.duration_minutes} min</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={service.is_active ?? true}
                        onCheckedChange={() => toggleServiceActive(service)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setServiceToDelete(service);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add-Ons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Add-Ons</CardTitle>
          <CardDescription>Manage optional service add-ons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Add-On</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addOns.map((addOn) => (
                  <TableRow key={addOn.id} className={!addOn.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{addOn.name}</p>
                        {addOn.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {addOn.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">+${addOn.price}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">
                        {addOn.duration_minutes ? `+${addOn.duration_minutes} min` : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={addOn.is_active ?? true}
                        onCheckedChange={() => toggleAddOnActive(addOn)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service details, pricing, and duration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Base Price
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Duration (min)
                </Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Service Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveService} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{serviceToDelete?.name}"? This will disable the service and hide it from customers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteService} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Remove Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
