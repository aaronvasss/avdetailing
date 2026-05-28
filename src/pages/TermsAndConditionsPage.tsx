import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";

const TermsAndConditionsPage = () => {
  return (
    <Layout>
      <SEOHead
        title="Terms & Conditions | AV Detailing"
        description="AV Detailing booking terms, SMS consent disclosure, cancellation policy, deposits, refunds and service guarantees for mobile detailing in Baton Rouge, LA."
        path="/terms-and-conditions"
      />
      <section className="section-padding bg-background min-h-[80vh]">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto prose prose-invert">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms & Conditions</h1>
            <p className="text-muted-foreground mb-8">Last updated: February 18, 2025</p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By booking a service with AV Detailing or using our website, you agree to these Terms & Conditions.
              If you do not agree, please do not use our services.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. SMS Consent Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              By providing your phone number during the booking process and checking the SMS consent box, you expressly agree
              to receive SMS text messages from AV Detailing related to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Booking confirmations and appointment reminders</li>
              <li>Service updates and status notifications</li>
              <li>Billing and payment-related communications</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Message Frequency & Rates</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Message frequency varies</strong> depending on your booking activity.</li>
              <li><strong>Message and data rates may apply.</strong> Contact your wireless carrier for details about your messaging plan.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Opting Out & Getting Help</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Reply <strong>STOP</strong> to any SMS message to unsubscribe from notifications.</li>
              <li>Reply <strong>HELP</strong> to any SMS message for assistance.</li>
              <li>You may also contact us at <a href="mailto:aaronvasquez@avdetailingg.com" className="text-primary hover:underline">aaronvasquez@avdetailingg.com</a> for support.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Carrier Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              AV Detailing is not liable for delayed or undelivered messages due to wireless carrier issues, network outages,
              or device-related problems. Message delivery is subject to your carrier's terms and network availability.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Service Booking & Cancellation</h2>
            <p className="text-muted-foreground leading-relaxed">
              All bookings are subject to availability. We reserve the right to reschedule or cancel appointments
              due to weather conditions or other unforeseen circumstances. Customers will be notified promptly of any changes.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Payment is due at the time of service unless paid online during booking. Online payments include a 3.5% processing fee.
              We accept cash, credit/debit cards, and online payment via Stripe.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              AV Detailing provides professional detailing services with care and attention. However, we are not responsible for
              pre-existing damage, paint defects, or conditions that are discovered during the detailing process. Any concerns
              should be communicated prior to service.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms & Conditions, please contact us:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Email: <a href="mailto:aaronvasquez@avdetailingg.com" className="text-primary hover:underline">aaronvasquez@avdetailingg.com</a></li>
              <li>Phone: <a href="tel:+12255216264" className="text-primary hover:underline">(225) 521-6264</a></li>
            </ul>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                See also our{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsAndConditionsPage;
