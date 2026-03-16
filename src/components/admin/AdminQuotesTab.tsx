import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Eye, 
  Send, 
  DollarSign, 
  ArrowRight, 
  Loader2,
  Ship,
  Truck,
  Plane,
  Clock,
  Image,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { PhotoGallery } from "@/components/photos/PhotoGallery";

interface Quote {
  id: string;
  service_type: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  vehicle_length: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_details: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  estimated_hours: number | null;
  quoted_price: number | null;
  deposit_amount: number | null;
  deposit_required: boolean;
  customer_notes: string | null;
  quoted_at: string | null;
  expires_at: string | null;
  booking_id: string | null;
  created_at: string;
  user_id: string | null;
  profiles?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

interface QuotePhoto {
  id: string;
  storage_path: string;
  caption: string | null;
  url?: string;
}

const serviceIcons: Record<string, React.ReactNode> = {
  boat: <Ship className="h-4 w-4" />,
  rv: <Truck className="h-4 w-4" />,
  aircraft: <Plane className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  quoted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  accepted: "bg-green-500/10 text-green-500 border-green-500/20",
  declined: "bg-red-500/10 text-red-500 border-red-500/20",
  converted: "bg-primary/10 text-primary border-primary/20",
  expired: "bg-muted text-muted-foreground border-muted",
};

const AIRCRAFT_DEPOSIT = 500;

export function AdminQuotesTab() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quotePhotos, setQuotePhotos] = useState<QuotePhoto[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Quote form state
  const [quotedPrice, setQuotedPrice] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for quotes with user_id
      const userIds = [...new Set(data?.filter(q => q.user_id).map(q => q.user_id) || [])];
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

      const enrichedQuotes = data?.map(q => ({
        ...q,
        profiles: q.user_id ? profilesMap[q.user_id] : null
      })) || [] as Quote[];

      setQuotes(enrichedQuotes as Quote[]);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const fetchQuotePhotos = async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .from('quote_photos')
        .select('*')
        .eq('quote_id', quoteId);

      if (error) throw error;

      // Get public URLs for photos
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: urlData } = supabase.storage
            .from('quote-photos')
            .getPublicUrl(photo.storage_path);
          return {
            ...photo,
            url: urlData?.publicUrl
          };
        })
      );

      setQuotePhotos(photosWithUrls);
    } catch (error) {
      console.error('Error fetching quote photos:', error);
    }
  };

  const openQuoteDetail = async (quote: Quote) => {
    setSelectedQuote(quote);
    setDetailOpen(true);
    await fetchQuotePhotos(quote.id);
  };

  const openQuoteForm = (quote: Quote) => {
    setSelectedQuote(quote);
    setQuotedPrice(quote.quoted_price?.toString() || "");
    setEstimatedHours(quote.estimated_hours?.toString() || "");
    setDepositAmount(quote.service_type === 'aircraft' ? AIRCRAFT_DEPOSIT.toString() : (quote.deposit_amount?.toString() || ""));
    // Fetch internal notes from separate table
    const { data: noteData } = await supabase
      .from('quote_internal_notes')
      .select('note')
      .eq('quote_id', quote.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setInternalNotes(noteData?.note || "");
    setQuoteFormOpen(true);
  };

  const handleSendQuote = async () => {
    if (!selectedQuote) return;
    
    setProcessing(true);
    try {
      const price = parseFloat(quotedPrice);
      const hours = parseFloat(estimatedHours) || null;
      const deposit = parseFloat(depositAmount) || null;

      if (!price || price <= 0) {
        toast.error("Please enter a valid price");
        return;
      }

      const { error } = await supabase
        .from('quotes')
        .update({
          quoted_price: price,
          estimated_hours: hours,
          deposit_amount: deposit,
          deposit_required: selectedQuote.service_type === 'aircraft' || (deposit && deposit > 0),
          status: 'quoted',
          quoted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .eq('id', selectedQuote.id);

      // Save internal notes to separate table
      if (internalNotes) {
        await supabase
          .from('quote_internal_notes')
          .upsert({
            quote_id: selectedQuote.id,
            note: internalNotes,
          }, { onConflict: 'quote_id' });
      }

      if (error) throw error;

      // TODO: Send email to customer with quote details
      toast.success("Quote sent successfully!");
      setQuoteFormOpen(false);
      fetchQuotes();
    } catch (error: any) {
      console.error('Error sending quote:', error);
      toast.error("Failed to send quote");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (quoteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;
      toast.success(`Quote marked as ${newStatus}`);
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error("Failed to update quote");
    }
  };

  const getCustomerName = (quote: Quote) => {
    return quote.profiles?.full_name || quote.guest_name || 'Unknown';
  };

  const getCustomerContact = (quote: Quote) => {
    return quote.profiles?.email || quote.guest_email || quote.profiles?.phone || quote.guest_phone;
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = !search.trim() ||
      getCustomerName(q).toLowerCase().includes(search.toLowerCase()) ||
      getCustomerContact(q)?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesService = serviceFilter === 'all' || q.service_type === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const stats = {
    pending: quotes.filter(q => q.status === 'pending').length,
    quoted: quotes.filter(q => q.status === 'quoted').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    converted: quotes.filter(q => q.status === 'converted').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Pending Review
            </div>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Send className="h-4 w-4" />
              Quoted
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.quoted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle className="h-4 w-4" />
              Accepted
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ArrowRight className="h-4 w-4" />
              Converted to Booking
            </div>
            <div className="text-2xl font-bold text-primary">{stats.converted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quote Requests</CardTitle>
              <CardDescription>Boat, RV, and Aircraft quote requests</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchQuotes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="boat">Boat</SelectItem>
                <SelectItem value="rv">RV</SelectItem>
                <SelectItem value="aircraft">Aircraft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No quote requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {serviceIcons[quote.service_type]}
                          <span className="capitalize font-medium">{quote.service_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{getCustomerName(quote)}</div>
                        <div className="text-sm text-muted-foreground">{getCustomerContact(quote)}</div>
                      </TableCell>
                      <TableCell>
                        {quote.vehicle_length && <div>{quote.vehicle_length}</div>}
                        {quote.vehicle_make && (
                          <div className="text-sm text-muted-foreground">
                            {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {quote.quoted_price ? (
                          <div className="font-medium">${quote.quoted_price.toFixed(2)}</div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(quote.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openQuoteDetail(quote)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {quote.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openQuoteForm(quote)}
                            >
                              <DollarSign className="h-4 w-4" />
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

      {/* Quote Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedQuote && serviceIcons[selectedQuote.service_type]}
              <span className="capitalize">{selectedQuote?.service_type} Quote Request</span>
            </DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-medium">Customer</div>
                  <div>{getCustomerName(selectedQuote)}</div>
                  {(selectedQuote.guest_email || selectedQuote.profiles?.email) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {selectedQuote.profiles?.email || selectedQuote.guest_email}
                    </div>
                  )}
                  {(selectedQuote.guest_phone || selectedQuote.profiles?.phone) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {selectedQuote.profiles?.phone || selectedQuote.guest_phone}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="font-medium">Location</div>
                  {selectedQuote.service_address ? (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div>{selectedQuote.service_address}</div>
                        <div>{selectedQuote.service_city}, {selectedQuote.service_state}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="border-t pt-4">
                <div className="font-medium mb-2">Vehicle Details</div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {selectedQuote.vehicle_length && (
                    <div>
                      <span className="text-muted-foreground">Length: </span>
                      {selectedQuote.vehicle_length}
                    </div>
                  )}
                  {selectedQuote.vehicle_make && (
                    <div>
                      <span className="text-muted-foreground">Make/Model: </span>
                      {selectedQuote.vehicle_year} {selectedQuote.vehicle_make} {selectedQuote.vehicle_model}
                    </div>
                  )}
                </div>
                {selectedQuote.vehicle_details && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Details: </span>
                    {selectedQuote.vehicle_details}
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              {selectedQuote.customer_notes && (
                <div className="border-t pt-4">
                  <div className="font-medium mb-2">Customer Notes</div>
                  <div className="text-sm bg-muted p-3 rounded-lg">{selectedQuote.customer_notes}</div>
                </div>
              )}

              {/* Photos */}
              {quotePhotos.length > 0 && (
                <div className="border-t pt-4">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Uploaded Photos ({quotePhotos.length})
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {quotePhotos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt={photo.caption || "Quote photo"}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quote Info */}
              {selectedQuote.quoted_price && (
                <div className="border-t pt-4">
                  <div className="font-medium mb-2">Quote Details</div>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="text-muted-foreground">Price: </span>
                      <span className="font-bold">${selectedQuote.quoted_price.toFixed(2)}</span>
                    </div>
                    {selectedQuote.estimated_hours && (
                      <div>
                        <span className="text-muted-foreground">Est. Hours: </span>
                        {selectedQuote.estimated_hours}
                      </div>
                    )}
                    {selectedQuote.deposit_required && selectedQuote.deposit_amount && (
                      <div>
                        <span className="text-muted-foreground">Deposit Required: </span>
                        ${selectedQuote.deposit_amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex flex-wrap gap-2">
                {selectedQuote.status === 'pending' && (
                  <Button onClick={() => { setDetailOpen(false); openQuoteForm(selectedQuote); }}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Create Quote
                  </Button>
                )}
                {selectedQuote.status === 'accepted' && !selectedQuote.booking_id && (
                  <Button>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Convert to Booking
                  </Button>
                )}
                {selectedQuote.status !== 'declined' && selectedQuote.status !== 'converted' && (
                  <Button 
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedQuote.id, 'declined')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Quote Dialog */}
      <Dialog open={quoteFormOpen} onOpenChange={setQuoteFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Enter pricing details for this {selectedQuote?.service_type} detailing quote
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quoted_price">Quoted Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="quoted_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 8"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
            </div>

            {selectedQuote?.service_type === 'aircraft' ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-600 font-medium">
                  <Plane className="h-4 w-4" />
                  Aircraft Deposit Required
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  A $500 deposit is required for all aircraft detailing bookings.
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="deposit_amount">Deposit Amount (optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="deposit_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                placeholder="Notes for internal reference (not sent to customer)"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendQuote} disabled={processing || !quotedPrice}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}