import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, Phone, RotateCcw } from "lucide-react";

export default function BookingCanceledPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-custom max-w-2xl">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <XCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Payment Canceled</CardTitle>
              <p className="text-muted-foreground mt-2">
                Your booking was not completed. No charges have been made.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  If you experienced any issues or have questions about our services, 
                  feel free to reach out to us.
                </p>
                <Button variant="outline" asChild>
                  <a href="tel:+12255216264">
                    <Phone className="mr-2 h-4 w-4" />
                    Call (225) 521-6264
                  </a>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/book">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start New Booking
                  </Link>
                </Button>
              </div>

              {bookingId && (
                <p className="text-center text-xs text-muted-foreground">
                  Reference: {bookingId.slice(0, 8)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
