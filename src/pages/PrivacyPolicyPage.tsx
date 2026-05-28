import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <SEOHead
        title="Privacy Policy | AV Detailing"
        description="How AV Detailing collects, uses and protects customer information, including phone numbers and SMS opt-in details for booking confirmations and reminders."
        path="/privacy-policy"
      />
      <section className="section-padding bg-background min-h-[80vh]">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto prose prose-invert">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: February 18, 2025</p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you book a service with AV Detailing, we collect personal information including your name, email address,
              phone number, service address, and vehicle details. This information is necessary to provide our mobile detailing services.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Phone Number Collection & SMS Communications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect customer phone numbers during the booking process. By providing your phone number and agreeing to our
              SMS consent at checkout, you opt-in to receive SMS text message notifications related to your service, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Booking confirmations</li>
              <li>Appointment reminders</li>
              <li>Service updates and status changes</li>
              <li>Billing and payment notifications</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. SMS Message Frequency & Rates</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Message frequency varies</strong> based on your booking activity and service schedule.</li>
              <li><strong>Message and data rates may apply.</strong> Please contact your wireless carrier for details about your text messaging plan.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Opting Out of SMS</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can opt out of SMS notifications at any time by replying <strong>STOP</strong> to any message you receive from us.
              After opting out, you will receive one final confirmation message. You will no longer receive SMS messages from AV Detailing
              unless you opt back in.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Getting Help</h2>
            <p className="text-muted-foreground leading-relaxed">
              For assistance with our SMS messaging program, reply <strong>HELP</strong> to any message or contact us at{" "}
              <a href="mailto:aaronvasquez@avdetailingg.com" className="text-primary hover:underline">
                aaronvasquez@avdetailingg.com
              </a>.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. No Sharing of Phone Numbers</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>We do NOT sell, rent, or share your phone number with any third parties</strong> for marketing or any other purpose.
              Your phone number is used solely to communicate with you about your booked services with AV Detailing.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your personal information. Your data is stored securely
              and accessed only by authorized personnel for the purpose of providing our services.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Email: <a href="mailto:aaronvasquez@avdetailingg.com" className="text-primary hover:underline">aaronvasquez@avdetailingg.com</a></li>
              <li>Phone: <a href="tel:+12255216264" className="text-primary hover:underline">(225) 521-6264</a></li>
            </ul>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                See also our{" "}
                <Link to="/terms-and-conditions" className="text-primary hover:underline">Terms & Conditions</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPolicyPage;
