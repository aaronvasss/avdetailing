import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Car, Trash2, Star } from "lucide-react";

interface VehiclesTabProps {
  userId: string;
}

interface Vehicle {
  id: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  license_plate: string | null;
  size_category: string | null;
  is_default: boolean;
}

export function VehiclesTab({ userId }: VehiclesTabProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_type: "car",
    make: "",
    model: "",
    year: "",
    color: "",
    license_plate: "",
    size_category: "medium",
  });

  useEffect(() => {
    fetchVehicles();
  }, [userId]);

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from("customer_vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });

    if (data) {
      setVehicles(data);
    }
    setLoading(false);
  };

  const handleAddVehicle = async () => {
    const { error } = await supabase.from("customer_vehicles").insert({
      user_id: userId,
      vehicle_type: newVehicle.vehicle_type,
      make: newVehicle.make || null,
      model: newVehicle.model || null,
      year: newVehicle.year ? parseInt(newVehicle.year) : null,
      color: newVehicle.color || null,
      license_plate: newVehicle.license_plate || null,
      size_category: newVehicle.size_category || null,
      is_default: vehicles.length === 0,
    });

    if (error) {
      toast.error("Failed to add vehicle");
    } else {
      toast.success("Vehicle added successfully");
      setDialogOpen(false);
      setNewVehicle({
        vehicle_type: "car",
        make: "",
        model: "",
        year: "",
        color: "",
        license_plate: "",
        size_category: "medium",
      });
      fetchVehicles();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("customer_vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete vehicle");
    } else {
      toast.success("Vehicle deleted");
      fetchVehicles();
    }
  };

  const handleSetDefault = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from("customer_vehicles")
      .update({ is_default: false })
      .eq("user_id", userId);

    // Then set the new default
    const { error } = await supabase
      .from("customer_vehicles")
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      toast.error("Failed to set default");
    } else {
      toast.success("Default vehicle updated");
      fetchVehicles();
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading vehicles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Vehicles</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select
                  value={newVehicle.vehicle_type}
                  onValueChange={(value) =>
                    setNewVehicle({ ...newVehicle, vehicle_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="boat">Boat</SelectItem>
                    <SelectItem value="rv">RV</SelectItem>
                    <SelectItem value="aircraft">Aircraft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input
                    value={newVehicle.make}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, make: e.target.value })
                    }
                    placeholder="Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={newVehicle.model}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, model: e.target.value })
                    }
                    placeholder="Camry"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    value={newVehicle.year}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, year: e.target.value })
                    }
                    placeholder="2024"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    value={newVehicle.color}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, color: e.target.value })
                    }
                    placeholder="Black"
                  />
                </div>
              </div>
              <Button onClick={handleAddVehicle} className="w-full">
                Add Vehicle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No vehicles added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your vehicles for faster booking
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className={vehicle.is_default ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {vehicle.make} {vehicle.model}
                      {vehicle.is_default && (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {vehicle.year} • {vehicle.vehicle_type.toUpperCase()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {vehicle.color && <span>{vehicle.color}</span>}
                  {vehicle.license_plate && (
                    <span className="ml-2">• {vehicle.license_plate}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!vehicle.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(vehicle.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(vehicle.id)}
                  >
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
