import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, Star } from "lucide-react";

interface AddressesTabProps {
  userId: string;
}

interface Address {
  id: string;
  label: string | null;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string | null;
  is_default: boolean;
}

export function AddressesTab({ userId }: AddressesTabProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    street_address: "",
    city: "",
    state: "LA",
    zip_code: "",
    notes: "",
  });

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });

    if (data) {
      setAddresses(data);
    }
    setLoading(false);
  };

  const handleAddAddress = async () => {
    const { error } = await supabase.from("customer_addresses").insert({
      user_id: userId,
      label: newAddress.label || null,
      street_address: newAddress.street_address,
      city: newAddress.city,
      state: newAddress.state,
      zip_code: newAddress.zip_code,
      notes: newAddress.notes || null,
      is_default: addresses.length === 0,
    });

    if (error) {
      toast.error("Failed to add address");
    } else {
      toast.success("Address added successfully");
      setDialogOpen(false);
      setNewAddress({
        label: "",
        street_address: "",
        city: "",
        state: "LA",
        zip_code: "",
        notes: "",
      });
      fetchAddresses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete address");
    } else {
      toast.success("Address deleted");
      fetchAddresses();
    }
  };

  const handleSetDefault = async (id: string) => {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("user_id", userId);

    const { error } = await supabase
      .from("customer_addresses")
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      toast.error("Failed to set default");
    } else {
      toast.success("Default address updated");
      fetchAddresses();
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading addresses...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Addresses</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  value={newAddress.label}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, label: e.target.value })
                  }
                  placeholder="Home, Work, Marina, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input
                  value={newAddress.street_address}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, street_address: e.target.value })
                  }
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={newAddress.city}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                    placeholder="Baton Rouge"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={newAddress.zip_code}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, zip_code: e.target.value })
                    }
                    placeholder="70801"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={newAddress.notes}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, notes: e.target.value })
                  }
                  placeholder="Gate code, parking instructions, etc."
                  rows={2}
                />
              </div>
              <Button 
                onClick={handleAddAddress} 
                className="w-full"
                disabled={!newAddress.street_address || !newAddress.city || !newAddress.zip_code}
              >
                Add Address
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No addresses added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add service addresses for faster booking
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {address.label || "Address"}
                  {address.is_default && (
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {address.street_address}
                  <br />
                  {address.city}, {address.state} {address.zip_code}
                </p>
                {address.notes && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {address.notes}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  {!address.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(address.id)}
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
