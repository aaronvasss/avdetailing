import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Clock, Loader2, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isToday, isTomorrow } from "date-fns";

interface UpcomingBooking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  guest_name: string | null;
  guest_phone: string | null;
  service_city: string;
  user_id: string | null;
  services: { name: string } | null;
  profiles: { full_name: string; phone: string } | null;
}

export function AdminRemindersTab() {
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  const fetchUpcomingBookings = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = addDays(new Date(), 7).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        guest_name,
        guest_phone,
        service_city,
        user_id,
        services (name)
      `)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_date", today)
      .lte("scheduled_date", nextWeek)
      .order("scheduled_date", { ascending: true });

    if (error) {
      console.error("Error fetching bookings:", error);
    } else {
      // Fetch profiles separately for bookings with user_id
      const bookingsWithProfiles = await Promise.all(
        (data || []).map(async (booking) => {
          let profiles = null;
          if (booking.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("user_id", booking.user_id)
              .maybeSingle();
            profiles = profile;
          }
          return { ...booking, profiles };
        })
      );
      setUpcomingBookings(bookingsWithProfiles);
    }
    setLoading(false);
  };

  const sendReminder = async (bookingId: string, reminderType: "24h" | "2h") => {
    setSendingId(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke("send-reminder-sms", {
        body: { bookingId, reminderType },
      });

      if (error) throw error;
      toast.success(`${reminderType} reminder sent!`);
    } catch (err) {
      console.error("Error sending reminder:", err);
      toast.error("Failed to send reminder");
    } finally {
      setSendingId(null);
    }
  };

  const sendAllDueReminders = async () => {
    setSendingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-reminder-sms", {
        body: { sendAll: true },
      });

      if (error) throw error;
      toast.success(`Sent ${data.remindersSent || 0} reminders!`);
    } catch (err) {
      console.error("Error sending reminders:", err);
      toast.error("Failed to send reminders");
    } finally {
      setSendingAll(false);
    }
  };

  const getCustomerName = (booking: UpcomingBooking) => {
    return booking.profiles?.full_name || booking.guest_name || "Unknown";
  };

  const getCustomerPhone = (booking: UpcomingBooking) => {
    return booking.profiles?.phone || booking.guest_phone || null;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  // Group by date
  const groupedByDate = upcomingBookings.reduce((acc, booking) => {
    if (!acc[booking.scheduled_date]) {
      acc[booking.scheduled_date] = [];
    }
    acc[booking.scheduled_date].push(booking);
    return acc;
  }, {} as Record<string, UpcomingBooking[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Actions
          </CardTitle>
          <CardDescription>
            Reminders are sent automatically every hour. Use these buttons to send manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={sendAllDueReminders} disabled={sendingAll}>
              {sendingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send All Due Reminders Now
            </Button>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Cron job runs hourly at :00
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Upcoming Appointments ({upcomingBookings.length})
        </h3>

        {Object.keys(groupedByDate).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No upcoming bookings in the next 7 days.
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByDate).map(([date, bookings]) => (
            <Card key={date}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {getDateLabel(date)}
                  <Badge variant="secondary">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const phone = getCustomerPhone(booking);
                    const canSendSms = !!phone;

                    return (
                      <div
                        key={booking.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{booking.scheduled_time}</span>
                            <span>—</span>
                            <span>{getCustomerName(booking)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {booking.services?.name} • {booking.service_city}
                            {phone && (
                              <span className="ml-2">
                                • <a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canSendSms || sendingId === booking.id}
                            onClick={() => sendReminder(booking.id, "24h")}
                          >
                            {sendingId === booking.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Bell className="h-3 w-3 mr-1" />
                                24h
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canSendSms || sendingId === booking.id}
                            onClick={() => sendReminder(booking.id, "2h")}
                          >
                            {sendingId === booking.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Bell className="h-3 w-3 mr-1" />
                                2h
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
