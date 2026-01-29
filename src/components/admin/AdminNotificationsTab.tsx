import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Phone, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  Car,
  Star,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow } from "date-fns";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  user_id: string | null;
  profiles?: { full_name: string | null; phone: string | null; email: string | null } | null;
  services?: { name: string } | null;
}

type NotificationType = "confirmation" | "on_the_way" | "review_request" | "custom";

export function AdminNotificationsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [messageType, setMessageType] = useState<"sms" | "email">("sms");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [manualDialogOpen, setManualDialogOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          guest_name,
          guest_phone,
          guest_email,
          user_id,
          profiles!bookings_user_id_fkey (full_name, phone, email),
          services (name)
        `)
        .gte("scheduled_date", today)
        .in("status", ["confirmed", "pending", "completed"])
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(50);

      if (error) throw error;
      setBookings((data as any[]) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerInfo = (booking: Booking) => {
    if (booking.user_id && booking.profiles) {
      return {
        name: booking.profiles.full_name || "Customer",
        phone: booking.profiles.phone,
        email: booking.profiles.email,
      };
    }
    return {
      name: booking.guest_name || "Guest",
      phone: booking.guest_phone,
      email: booking.guest_email,
    };
  };

  const sendNotification = async (booking: Booking, type: NotificationType, customMsg?: string) => {
    const customer = getCustomerInfo(booking);
    const sendingKey = `${booking.id}-${type}`;
    setSending(sendingKey);

    try {
      let message = "";
      const serviceName = booking.services?.name || "your service";
      const dateStr = format(new Date(booking.scheduled_date), "EEEE, MMMM d");
      
      switch (type) {
        case "confirmation":
          message = `Hi ${customer.name}! Your ${serviceName} appointment is confirmed for ${dateStr} at ${booking.scheduled_time}. Reply STOP to opt out.`;
          break;
        case "on_the_way":
          message = `Hi ${customer.name}! AV Detailing is on the way for your ${serviceName} appointment. We'll be there shortly! 🚗`;
          break;
        case "review_request":
          message = `Hi ${customer.name}! Thank you for choosing AV Detailing! We'd love to hear about your experience. Please leave us a review: [Review Link]. Thank you! ⭐`;
          break;
        case "custom":
          message = customMsg || "";
          break;
      }

      if (!message) {
        toast.error("No message to send");
        return;
      }

      if (!customer.phone) {
        toast.error("No phone number available for this customer");
        return;
      }

      const { error } = await supabase.functions.invoke("send-sms", {
        body: { 
          to: customer.phone, 
          message,
          bookingId: booking.id 
        },
      });

      if (error) throw error;
      toast.success(`${type === "on_the_way" ? "On the way" : type.charAt(0).toUpperCase() + type.slice(1)} notification sent!`);
      
      // Clear custom message if applicable
      if (type === "custom") {
        setCustomMessage("");
        setCustomDialogOpen(false);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setSending(null);
    }
  };

  const sendManualMessage = async () => {
    if (messageType === "sms" && !manualPhone) {
      toast.error("Phone number is required");
      return;
    }
    if (messageType === "email" && !manualEmail) {
      toast.error("Email address is required");
      return;
    }
    if (!manualMessage.trim()) {
      toast.error("Message is required");
      return;
    }

    setSending("manual");

    try {
      if (messageType === "sms") {
        const { error } = await supabase.functions.invoke("send-sms", {
          body: { to: manualPhone, message: manualMessage },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.functions.invoke("send-contact-email", {
          body: {
            to: manualEmail,
            subject: "Message from AV Detailing",
            message: manualMessage,
            isAdmin: true,
          },
        });
        if (error) throw error;
      }

      toast.success(`${messageType.toUpperCase()} sent successfully!`);
      setManualPhone("");
      setManualEmail("");
      setManualMessage("");
      setManualDialogOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(null);
    }
  };

  const todaysBookings = bookings.filter(b => isToday(new Date(b.scheduled_date)));
  const tomorrowsBookings = bookings.filter(b => isTomorrow(new Date(b.scheduled_date)));
  const completedBookings = bookings.filter(b => b.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Notifications Center</h2>
          <p className="text-sm text-muted-foreground">Send confirmations, on-the-way alerts, and review requests</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Manual Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Manual Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Select value={messageType} onValueChange={(v: "sms" | "email") => setMessageType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {messageType === "sms" ? (
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Type your message..."
                    value={manualMessage}
                    onChange={(e) => setManualMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendManualMessage} disabled={sending === "manual"}>
                  {sending === "manual" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : messageType === "sms" ? (
                    <Phone className="h-4 w-4 mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon" onClick={fetchBookings}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Today's Bookings - On The Way */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Today's Appointments
          </CardTitle>
          <CardDescription>Send "On the Way" notifications to today's customers</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No appointments today</p>
          ) : (
            <div className="space-y-3">
              {todaysBookings.map((booking) => {
                const customer = getCustomerInfo(booking);
                const sendingKey = `${booking.id}-on_the_way`;
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{customer.name}</span>
                        <Badge variant="secondary">{booking.scheduled_time}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {booking.services?.name} • {customer.phone || "No phone"}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendNotification(booking, "confirmation")}
                        disabled={sending === `${booking.id}-confirmation`}
                      >
                        {sending === `${booking.id}-confirmation` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sendNotification(booking, "on_the_way")}
                        disabled={sending === sendingKey}
                      >
                        {sending === sendingKey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Car className="h-4 w-4 mr-1" />
                            On the Way
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tomorrow's Bookings - Confirmation Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Tomorrow's Appointments
          </CardTitle>
          <CardDescription>Send confirmation reminders for tomorrow</CardDescription>
        </CardHeader>
        <CardContent>
          {tomorrowsBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No appointments tomorrow</p>
          ) : (
            <div className="space-y-3">
              {tomorrowsBookings.map((booking) => {
                const customer = getCustomerInfo(booking);
                const sendingKey = `${booking.id}-confirmation`;
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{customer.name}</span>
                        <Badge variant="secondary">{booking.scheduled_time}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {booking.services?.name} • {customer.phone || "No phone"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendNotification(booking, "confirmation")}
                      disabled={sending === sendingKey}
                    >
                      {sending === sendingKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Resend Confirmation
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed - Review Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Request Reviews
          </CardTitle>
          <CardDescription>Send review requests to completed bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {completedBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No completed bookings to request reviews from</p>
          ) : (
            <div className="space-y-3">
              {completedBookings.slice(0, 10).map((booking) => {
                const customer = getCustomerInfo(booking);
                const sendingKey = `${booking.id}-review_request`;
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{customer.name}</span>
                        <Badge variant="outline">
                          {format(new Date(booking.scheduled_date), "MMM d")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {booking.services?.name}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendNotification(booking, "review_request")}
                      disabled={sending === sendingKey}
                    >
                      {sending === sendingKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-1" />
                          Request Review
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Message Dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Custom Message</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{getCustomerInfo(selectedBooking).name}</p>
                <p className="text-sm text-muted-foreground">
                  {getCustomerInfo(selectedBooking).phone}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your custom message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedBooking && sendNotification(selectedBooking, "custom", customMessage)}
              disabled={sending === `${selectedBooking?.id}-custom` || !customMessage.trim()}
            >
              {sending === `${selectedBooking?.id}-custom` ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
