import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Check, Clock, ArrowRight, Phone, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { DepositBookingModal } from "@/components/booking/DepositBookingModal";

interface ServicePageProps {
  title: string;
  location: string;
  description: string;
  heroImage: string;
  idealFor: string[];
  timeEstimate: string;
  packages: {
    name: string;
    price: string;
    description: string;
    features: string[];
    popular?: boolean;
  }[];
  addOns: { name: string; price: string }[];
  faqs: { question: string; answer: string }[];
  icon: ReactNode;
  /** If true, uses the $100 deposit booking flow instead of standard booking */
  depositFlow?: boolean;
}

export function ServicePageTemplate({
  title,
  location,
  description,
  heroImage,
  idealFor,
  timeEstimate,
  packages,
  addOns,
  faqs,
  icon,
  depositFlow = false,
}: ServicePageProps) {
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  const bookAction = depositFlow
    ? { onClick: () => setDepositModalOpen(true) }
    : { asChild: true as const };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${heroImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
        </div>

        <div className="container-custom relative z-10 py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
              <span className="text-sm text-primary font-medium uppercase tracking-wider">
                Professional Service
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              {title}
            </h1>
            <p className="text-xl text-primary font-medium mb-4">{location}</p>
            <p className="text-lg text-muted-foreground mb-8">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {depositFlow ? (
                <Button size="lg" className="glow-red" onClick={() => setDepositModalOpen(true)}>
                  Book Now — $100 Deposit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button asChild size="lg" className="glow-red">
                  <Link to="/book">
                    Book Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg">
                <a href="tel:+12255216264">
                  <Phone className="mr-2 h-5 w-5" />
                  Get a Quote
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-8 bg-card border-y border-border">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm text-muted-foreground">Time Estimate</span>
                <p className="font-medium">{timeEstimate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm text-muted-foreground">Service Type</span>
                <p className="font-medium">Mobile Service</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm text-muted-foreground">Satisfaction</span>
                <p className="font-medium">100% Guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages - Appears First */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
            Choose Your Package
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Select the level of detail that's right for your vehicle. All packages
            include our satisfaction guarantee.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {packages.map((pkg, index) => (
              <div
                key={pkg.name}
                className={cn(
                  "relative rounded-xl p-6 flex flex-col",
                  pkg.popular
                    ? "bg-gradient-to-b from-primary/10 to-card border-2 border-primary"
                    : "bg-card border border-border"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold mb-2">{pkg.price}</div>
                <p className="text-sm text-muted-foreground mb-6">
                  {pkg.description}
                </p>
                <ul className="space-y-3 mb-6 flex-grow">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button
                    asChild
                    className={cn("w-full", pkg.popular && "glow-red")}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    <Link to="/book">Book This Package</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For Section - Appears Second */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
              Ideal For
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {idealFor.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border"
                >
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      {addOns.length > 0 && (
        <section className="section-padding bg-background">
          <div className="container-custom">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
              Optional Add-Ons
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {addOns.map((addon, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                >
                  <span>{addon.name}</span>
                  <span className="text-primary font-semibold">{addon.price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background border border-border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline hover:text-primary py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book your {title.toLowerCase()} today and experience the AV Detailing
            difference. Same-week availability for most appointments.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="glow-red">
              <Link to="/book">
                Book Your Detail
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="tel:+12255216264">
                <Phone className="mr-2 h-5 w-5" />
                Call (225) 521-6264
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
