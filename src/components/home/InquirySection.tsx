import { InquiryForm } from "@/components/forms/InquiryForm";
import { Phone, Mail, Clock } from "lucide-react";

interface InquirySectionProps {
  source?: string;
  serviceContext?: string;
  heading?: string;
  subheading?: string;
}

export function InquirySection({
  source = "homepage",
  serviceContext,
  heading = "Get a Free Quote",
  subheading = "Tell us about your vehicle and we'll reply within 24 hours. No obligation, no spam.",
}: InquirySectionProps) {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
          <div>
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Contact Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
              {heading}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">{subheading}</p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Prefer to talk?</p>
                  <a
                    href="tel:+12255216264"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    (225) 521-6264
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Response Time</p>
                  <p className="text-muted-foreground">Within 24 hours, Mon–Sat</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Serving</p>
                  <p className="text-muted-foreground">
                    Baton Rouge, Prairieville, Gonzales, Denham Springs & surrounding areas
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-background rounded-xl border border-border">
            <InquiryForm source={source} serviceContext={serviceContext} />
          </div>
        </div>
      </div>
    </section>
  );
}
