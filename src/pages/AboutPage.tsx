import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Shield,
  Award,
  Users,
  Heart,
  Leaf,
  ArrowRight,
  Star,
  MapPin,
  Sparkles,
  CheckCircle2,
  Phone,
} from "lucide-react";
import aboutHero from "@/assets/about-hero-new.jpg";
import aboutCraft from "@/assets/about-craft.jpg";
import aboutMobile from "@/assets/about-mobile.jpg";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  JsonLd,
  aboutPageSchema,
  breadcrumbSchema,
  localBusinessSchema,
} from "@/components/seo/JsonLd";

const values = [
  {
    icon: Award,
    title: "Excellence",
    description:
      "We never cut corners. Every detail matters — from the products we use to the techniques we trust.",
  },
  {
    icon: Users,
    title: "Customer First",
    description:
      "Your satisfaction drives every decision. We listen, adapt, and deliver results that exceed expectations.",
  },
  {
    icon: Shield,
    title: "Trust & Reliability",
    description:
      "Fully insured, background-checked technicians. We treat your vehicle like it's our own.",
  },
  {
    icon: Leaf,
    title: "Eco-Conscious",
    description:
      "Biodegradable, paint-safe products whenever possible — premium results without the compromise.",
  },
];

const stats = [
  { value: "3+", label: "Years Detailing" },
  { value: "5.0★", label: "Google Rating" },
  { value: "115+", label: "5-Star Reviews" },
  { value: "100%", label: "Mobile Service" },
];

const reasons = [
  {
    title: "True Mobile Service",
    description:
      "We bring water, power, and pro-grade equipment to your driveway, office, marina, or hangar.",
  },
  {
    title: "Professional Products",
    description:
      "Only paint-safe, professional-grade chemicals and microfibers — no big-box shortcuts.",
  },
  {
    title: "Fully Insured",
    description:
      "Comprehensive liability coverage protects your vehicle from the first knock to the final wipe.",
  },
  {
    title: "Satisfaction Guaranteed",
    description:
      "Not happy? We make it right. Our 100% satisfaction guarantee means zero risk for you.",
  },
];

const AboutPage = () => {
  return (
    <Layout>
      <SEOHead
        title="About AV Detailing | Baton Rouge Mobile Detailing"
        description="Meet AV Detailing — Baton Rouge's premier mobile detailing service. Fully insured, 5-star rated craftsmanship for cars, boats, RVs & aircraft."
        path="/about"
      />
      <JsonLd data={localBusinessSchema()} />
      <JsonLd
        data={aboutPageSchema(
          "Learn about AV Detailing — Baton Rouge's premier mobile auto detailing service."
        )}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container-custom relative section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Baton Rouge, LA
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6">
                Craftsmanship that{" "}
                <span className="text-primary">comes to you.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                AV Detailing is Baton Rouge's premier mobile detailing studio —
                built on obsessive attention to detail, premium products, and a
                deep respect for the vehicles we touch.
              </p>
              <p className="text-muted-foreground mb-8 max-w-xl">
                From daily drivers to luxury exotics, boats, RVs, and aircraft
                — we deliver showroom-quality results without you ever leaving
                home.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="glow-red">
                  <Link to="/book">
                    Book Your Detail
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="tel:+12252284796">
                    <Phone className="mr-2 h-5 w-5" />
                    (225) 228-4796
                  </a>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="relative">
                <img
                  src={aboutHero}
                  alt="AV Detailing technician polishing a luxury black sedan"
                  className="rounded-2xl shadow-2xl w-full"
                  width={1280}
                  height={1280}
                  decoding="async"
                />
                <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-5 rounded-2xl shadow-xl border border-primary/30">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-current"
                      />
                    ))}
                  </div>
                  <div className="text-2xl font-bold leading-none">5.0</div>
                  <div className="text-xs opacity-90">115+ Google Reviews</div>
                </div>
                <div className="hidden md:flex absolute -top-4 -right-4 bg-card border border-border rounded-2xl px-4 py-3 shadow-xl items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">Fully Insured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-y border-border">
        <div className="container-custom py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <img
                src={aboutCraft}
                alt="Water beading on freshly ceramic-coated black paint"
                className="rounded-2xl shadow-2xl w-full"
                loading="lazy"
                width={1280}
                height={1280}
                decoding="async"
              />
              <div className="absolute -bottom-6 -right-6 bg-card border border-border rounded-2xl p-5 shadow-xl max-w-[220px]">
                <Sparkles className="h-6 w-6 text-primary mb-2" />
                <div className="text-sm font-semibold mb-1">
                  Obsessed with finish
                </div>
                <div className="text-xs text-muted-foreground">
                  Two-bucket wash, decon, polish, protect.
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                Our Story
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
                Built on craftsmanship, not shortcuts.
              </h2>
              <p className="text-muted-foreground mb-4">
                AV Detailing was founded with a simple mission: bring
                professional, showroom-quality detailing directly to our
                customers. No waiting rooms. No drop-offs. No compromise.
              </p>
              <p className="text-muted-foreground mb-6">
                We've spent years refining our process — investing in
                pro-grade tools, paint-safe chemistry, and a trained team that
                treats every vehicle like a one-of-one. The result is the kind
                of finish you usually only see at a dealership delivery bay.
              </p>
              <ul className="space-y-3">
                {[
                  "Owner-led, hands-on quality control",
                  "Premium chemistry from trusted detail brands",
                  "Specialty work: ceramic coatings & paint correction",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              What We Stand For
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground">
              These principles guide everything we do — from the first phone
              call to the final wipe-down.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="group relative bg-background border border-border rounded-2xl p-6 hover:border-primary/50 transition-all"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-xl mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <value.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                Why Choose Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
                The mobile detailing experience, elevated.
              </h2>
              <p className="text-muted-foreground mb-8">
                We bring the studio to your driveway — fully equipped,
                fully insured, and fully focused on your vehicle.
              </p>
              <ul className="space-y-5">
                {reasons.map((r, i) => (
                  <li key={r.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{r.title}</h4>
                      <p className="text-muted-foreground text-sm">
                        {r.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src={aboutMobile}
                alt="AV Detailing mobile setup at a customer's home"
                className="rounded-2xl shadow-2xl w-full"
                loading="lazy"
                width={1280}
                height={1280}
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/15 via-background to-background">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to experience the difference?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of Baton Rouge drivers who trust AV Detailing with
            their vehicles.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="glow-red">
              <Link to="/book">
                Book Your Detail
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/reviews">Read Reviews</Link>
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Learn more about us
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                to="/gallery"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Our Work
              </Link>
              <Link
                to="/services"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Our Services
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
