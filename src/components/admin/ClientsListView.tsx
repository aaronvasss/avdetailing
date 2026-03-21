import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, Edit, Trash2, Loader2, Users, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientFormDialog } from "./ClientFormDialog";
import { ClientDetailView } from "./ClientDetailView";
import { format } from "date-fns";

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
  gate_code: string | null;
  preferences: string | null;
  paint_sensitivity: string | null;
  total_lifetime_spend: number | null;
  created_at: string;
}

interface EnrichedClient extends Client {
  totalBookings: number;
  totalSpent: number;
  lastServiceDate: string | null;
  membershipStatus: string | null;
}

const PAGE_SIZE = 25;

type SortField = "name" | "total_spent" | "last_service" | "date_added";
type FilterType = "all" | "has_membership" | "imported" | "no_bookings";

export function ClientsListView() {
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortField>("date_added");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Build base query for clients
      let countQuery = supabase.from("clients").select("*", { count: "exact", head: true });
      let dataQuery = supabase.from("clients").select("*");

      // Search filter
      if (search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        const searchFilter = `full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      // Source filter for "imported"
      if (filter === "imported") {
        countQuery = countQuery.in("source", ["wix", "csv_import"]);
        dataQuery = dataQuery.in("source", ["wix", "csv_import"]);
      }

      // Sort
      const sortMap: Record<SortField, { column: string; ascending: boolean }> = {
        name: { column: "full_name", ascending: true },
        total_spent: { column: "total_lifetime_spend", ascending: false },
        last_service: { column: "created_at", ascending: false }, // fallback, real sort done client-side
        date_added: { column: "created_at", ascending: false },
      };
      const sort = sortMap[sortBy];
      dataQuery = dataQuery.order(sort.column, { ascending: sort.ascending });

      // Get count
      const { count } = await countQuery;

      // Get paginated data — for filters needing enrichment, fetch more
      const needsEnrichmentFilter = filter === "has_membership" || filter === "no_bookings";
      if (!needsEnrichmentFilter) {
        dataQuery = dataQuery.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      }

      const { data, error } = await dataQuery;
      if (error) throw error;

      const rawClients: Client[] = data || [];

      // Step 2: Enrich with booking data via client_id (primary) and fallback to email/phone
      const clientIds = rawClients.map(c => c.id);
      const bookingsByClientId = new Map<string, { count: number; totalSpent: number; lastDate: string | null }>();

      if (clientIds.length > 0) {
        const { data: clientBookings } = await supabase
          .from("bookings")
          .select("client_id, total_price, payment_status, scheduled_date, status")
          .in("client_id", clientIds);

        (clientBookings || []).forEach((b) => {
          const key = b.client_id;
          if (!key) return;
          const existing = bookingsByClientId.get(key) || { count: 0, totalSpent: 0, lastDate: null };
          existing.count++;
          if (b.payment_status === "paid" || b.payment_status === "completed" || b.status === "completed") {
            existing.totalSpent += Number(b.total_price) || 0;
          }
          if (b.scheduled_date && (!existing.lastDate || b.scheduled_date > existing.lastDate)) {
            existing.lastDate = b.scheduled_date;
          }
          bookingsByClientId.set(key, existing);
        });
      }

      // Fallback: also check by guest_email/guest_phone for bookings not yet linked
      const emails = rawClients.map((c) => c.email).filter(Boolean) as string[];
      const phones = rawClients.map((c) => c.phone).filter(Boolean) as string[];
      const bookingsByEmail = new Map<string, { count: number; totalSpent: number; lastDate: string | null }>();
      const bookingsByPhone = new Map<string, { count: number; totalSpent: number; lastDate: string | null }>();

      if (emails.length > 0) {
        const { data: emailBookings } = await supabase
          .from("bookings")
          .select("guest_email, total_price, payment_status, scheduled_date, status, client_id")
          .in("guest_email", emails)
          .is("client_id", null);

        (emailBookings || []).forEach((b) => {
          const key = b.guest_email?.toLowerCase();
          if (!key) return;
          const existing = bookingsByEmail.get(key) || { count: 0, totalSpent: 0, lastDate: null };
          existing.count++;
          if (b.payment_status === "paid" || b.payment_status === "completed" || b.status === "completed") {
            existing.totalSpent += Number(b.total_price) || 0;
          }
          if (b.scheduled_date && (!existing.lastDate || b.scheduled_date > existing.lastDate)) {
            existing.lastDate = b.scheduled_date;
          }
          bookingsByEmail.set(key, existing);
        });
      }

      if (phones.length > 0) {
        const { data: phoneBookings } = await supabase
          .from("bookings")
          .select("guest_phone, total_price, payment_status, scheduled_date, status, client_id")
          .in("guest_phone", phones)
          .is("client_id", null);

        (phoneBookings || []).forEach((b) => {
          const key = b.guest_phone;
          if (!key) return;
          const existing = bookingsByPhone.get(key) || { count: 0, totalSpent: 0, lastDate: null };
          existing.count++;
          if (b.payment_status === "paid" || b.payment_status === "completed" || b.status === "completed") {
            existing.totalSpent += Number(b.total_price) || 0;
          }
          if (b.scheduled_date && (!existing.lastDate || b.scheduled_date > existing.lastDate)) {
            existing.lastDate = b.scheduled_date;
          }
          bookingsByPhone.set(key, existing);
        });
      }

      // Fetch membership status via profiles
      const profileEmailToUserId = new Map<string, string>();
      const membershipByEmail = new Map<string, string>();
      if (emails.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("email", emails);

        (profiles || []).forEach((p) => {
          if (p.email) profileEmailToUserId.set(p.email.toLowerCase(), p.user_id);
        });

        const userIds = Array.from(profileEmailToUserId.values());
        if (userIds.length > 0) {
          const { data: memberships } = await supabase
            .from("customer_memberships")
            .select("user_id, status")
            .in("user_id", userIds);

          const userIdToEmail = new Map<string, string>();
          profileEmailToUserId.forEach((uid, email) => userIdToEmail.set(uid, email));

          (memberships || []).forEach((m) => {
            const email = userIdToEmail.get(m.user_id);
            if (!email) return;
            const current = membershipByEmail.get(email);
            if (!current || m.status === "active") {
              membershipByEmail.set(email, m.status);
            }
          });
        }
      }

      // Step 3: Build enriched clients
      let enriched: EnrichedClient[] = rawClients.map((c) => {
        const clientIdStats = bookingsByClientId.get(c.id);
        const emailKey = c.email?.toLowerCase();
        const emailStats = emailKey ? bookingsByEmail.get(emailKey) : null;
        const phoneStats = c.phone ? bookingsByPhone.get(c.phone) : null;

        const totalBookings = (clientIdStats?.count || 0) + (emailStats?.count || 0) + (phoneStats?.count || 0);
        const totalSpent = (clientIdStats?.totalSpent || 0) + (emailStats?.totalSpent || 0) + (phoneStats?.totalSpent || 0);
        const lastServiceDate = clientIdStats?.lastDate || emailStats?.lastDate || phoneStats?.lastDate || null;
        const membershipStatus = emailKey ? membershipByEmail.get(emailKey) || null : null;

        return {
          ...c,
          totalBookings,
          totalSpent: totalSpent || (c.total_lifetime_spend || 0),
          lastServiceDate,
          membershipStatus,
        };
      });

      // Step 4: Apply enrichment-based filters
      if (filter === "has_membership") {
        enriched = enriched.filter((c) => c.membershipStatus === "active");
      } else if (filter === "no_bookings") {
        enriched = enriched.filter((c) => c.totalBookings === 0);
      }

      // Sort by last_service if selected (can't do server-side)
      if (sortBy === "last_service") {
        enriched.sort((a, b) => {
          if (!a.lastServiceDate && !b.lastServiceDate) return 0;
          if (!a.lastServiceDate) return 1;
          if (!b.lastServiceDate) return -1;
          return b.lastServiceDate.localeCompare(a.lastServiceDate);
        });
      } else if (sortBy === "total_spent") {
        enriched.sort((a, b) => b.totalSpent - a.totalSpent);
      }

      // Apply pagination for enrichment filters
      if (needsEnrichmentFilter) {
        setTotalCount(enriched.length);
        enriched = enriched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
      } else {
        setTotalCount(count || 0);
      }

      setClients(enriched);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [search, page, filter, sortBy]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setPage(0);
  }, [search, filter, sortBy]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormOpen(true);
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
  };

  const handleAdd = () => {
    setSelectedClient(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteClient) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("clients").delete().eq("id", deleteClient.id);
      if (error) throw error;
      toast.success("Client deleted successfully");
      setDeleteClient(null);
      fetchClients();
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  const getDisplayName = (client: Client) => {
    return client.full_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "Unknown";
  };

  const formatSource = (source: string | null) => {
    switch (source) {
      case "wix": return "Wix Import";
      case "csv_import": return "CSV Import";
      case "manual": return "Manual";
      case "booking": return "Booking";
      default: return source || "Website";
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (viewingClient) {
    return (
      <ClientDetailView
        client={viewingClient}
        onBack={() => { setViewingClient(null); fetchClients(); }}
        onUpdate={fetchClients}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Customers
              </CardTitle>
              <CardDescription>
                {totalCount} total customers in your database
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search, Filter, Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="has_membership">Has Membership</SelectItem>
                <SelectItem value="imported">Imported</SelectItem>
                <SelectItem value="no_bookings">No Bookings Yet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_added">Date Added</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="total_spent">Total Spent</SelectItem>
                <SelectItem value="last_service">Last Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search || filter !== "all" ? "No customers found matching your criteria" : "No customers yet. Add your first customer or import from CSV."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-center">Bookings</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Last Service</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(client)}
                      >
                        <TableCell>
                          <div className="font-medium">{getDisplayName(client)}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {client.email || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {client.phone || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {client.city || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {client.totalBookings}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {client.totalSpent > 0 ? `$${client.totalSpent.toFixed(0)}` : "—"}
                        </TableCell>
                        <TableCell>
                          {client.membershipStatus === "active" ? (
                            <Badge className="bg-primary/10 text-primary text-xs">Active</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formatSource(client.source)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {client.lastServiceDate
                            ? format(new Date(client.lastServiceDate), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(client)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteClient(client)}
                              className="text-destructive hover:text-destructive"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={selectedClient}
        onSuccess={fetchClients}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteClient ? getDisplayName(deleteClient) : "this customer"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
