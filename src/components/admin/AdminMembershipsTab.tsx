import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  CreditCard, 
  Calendar, 
  Pause, 
  Play, 
  X, 
  ExternalLink,
  Loader2,
  Users,
  DollarSign,
  Gift,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Membership {
  id: string;
  status: string;
  next_service_date: string | null;
  current_period_end: string | null;
  current_period_start: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  user_id: string;
  created_at: string;
  membership_plans: {
    id: string;
    name: string;
    frequency: string;
    price: number;
    stripe_price_id: string | null;
  } | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  customer_vehicles: {
    make: string | null;
    model: string | null;
    year: number | null;
  } | null;
}

interface MembershipPlan {
  id: string;
  name: string;
  frequency: string;
  price: number;
  stripe_price_id: string | null;
  features: string[] | null;
  is_active: boolean | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  past_due: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export function AdminMembershipsTab() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'cancel' | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch memberships with related data
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('customer_memberships')
        .select(`
          *,
          membership_plans(id, name, frequency, price, stripe_price_id),
          customer_vehicles(make, model, year)
        `)
        .order('created_at', { ascending: false });

      if (membershipsError) throw membershipsError;

      // Fetch profiles separately to get user info
      const userIds = [...new Set(membershipsData?.map(m => m.user_id) || [])];
      
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .in('user_id', userIds);
        
        profilesData?.forEach(p => {
          profilesMap[p.user_id] = p;
        });
      }

      // Merge profiles into memberships
      const enrichedMemberships = membershipsData?.map(m => ({
        ...m,
        profiles: profilesMap[m.user_id] || null
      })) || [];

      setMemberships(enrichedMemberships);

      // Fetch plans
      const { data: plansData } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast.error("Failed to load memberships");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async () => {
    if (!selectedMembership || !actionType) return;
    
    setProcessing(true);
    try {
      let newStatus = selectedMembership.status;
      
      switch (actionType) {
        case 'pause':
          newStatus = 'paused';
          break;
        case 'resume':
          newStatus = 'active';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
      }

      const { error } = await supabase
        .from('customer_memberships')
        .update({ status: newStatus })
        .eq('id', selectedMembership.id);

      if (error) throw error;

      toast.success(`Membership ${actionType}d successfully`);
      setActionDialogOpen(false);
      setSelectedMembership(null);
      setActionType(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating membership:', error);
      toast.error(`Failed to ${actionType} membership`);
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (membership: Membership, action: 'pause' | 'resume' | 'cancel') => {
    setSelectedMembership(membership);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = !search.trim() || 
      m.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.profiles?.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    active: memberships.filter(m => m.status === 'active').length,
    paused: memberships.filter(m => m.status === 'paused').length,
    cancelled: memberships.filter(m => m.status === 'cancelled').length,
    mrr: memberships
      .filter(m => m.status === 'active')
      .reduce((sum, m) => sum + (m.membership_plans?.price || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Active
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Pause className="h-4 w-4" />
              Paused
            </div>
            <div className="text-2xl font-bold text-yellow-500">{stats.paused}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <X className="h-4 w-4" />
              Cancelled
            </div>
            <div className="text-2xl font-bold text-red-500">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Monthly Revenue
            </div>
            <div className="text-2xl font-bold text-primary">${stats.mrr.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Membership Pricing (Source of Truth)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <span className="font-medium">{plan.name}</span>
                <Badge variant="outline">${plan.price}/{plan.frequency}</Badge>
                {plan.stripe_price_id && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {plan.stripe_price_id.slice(0, 15)}...
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Memberships List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Memberships</CardTitle>
              <CardDescription>{memberships.length} total subscriptions</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMemberships.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No memberships found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Renewal</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMemberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div className="font-medium">{membership.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{membership.profiles?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{membership.membership_plans?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${membership.membership_plans?.price}/{membership.membership_plans?.frequency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[membership.status] || statusColors.cancelled}>
                          {membership.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {membership.current_period_end ? (
                          format(new Date(membership.current_period_end), 'MMM d, yyyy')
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {membership.next_service_date ? (
                          format(new Date(membership.next_service_date), 'MMM d, yyyy')
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {membership.customer_vehicles ? (
                          <span className="text-sm">
                            {membership.customer_vehicles.year} {membership.customer_vehicles.make}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {membership.status === 'active' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openActionDialog(membership, 'pause')}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {membership.status === 'paused' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openActionDialog(membership, 'resume')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {membership.status !== 'cancelled' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openActionDialog(membership, 'cancel')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {membership.stripe_subscription_id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(`https://dashboard.stripe.com/subscriptions/${membership.stripe_subscription_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionType} Membership</DialogTitle>
            <DialogDescription>
              {actionType === 'pause' && "This will pause the membership. The member won't be charged until resumed."}
              {actionType === 'resume' && "This will resume the membership and billing will continue."}
              {actionType === 'cancel' && "This will cancel the membership. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          {selectedMembership && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member</span>
                <span className="font-medium">{selectedMembership.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span>{selectedMembership.membership_plans?.name}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={processing}
              variant={actionType === 'cancel' ? 'destructive' : 'default'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm {actionType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}