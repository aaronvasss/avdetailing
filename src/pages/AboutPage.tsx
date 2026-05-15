import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Award, Users, Heart, Leaf, ArrowRight } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero.jpg";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, aboutPageSchema, breadcrumbSchema, localBusinessSchema } from "@/components/seo/JsonLd";

const values = [
  {
    icon: Award,
    title: "Excellence",
    description: "We never cut corners. Every detail matters, from the products we use to the techniques we employ.",
  },
  {
    icon: Users,
    title: "Customer First",
    description: "Your satisfaction is our priority. We listen, adapt, and deliver results that exceed expectations.",
  },
  {
    icon: Shield,
    title: "Trust & Reliability",
    description: "Fully insured, background-checked team members. We treat your vehicle like it's our own.",
  },
  {
    icon: Leaf,
    title: "Eco-Conscious",
    description: "We use environmentally friendly, biodegradable products whenever possible without sacrificing quality.",
  },
];

const AboutPage = () => {
  return (
    <Layout>
      <SEOHead
        title="About Us"
        description="Learn about AV Detailing - Baton Rouge's premier mobile auto detailing service. Fully insured, 5-star rated, serving the Capital Region with premium vehicle care."
        path="/about"
      />
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={aboutPageSchema("Learn about AV Detailing - Baton Rouge's premier mobile auto detailing service.")} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      {/* Hero */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                About Us
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-6">
                Baton Rouge's Premier Mobile Detailing Service
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                AV Detailing was founded with a simple mission: to deliver professional, 
                showroom-quality mobile detailing directly to our customers. No waiting 
                rooms, no drop-offs, and no inconvenience.
              </p>
              <p className="text-muted-foreground mb-8">
                Based in Baton Rouge, Louisiana, we proudly serve vehicle owners throughout 
                the Capital Region who expect premium care for their cars, boats, RVs, 
                and aircraft. Our fully mobile service means we come to you — whether that's 
                your home, office, marina, or hangar.
              </p>
              <Button asChild className="glow-red">
                <Link to="/book">
                  Book Your Detail
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <img
                src={aboutHeroImage}
                alt="AV Detailing team at work"
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-xl">
                <div className="text-4xl font-bold">3+</div>
                <div className="text-sm">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Values</h2>
            <p className="text-lg text-muted-foreground">
              These principles guide everything we do, from our first interaction 
              to the final wipe-down.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-6">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=800&auto=format&fit=crop"
                alt="Premium detailing results"
                className="rounded-xl shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Choose AV Detailing?
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">True Mobile Service</h4>
                    <p className="text-muted-foreground text-sm">
                      We bring everything – water, power, and professional equipment – directly to your location.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Professional Products</h4>
                    <p className="text-muted-foreground text-sm">
                      We use only professional-grade, paint-safe products that deliver superior results.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Fully Insured</h4>
                    <p className="text-muted-foreground text-sm">
                      Your vehicle is protected with comprehensive liability coverage while in our care.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Satisfaction Guaranteed</h4>
                    <p className="text-muted-foreground text-sm">
                      Not happy? We'll make it right. Our 100% satisfaction guarantee means zero risk for you.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Experience the Difference?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied customers who trust AV Detailing with their vehicles.
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
          
          {/* Secondary Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Learn more about us</p>
            <div className="flex justify-center gap-6">
              <Link 
                to="/gallery" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Our Work
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
