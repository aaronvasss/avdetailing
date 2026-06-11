import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { JsonLd, breadcrumbSchema, localBusinessSchema } from "@/components/seo/JsonLd";
import { Check, Phone, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const GetStartedPage = () => {
  return (
    <Layout>
      <SEOHead
        title="Get Started | Free Detailing Quote in Baton Rouge"
        description="Get a free mobile detailing quote in Baton Rouge. Tell us about your car, boat, RV, or aircraft and we'll respond within 24 hours. Call (225) 521-6264."
        path="/get-started"
      />
      <JsonLd data={localBusinessSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Get Started", path: "/get-started" },
        ])}
      />

      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Get Started
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Request Your Free Detailing Quote
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Tell us a little about your vehicle and what you need. We'll reply within 24
              hours with a quote and the next available appointment in Baton Rouge.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="glow-red">
                <a href="tel:+12255216264">
                  <Phone className="mr-2 h-5 w-5" />
                  Call (225) 521-6264
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="sms:+12252284796">Text Us</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Form + benefits */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">Why Choose AV Detailing</h2>
              <ul className="space-y-4">
                {[
                  { icon: Sparkles, title: "Premium results", text: "Professional-grade products and proven processes for show-quality finishes." },
                  { icon: ShieldCheck, title: "Fully insured", text: "Your vehicle is protected from the moment we arrive." },
                  { icon: Clock, title: "We come to you", text: "Mobile service at your home or office across Baton Rouge & surrounding areas." },
                  { icon: Check, title: "No surprises", text: "Transparent pricing and a 100% satisfaction guarantee on every detail." },
                ].map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-muted-foreground text-sm">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 sm:p-8 bg-card rounded-xl border border-border">
              <h2 className="text-2xl font-bold mb-2">Tell us about your vehicle</h2>
              <p className="text-muted-foreground mb-6">
                Fill out the form and we'll get back to you within 24 hours.
              </p>
              <InquiryForm source="get-started" />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GetStartedPage;
