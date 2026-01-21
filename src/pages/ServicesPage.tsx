import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Car, Droplets, Disc3, Ship, Caravan, Plane, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Car,
    title: "Car Detailing",
    description: "Complete interior and exterior detailing for sedans, SUVs, and trucks. From quick washes to full restorations.",
    href: "/services/car-detailing",
    startingPrice: "$79",
  },
  {
    icon: Droplets,
    title: "Ceramic Coating",
    description: "Long-lasting paint protection with professional-grade ceramic coating. 1-5+ year protection packages.",
    href: "/services/ceramic-coating",
    startingPrice: "$499",
  },
  {
    icon: Disc3,
    title: "Paint Correction",
    description: "Remove swirls, scratches, and oxidation to restore your paint's clarity and depth.",
    href: "/services/paint-correction",
    startingPrice: "$249",
  },
  {
    icon: Ship,
    title: "Boat Detailing",
    description: "Marine-grade detailing to protect your vessel from salt, sun, and water damage.",
    href: "/services/boat-detailing",
    startingPrice: "$12/ft",
  },
  {
    icon: Caravan,
    title: "RV Detailing",
    description: "Comprehensive detailing for motorhomes and travel trailers of all sizes.",
    href: "/services/rv-detailing",
    startingPrice: "$8/ft",
  },
  {
    icon: Plane,
    title: "Aircraft Detailing",
    description: "Precision detailing for private aircraft with aviation-approved products.",
    href: "/services/aircraft-detailing",
    startingPrice: "$299",
  },
];

const ServicesPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Our Services
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Professional Detailing for Every Vehicle
            </h1>
            <p className="text-lg text-muted-foreground">
              From daily drivers to luxury aircraft, we deliver showroom-quality results with 
              professional-grade products and techniques. Mobile service throughout Baton Rouge.
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="space-y-6">
            {services.map((service, index) => (
              <Link
                key={service.title}
                to={service.href}
                className="group flex flex-col md:flex-row md:items-center gap-6 p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="p-4 bg-primary/10 rounded-xl shrink-0 w-fit">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h2>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Starting at</span>
                    <div className="text-2xl font-bold text-primary">{service.startingPrice}</div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Not Sure Which Service You Need?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contact us for a free consultation. We'll assess your vehicle and recommend 
            the best service package for your needs and budget.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="glow-red">
              <Link to="/contact">
                Get a Free Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="tel:+12255551234">Call (225) 555-1234</a>
            </Button>
          </div>
          
          {/* Secondary Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Explore more</p>
            <div className="flex justify-center gap-6">
              <Link 
                to="/gallery" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Our Gallery
              </Link>
              <Link 
                to="/contact" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicesPage;
