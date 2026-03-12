import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, UserPlus, Loader2, DollarSign, Save } from "lucide-react";

interface Worker {
  id: string;
  user_id: string;
  phone: string | null;
  pay_type: string;
  pay_rate: number;
  is_active: boolean;
  profile?: { full_name: string | null; email: string | null };
}

export function WorkerManagementSection() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWorker, setNewWorker] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    payType: "flat",
    payRate: "0",
  });
  const [editingPay, setEditingPay] = useState<Record<string, { type: string; rate: string }>>({});
  const [savingPay, setSavingPay] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    // Get all staff user_ids
    const { data: staffRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "staff");

    if (!staffRoles || staffRoles.length === 0) {
      setWorkers([]);
      setLoading(false);
      return;
    }

    const userIds = staffRoles.map((r) => r.user_id);

    // Get worker profiles
    const { data: workerProfiles } = await supabase
      .from("worker_profiles")
      .select("*")
      .in("user_id", userIds);

    // Get profiles for names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const merged: Worker[] = userIds.map((uid) => {
      const wp = workerProfiles?.find((w) => w.user_id === uid);
      const prof = profileMap.get(uid);
      return {
        id: wp?.id || uid,
        user_id: uid,
        phone: wp?.phone || null,
        pay_type: wp?.pay_type || "flat",
        pay_rate: wp?.pay_rate || 0,
        is_active: wp?.is_active ?? true,
        profile: prof ? { full_name: prof.full_name, email: prof.email } : undefined,
      };
    });

    setWorkers(merged);

    const payEdits: Record<string, { type: string; rate: string }> = {};
    merged.forEach((w) => {
      payEdits[w.user_id] = { type: w.pay_type, rate: String(w.pay_rate) };
    });
    setEditingPay(payEdits);

    setLoading(false);
  };

  const handleCreateWorker = async () => {
    if (!newWorker.email || !newWorker.password || !newWorker.fullName) {
      toast.error("Name, email, and password are required");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-worker", {
        body: {
          email: newWorker.email,
          password: newWorker.password,
          fullName: newWorker.fullName,
          phone: newWorker.phone,
          payType: newWorker.payType,
          payRate: parseFloat(newWorker.payRate) || 0,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Worker account created!");
      setCreateOpen(false);
      setNewWorker({ fullName: "", email: "", password: "", phone: "", payType: "flat", payRate: "0" });
      fetchWorkers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create worker");
    } finally {
      setCreating(false);
    }
  };

  const handleSavePayRate = async (userId: string) => {
    const edit = editingPay[userId];
    if (!edit) return;

    setSavingPay(userId);
    try {
      const { error } = await supabase
        .from("worker_profiles")
        .update({ pay_type: edit.type, pay_rate: parseFloat(edit.rate) || 0 })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Pay rate updated");
      fetchWorkers();
    } catch (err) {
      toast.error("Failed to update pay rate");
    } finally {
      setSavingPay(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workers
            </CardTitle>
            <CardDescription>Manage worker accounts and pay rates</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Worker Account</DialogTitle>
                <DialogDescription>This creates a new account with worker access to the portal at /worker</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={newWorker.fullName}
                    onChange={(e) => setNewWorker({ ...newWorker, fullName: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newWorker.email}
                    onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                    placeholder="john@avdetailing.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newWorker.password}
                    onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    placeholder="(225) 555-1234"
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pay Type</Label>
                    <Select
                      value={newWorker.payType}
                      onValueChange={(v) => setNewWorker({ ...newWorker, payType: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat per job</SelectItem>
                        <SelectItem value="percentage">% of job value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{newWorker.payType === "percentage" ? "Percentage" : "Amount ($)"}</Label>
                    <Input
                      type="number"
                      value={newWorker.payRate}
                      onChange={(e) => setNewWorker({ ...newWorker, payRate: e.target.value })}
                      min="0"
                      step={newWorker.payType === "percentage" ? "1" : "5"}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateWorker} disabled={creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Create Worker
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {workers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No workers added yet</p>
        ) : (
          workers.map((worker) => (
            <div key={worker.user_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{worker.profile?.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{worker.profile?.email}</p>
                  {worker.phone && <p className="text-sm text-muted-foreground">{worker.phone}</p>}
                </div>
                <Badge variant={worker.is_active ? "default" : "secondary"}>
                  {worker.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Pay Type
                    </Label>
                    <Select
                      value={editingPay[worker.user_id]?.type || "flat"}
                      onValueChange={(v) =>
                        setEditingPay((prev) => ({
                          ...prev,
                          [worker.user_id]: { ...prev[worker.user_id], type: v },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat per job</SelectItem>
                        <SelectItem value="percentage">% of value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {editingPay[worker.user_id]?.type === "percentage" ? "%" : "$"}
                    </Label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={editingPay[worker.user_id]?.rate || "0"}
                      onChange={(e) =>
                        setEditingPay((prev) => ({
                          ...prev,
                          [worker.user_id]: { ...prev[worker.user_id], rate: e.target.value },
                        }))
                      }
                      min="0"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSavePayRate(worker.user_id)}
                  disabled={savingPay === worker.user_id}
                >
                  {savingPay === worker.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
