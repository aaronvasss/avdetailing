import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  Loader2,
  Save,
  Plus,
  Edit,
  Trash2,
  Lock,
  Star,
  Heart,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string | null;
  total_price: number | null;
  vehicle_type: string | null;
  services: { name: string } | null;
}

interface Vehicle {
  id: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  is_default: boolean | null;
}

interface Membership {
  id: string;
  status: string;
  next_service_date: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  membership_plans: { name: string; frequency: string; price: number } | null;
}

interface ClientDetailViewProps {
  client: Client;
  onBack: () => void;
  onUpdate: () => void;
}

export function ClientDetailView({ client, onBack, onUpdate }: ClientDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [lifetimeSpend, setLifetimeSpend] = useState(0);
  
  // Editable fields
  const [gateCode, setGateCode] = useState(client.gate_code || "");
  const [preferences, setPreferences] = useState(client.preferences || "");
  const [paintSensitivity, setPaintSensitivity] = useState(client.paint_sensitivity || "");
  const [notes, setNotes] = useState(client.notes || "");
  const [sendingThankYou, setSendingThankYou] = useState(false);

  // Customer value computations
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const completedCount = completedBookings.length;
  const totalBookingsCount = bookings.length;
  const avgTicket = completedCount > 0 ? lifetimeSpend / completedCount : 0;
  const sortedByDate = [...bookings].sort((a, b) =>
    a.scheduled_date.localeCompare(b.scheduled_date)
  );
  const memberSince = sortedByDate[0]?.scheduled_date || client.created_at;
  const vipStatus = lifetimeSpend > 500 || completedCount >= 5;

  const getDisplayName = () => {
    return client.full_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Unknown';
  };

  const handleSendThankYou = async () => {
    const firstName = client.first_name || getDisplayName().split(' ')[0] || 'there';
    const bookLink = `${window.location.origin}/booking`;
    const message = `Hi ${firstName}! Thank you for being a loyal AV Detailing customer. As a valued client, here's 10% off your next booking: ${bookLink}`;
    setSendingThankYou(true);
    try {
      let sent = false;
      if (client.phone) {
        const { error: smsError } = await supabase.functions.invoke('send-booking-sms', {
          body: { to: client.phone, message },
        });
        if (!smsError) sent = true;
      }
      if (client.email) {
        const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
          body: {
            name: 'AV Detailing',
            email: client.email,
            service: 'Loyalty Thank You',
            message,
          },
        });
        if (!emailError) sent = true;
      }
      if (!sent) {
        toast.error('No email or phone on file to send thank you');
      } else {
        toast.success(`Thank you sent to ${getDisplayName()}`);
      }
    } catch (err) {
      console.error('Thank you error', err);
      toast.error('Failed to send thank you');
    } finally {
      setSendingThankYou(false);
    }
  };

  const fetchClientData = useCallback(async () => {
    setLoading(true);
    try {
      // Find user by email or phone
      let userId: string | null = null;
      
      if (client.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', client.email)
          .maybeSingle();
        if (profile) userId = profile.user_id;
      }

      if (!userId && client.phone) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('phone', client.phone)
          .maybeSingle();
        if (profile) userId = profile.user_id;
      }

      // Fetch bookings - use client_id first, fall back to user_id or guest fields
      let bookingsData: Booking[] = [];
      
      // Primary: fetch by client_id
      const { data: clientBookings } = await supabase
        .from('bookings')
        .select('id, scheduled_date, scheduled_time, status, payment_status, total_price, vehicle_type, services(name)')
        .eq('client_id', client.id)
        .order('scheduled_date', { ascending: false })
        .limit(50);
      
      bookingsData = clientBookings || [];

      // Fallback: also fetch by user_id or guest fields if client_id yielded nothing
      if (bookingsData.length === 0) {
        let bookingsQuery = supabase
          .from('bookings')
          .select('id, scheduled_date, scheduled_time, status, payment_status, total_price, vehicle_type, services(name)')
          .order('scheduled_date', { ascending: false })
          .limit(50);

        if (userId) {
          bookingsQuery = bookingsQuery.eq('user_id', userId);
        } else if (client.email) {
          bookingsQuery = bookingsQuery.eq('guest_email', client.email);
        } else if (client.phone) {
          bookingsQuery = bookingsQuery.eq('guest_phone', client.phone);
        }

        const { data } = await bookingsQuery;
        bookingsData = data || [];
      }

      setBookings(bookingsData);

      // Calculate lifetime spend
      const spend = (bookingsData || [])
        .filter(b => b.status === 'completed' && b.total_price)
        .reduce((sum, b) => sum + (b.total_price || 0), 0);
      setLifetimeSpend(spend);

      // Fetch vehicles if user exists
      if (userId) {
        const { data: vehiclesData } = await supabase
          .from('customer_vehicles')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });
        setVehicles(vehiclesData || []);

        const { data: membershipsData } = await supabase
          .from('customer_memberships')
          .select('*, membership_plans(name, frequency, price)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        setMemberships(membershipsData || []);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          gate_code: gateCode || null,
          preferences: preferences || null,
          paint_sensitivity: paintSensitivity || null,
          notes: notes || null,
          total_lifetime_spend: lifetimeSpend
        })
        .eq('id', client.id);

      if (error) throw error;
      toast.success("Client notes saved");
      onUpdate();
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500';
      case 'cancelled': case 'no_show': return 'bg-red-500/10 text-red-500';
      case 'pending': case 'pending_payment': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {client.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${client.email}`} className="hover:text-primary">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <a href={`tel:${client.phone}`} className="hover:text-primary">{client.phone}</a>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Lifetime Spend</div>
            <div className="text-2xl font-bold text-primary">${lifetimeSpend.toFixed(2)}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendThankYou}
            disabled={sendingThankYou || (!client.email && !client.phone)}
          >
            {sendingThankYou ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Heart className="h-4 w-4 mr-2 text-red-500" />
            )}
            Send Thank You
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
            <TabsTrigger value="memberships">Memberships ({memberships.length})</TabsTrigger>
            <TabsTrigger value="notes">Internal Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Contact Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {client.email && <div>{client.email}</div>}
                  {client.phone && <div>{client.phone}</div>}
                  {(client.address_line1 || client.city) && (
                    <div className="pt-2 border-t">
                      <div className="flex items-start gap-1">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          {client.address_line1 && <div>{client.address_line1}</div>}
                          {client.address_line2 && <div>{client.address_line2}</div>}
                          <div>{[client.city, client.state, client.zip].filter(Boolean).join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Booking Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Bookings</span>
                    <span className="font-medium">{bookings.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{bookings.filter(b => b.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cancelled</span>
                    <span className="font-medium">{bookings.filter(b => b.status === 'cancelled').length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Notes Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Quick Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {gateCode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gate Code</span>
                      <span className="font-mono font-medium">{gateCode}</span>
                    </div>
                  )}
                  {paintSensitivity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paint Sensitivity</span>
                      <Badge variant="outline">{paintSensitivity}</Badge>
                    </div>
                  )}
                  {memberships.filter(m => m.status === 'active').length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member</span>
                      <Badge className="bg-primary/10 text-primary">Active</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            {bookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <div className="font-medium">{booking.services?.name || 'Detailing'}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.scheduled_date), 'MMM d, yyyy')} at {booking.scheduled_time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.total_price && (
                            <span className="font-medium">${booking.total_price.toFixed(2)}</span>
                          )}
                          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>All bookings for this client</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bookings found for this client
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="space-y-1">
                          <div className="font-medium">{booking.services?.name || 'Detailing'}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.scheduled_date), 'EEEE, MMMM d, yyyy')} at {booking.scheduled_time}
                          </div>
                          {booking.vehicle_type && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {booking.vehicle_type}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          {booking.total_price && (
                            <div className="font-medium">${booking.total_price.toFixed(2)}</div>
                          )}
                          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>Vehicles</CardTitle>
                <CardDescription>Vehicles registered to this client's account</CardDescription>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No vehicles registered
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {vehicles.map((vehicle) => (
                      <Card key={vehicle.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Car className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                                {vehicle.is_default && (
                                  <Badge variant="outline" className="text-xs">Default</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground capitalize">{vehicle.vehicle_type}</div>
                              {vehicle.color && (
                                <div className="text-sm text-muted-foreground">{vehicle.color}</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memberships Tab */}
          <TabsContent value="memberships">
            <Card>
              <CardHeader>
                <CardTitle>Memberships</CardTitle>
                <CardDescription>Active and past membership subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {memberships.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No membership history
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberships.map((membership) => (
                      <Card key={membership.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {membership.membership_plans?.name}
                                <Badge className={membership.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}>
                                  {membership.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                ${membership.membership_plans?.price}/{membership.membership_plans?.frequency}
                              </div>
                              {membership.next_service_date && (
                                <div className="text-sm text-muted-foreground mt-2">
                                  Next service: {format(new Date(membership.next_service_date), 'MMM d, yyyy')}
                                </div>
                              )}
                              {membership.current_period_end && (
                                <div className="text-sm text-muted-foreground">
                                  Renews: {format(new Date(membership.current_period_end), 'MMM d, yyyy')}
                                </div>
                              )}
                            </div>
                            {membership.stripe_subscription_id && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {membership.stripe_subscription_id.slice(0, 20)}...
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internal Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Internal Notes
                </CardTitle>
                <CardDescription>Private notes only visible to staff</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gate_code">Gate Code</Label>
                    <Input
                      id="gate_code"
                      placeholder="e.g., #1234"
                      value={gateCode}
                      onChange={(e) => setGateCode(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paint_sensitivity">Paint Sensitivity</Label>
                    <Input
                      id="paint_sensitivity"
                      placeholder="e.g., Ceramic coating, Single stage"
                      value={paintSensitivity}
                      onChange={(e) => setPaintSensitivity(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="preferences">Preferences</Label>
                  <Textarea
                    id="preferences"
                    placeholder="Special requests, preferred products, scheduling preferences..."
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">General Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other notes about this client..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSaveNotes} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}