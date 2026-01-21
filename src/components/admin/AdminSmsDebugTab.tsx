import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, TestTube, CheckCircle, XCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function AdminSmsDebugTab() {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("This is a test SMS from AV Detailing.");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sid?: string } | null>(null);

  const [bookingTestRunning, setBookingTestRunning] = useState(false);
  const [bookingTestResult, setBookingTestResult] = useState<{
    bookingSuccess: boolean;
    bookingId?: string;
    smsSuccess: boolean;
    smsError?: string;
    smsSid?: string;
  } | null>(null);

  // Send a test SMS directly
  const sendTestSms = async () => {
    if (!testPhone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          to: testPhone,
          message: testMessage,
        },
      });

      if (error) {
        setTestResult({
          success: false,
          message: error.message || "Failed to send SMS",
        });
        toast.error(`SMS failed: ${error.message}`);
      } else if (data?.success) {
        setTestResult({
          success: true,
          message: "SMS sent successfully!",
          sid: data.sid,
        });
        toast.success("Test SMS sent!");
      } else {
        setTestResult({
          success: false,
          message: data?.error || "Unknown error",
        });
        toast.error(`SMS failed: ${data?.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || String(err),
      });
      toast.error(`SMS error: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  // Run a full booking + SMS test
  const runBookingTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Please enter a phone number for the booking test");
      return;
    }

    setBookingTestRunning(true);
    setBookingTestResult(null);

    try {
      // Step 1: Create a test booking
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testDate = tomorrow.toISOString().split("T")[0];

      const testPayload = {
        service_id: "3763f8d6-9045-45d5-99cd-cb878bdceeb8", // Full Detail service
        scheduled_date: testDate,
        scheduled_time: "10:00 AM",
        guest_name: "Test Customer",
        guest_email: "test@example.com",
        guest_phone: testPhone,
        vehicle_type: "sedan",
        vehicle_make: "Test",
        vehicle_model: "Vehicle",
        service_address: "123 Test St",
        service_city: "Baton Rouge",
        service_zip: "70801",
        subtotal: 199,
        add_ons_total: 0,
        total_price: 199,
        status: "pending",
        payment_status: "unpaid",
        customer_notes: "[TEST BOOKING - Delete after testing]",
      };

      const { data: createResp, error: createErr } = await supabase.functions.invoke(
        "create-booking",
        { body: testPayload }
      );

      if (createErr || !createResp?.booking?.id) {
        setBookingTestResult({
          bookingSuccess: false,
          smsSuccess: false,
          smsError: createErr?.message || "Booking creation failed",
        });
        toast.error("Booking test failed");
        return;
      }

      const bookingId = createResp.booking.id;

      // Step 2: Send confirmation SMS
      const { data: smsResp, error: smsErr } = await supabase.functions.invoke(
        "send-booking-sms",
        {
          body: {
            customerPhone: testPhone,
            customerName: "Test Customer",
            serviceName: "Silver Package",
            scheduledDate: testDate,
            scheduledTime: "10:00 AM",
            serviceAddress: "123 Test St",
            serviceCity: "Baton Rouge",
            totalPrice: 199,
            bookingId: bookingId,
            notifyBusiness: false, // Don't notify business for test
          },
        }
      );

      if (smsErr) {
        setBookingTestResult({
          bookingSuccess: true,
          bookingId,
          smsSuccess: false,
          smsError: smsErr.message,
        });
        toast.warning("Booking created but SMS failed");
      } else if (smsResp?.success) {
        setBookingTestResult({
          bookingSuccess: true,
          bookingId,
          smsSuccess: true,
          smsSid: smsResp.results?.customer?.sid,
        });
        toast.success("Full booking + SMS test passed!");
      } else {
        setBookingTestResult({
          bookingSuccess: true,
          bookingId,
          smsSuccess: false,
          smsError: smsResp?.results?.customer?.error || "SMS send failed",
        });
        toast.warning("Booking created but SMS failed");
      }
    } catch (err: any) {
      setBookingTestResult({
        bookingSuccess: false,
        smsSuccess: false,
        smsError: err.message || String(err),
      });
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setBookingTestRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Test SMS Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Send Test SMS
          </CardTitle>
          <CardDescription>
            Send a test SMS to verify Twilio is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Phone Number</Label>
              <Input
                id="testPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testMessage">Message</Label>
              <Textarea
                id="testMessage"
                placeholder="Test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Button onClick={sendTestSms} disabled={sendingTest} className="w-full md:w-auto">
            {sendingTest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test SMS
              </>
            )}
          </Button>

          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                testResult.success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
              {testResult.sid && (
                <p className="mt-1 text-sm opacity-75">Message SID: {testResult.sid}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Booking Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Full Booking + SMS Test
          </CardTitle>
          <CardDescription>
            Creates a test booking and sends a confirmation SMS to verify the entire flow works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create a test booking in the database (marked with "[TEST BOOKING]") and send
            a real confirmation SMS to the phone number above. You should delete the test booking
            after verifying.
          </p>

          <Button
            onClick={runBookingTest}
            disabled={bookingTestRunning || !testPhone.trim()}
            variant="secondary"
            className="w-full md:w-auto"
          >
            {bookingTestRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Run Full Booking Test
              </>
            )}
          </Button>

          {bookingTestResult && (
            <div className="mt-4 space-y-3">
              {/* Booking Result */}
              <div
                className={`p-4 rounded-lg border ${
                  bookingTestResult.bookingSuccess
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {bookingTestResult.bookingSuccess ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    Booking: {bookingTestResult.bookingSuccess ? "Created" : "Failed"}
                  </span>
                </div>
                {bookingTestResult.bookingId && (
                  <p className="mt-1 text-sm opacity-75">
                    Booking ID: {bookingTestResult.bookingId}
                  </p>
                )}
              </div>

              {/* SMS Result */}
              <div
                className={`p-4 rounded-lg border ${
                  bookingTestResult.smsSuccess
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {bookingTestResult.smsSuccess ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    SMS: {bookingTestResult.smsSuccess ? "Sent" : "Failed"}
                  </span>
                </div>
                {bookingTestResult.smsSid && (
                  <p className="mt-1 text-sm opacity-75">SID: {bookingTestResult.smsSid}</p>
                )}
                {bookingTestResult.smsError && (
                  <p className="mt-1 text-sm opacity-75">Error: {bookingTestResult.smsError}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
