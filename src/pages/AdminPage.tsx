import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminCalendarView } from "@/components/admin/AdminCalendarView";
import { AdminBookingsTab } from "@/components/admin/AdminBookingsTab";
import { AdminAppointmentsTab } from "@/components/admin/AdminAppointmentsTab";
import { AdminClientsTab } from "@/components/admin/AdminClientsTab";
import { AdminMembershipsTab } from "@/components/admin/AdminMembershipsTab";
import { AdminQuotesTab } from "@/components/admin/AdminQuotesTab";
import { AdminNotificationsTab } from "@/components/admin/AdminNotificationsTab";
import { AdminServicesTab } from "@/components/admin/AdminServicesTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminMessagesTab } from "@/components/admin/AdminMessagesTab";
import { AdminRemindersTab } from "@/components/admin/AdminRemindersTab";
import { AdminSmsDebugTab } from "@/components/admin/AdminSmsDebugTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminDataAuditTab } from "@/components/admin/AdminDataAuditTab";
import { Loader2, ShieldAlert, Calendar, Clock, MapPin, Phone, Mail, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/seo/SEOHead";

interface BookingDetails {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  total_price: number;
  vehicle_type: string;
  service_address: string;
  service_city: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email?: string | null;
  user_id: string | null;
  services: { name: string } | null;
  profiles: { full_name: string; phone: string; email?: string } | null;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, isStaff, isLoading, user, role } = useRoleCheck();
  const [currentTab, setCurrentTab] = useState("overview");
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [replyPhone, setReplyPhone] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [bookingPhotos, setBookingPhotos] = useState<any[]>([]);
  const { getBookingPhotos, deletePhoto } = usePhotoUpload();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth?redirect=/admin");
    }
  }, [isLoading, user, navigate]);

  const getCustomerName = (booking: BookingDetails) => {
    return booking.profiles?.full_name || booking.guest_name || "Unknown";
  };

  const getCustomerPhone = (booking: BookingDetails) => {
    return booking.profiles?.phone || booking.guest_phone || null;
  };

  const getCustomerEmail = (booking: BookingDetails) => {
    return booking.profiles?.email || booking.guest_email || null;
  };

  const handleViewBooking = async (booking: any) => {
    setSelectedBooking(booking);
    // Load photos for this booking
    const photos = await getBookingPhotos(booking.id);
    setBookingPhotos(photos);
  };

  const handlePhotosChange = async () => {
    if (selectedBooking) {
      const photos = await getBookingPhotos(selectedBooking.id);
      setBookingPhotos(photos);
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    if (!photo.id) return;
    const success = await deletePhoto("booking-photos", photo.storage_path, photo.id);
    if (success) {
      setBookingPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    }
  };

  const handleTextCustomer = (phone: string) => {
    setReplyPhone(phone);
  };

  const sendSms = async () => {
    if (!replyPhone || !replyMessage.trim()) return;
    setSendingSms(true);
    try {
      const { error } = await supabase.functions.invoke("send-sms", {
        body: { to: replyPhone, message: replyMessage },
      });
      if (error) throw error;
      toast.success("SMS sent successfully!");
      setReplyMessage("");
      setReplyPhone(null);
    } catch (err) {
      console.error("Error sending SMS:", err);
      toast.error("Failed to send SMS");
    } finally {
      setSendingSms(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <Button onClick={() => navigate("/account")}>
              Go to My Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTab = () => {
    switch (currentTab) {
      case "overview":
        return (
          <AdminOverviewTab 
            isAdmin={isAdmin} 
            onViewBooking={handleViewBooking}
            onTextCustomer={handleTextCustomer}
            onNavigateTab={setCurrentTab}
          />
        );
      case "calendar":
        return <AdminCalendarView isAdmin={isAdmin} />;
      case "bookings":
        return <AdminBookingsTab isAdmin={isAdmin} />;
      case "appointments":
        return <AdminAppointmentsTab isAdmin={isAdmin} />;
      case "clients":
        return <AdminClientsTab />;
      case "memberships":
        return isAdmin ? <AdminMembershipsTab /> : null;
      case "quotes":
        return <AdminQuotesTab />;
      case "notifications":
        return <AdminNotificationsTab onNavigateTab={setCurrentTab} />;
      case "services":
        return isAdmin ? <AdminServicesTab /> : null;
      case "analytics":
        return isAdmin ? <AdminAnalyticsTab isAdmin={isAdmin} /> : null;
      case "messages":
        return <AdminMessagesTab />;
      case "reminders":
        return <AdminRemindersTab />;
      case "sms-debug":
        return isAdmin ? <AdminSmsDebugTab /> : null;
      case "data-audit":
        return isAdmin ? <AdminDataAuditTab /> : null;
      case "settings":
        return isAdmin ? <AdminSettingsTab /> : null;
      default:
        return null;
    }
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case "overview": return "Dashboard Overview";
      case "calendar": return "Calendar View";
      case "bookings": return "Manage Bookings";
      case "appointments": return "Appointments";
      case "clients": return "Client CRM";
      case "memberships": return "Membership Management";
      case "quotes": return "Quote Requests";
      case "notifications": return "Notifications Center";
      case "services": return "Service & Pricing Control";
      case "analytics": return "Revenue Analytics";
      case "messages": return "Customer Messages";
      case "reminders": return "Appointment Reminders";
      case "sms-debug": return "SMS Debug Tools";
      case "data-audit": return "Data Audit";
      case "settings": return "Business Settings";
      default: return "Admin Dashboard";
    }
  };

  return (
    <>
      <SEOHead title="Admin" description="Private page." path="/admin" noIndex />
      <AdminLayout 
        currentTab={currentTab} 
        onTabChange={setCurrentTab}
        isAdmin={isAdmin}
        userName={user?.email}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{getTabTitle()}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTab === "overview" && "Quick overview of today's schedule and key metrics"}
            {currentTab === "calendar" && "Visual calendar with week and day views"}
            {currentTab === "bookings" && "View and manage all customer bookings"}
            {currentTab === "appointments" && "View all appointments with calendar export options"}
            {currentTab === "clients" && "Full client CRM with contact info, vehicles, booking history, and notes"}
            {currentTab === "memberships" && "Manage subscriptions, pause/cancel memberships, view renewals"}
            {currentTab === "quotes" && "Boat, RV, and Aircraft quote requests with manual pricing"}
            {currentTab === "notifications" && "Smart alerts for jobs, payments, quotes, and revenue"}
            {currentTab === "services" && "Edit service prices, durations, and enable/disable services"}
            {currentTab === "analytics" && "Revenue trends, service popularity, and performance metrics"}
            {currentTab === "messages" && "View and respond to customer SMS messages"}
            {currentTab === "reminders" && "Send appointment reminders to customers"}
            {currentTab === "sms-debug" && "Test and debug SMS functionality"}
            {currentTab === "data-audit" && "Cross-check contacts against client records for missing addresses or phone numbers"}
            {currentTab === "settings" && "Manage phone numbers, emails, and business configuration"}
          </p>
        </div>
        {renderTab()}
      </AdminLayout>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => { setSelectedBooking(null); setBookingPhotos([]); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedBooking.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.scheduled_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${selectedBooking.service_address}, ${selectedBooking.service_city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedBooking.service_address}, {selectedBooking.service_city}
                  </a>
                </div>
                {getCustomerPhone(selectedBooking) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${getCustomerPhone(selectedBooking)}`} className="text-primary hover:underline">
                      {getCustomerPhone(selectedBooking)}
                    </a>
                  </div>
                )}
                {getCustomerEmail(selectedBooking) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${getCustomerEmail(selectedBooking)}`} className="text-primary hover:underline">
                      {getCustomerEmail(selectedBooking)}
                    </a>
                  </div>
                )}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="font-medium">{getCustomerName(selectedBooking)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service</span>
                  <span className="font-medium">{selectedBooking.services?.name || "Detailing"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle</span>
                  <span>{selectedBooking.vehicle_type}</span>
                </div>
                {isAdmin && (
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-bold">${selectedBooking.total_price?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Photos Section */}
              {isAdmin && (
                <div className="border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Camera className="h-4 w-4" />
                    Photos
                  </h4>
                  <Tabs defaultValue="before" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-3">
                      <TabsTrigger value="before">
                        Before ({bookingPhotos.filter(p => p.photoType === "before").length})
                      </TabsTrigger>
                      <TabsTrigger value="after">
                        After ({bookingPhotos.filter(p => p.photoType === "after").length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="before" className="space-y-3">
                      <PhotoUploader
                        bucket="booking-photos"
                        bookingId={selectedBooking.id}
                        photoType="before"
                        onUploadComplete={handlePhotosChange}
                        maxFiles={10}
                        compact
                      />
                      {bookingPhotos.filter(p => p.photoType === "before").length > 0 && (
                        <PhotoGallery
                          photos={bookingPhotos.filter(p => p.photoType === "before")}
                          onDelete={handleDeletePhoto}
                          editable
                          showType={false}
                          columns={4}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="after" className="space-y-3">
                      <PhotoUploader
                        bucket="booking-photos"
                        bookingId={selectedBooking.id}
                        photoType="after"
                        onUploadComplete={handlePhotosChange}
                        maxFiles={10}
                        compact
                      />
                      {bookingPhotos.filter(p => p.photoType === "after").length > 0 && (
                        <PhotoGallery
                          photos={bookingPhotos.filter(p => p.photoType === "after")}
                          onDelete={handleDeletePhoto}
                          editable
                          showType={false}
                          columns={4}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              <div className="border-t pt-4 flex gap-2">
                {getCustomerPhone(selectedBooking) && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setReplyPhone(getCustomerPhone(selectedBooking)!);
                      setSelectedBooking(null);
                    }}
                  >
                    Text Customer
                  </Button>
                )}
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SMS Reply Dialog */}
      <Dialog open={!!replyPhone} onOpenChange={() => setReplyPhone(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send SMS to {replyPhone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full min-h-[120px] p-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setReplyPhone(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={sendSms}
                disabled={!replyMessage.trim() || sendingSms}
              >
                {sendingSms ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
