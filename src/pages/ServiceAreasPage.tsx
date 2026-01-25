import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Check } from "lucide-react";

const primaryAreas = [
  {
    name: "Baton Rouge",
    description: "Louisiana's capital and our home base. Same-day availability for most services.",
    zip: "70801-70899",
  },
  {
    name: "Prairieville",
    description: "Serving Ascension Parish with premium mobile detailing services.",
    zip: "70769",
  },
  {
    name: "Gonzales",
    description: "Quality detailing for the Jambalaya Capital of the World.",
    zip: "70737",
  },
  {
    name: "Denham Springs",
    description: "Livingston Parish's largest city, fully covered by our mobile service.",
    zip: "70706, 70726",
  },
  {
    name: "Central",
    description: "One of Louisiana's newest cities, we're proud to serve the community.",
    zip: "70714, 70739, 70770",
  },
  {
    name: "Zachary",
    description: "Award-winning city with award-winning detailing service.",
    zip: "70791",
  },
];

const additionalAreas = [
  "Baker",
  "Port Allen",
  "Addis",
  "Plaquemine",
  "St. Gabriel",
  "Geismar",
  "Dutchtown",
  "Walker",
  "Watson",
  "St. Francisville",
  "New Roads",
  "Livingston",
];

const ServiceAreasPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Service Areas
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Mobile Detailing Across Baton Rouge
            </h1>
            <p className="text-lg text-muted-foreground">
              We bring premium detailing services directly to your location throughout 
              the greater Baton Rouge area. No need to drive anywhere – we come to you!
            </p>
          </div>
        </div>
      </section>

      {/* Primary Service Areas */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Primary Service Areas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {primaryAreas.map((area) => (
              <div
                key={area.name}
                className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{area.name}</h3>
                </div>
                <p className="text-muted-foreground mb-4">{area.description}</p>
                <p className="text-sm text-muted-foreground">ZIP: {area.zip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Areas */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">
            Additional Service Areas
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            We also serve these surrounding communities. Travel fees may apply for 
            locations outside our primary service area.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {additionalAreas.map((area) => (
              <div
                key={area}
                className="flex items-center gap-2 p-3 bg-background rounded-lg"
              >
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Coverage</h2>
            <p className="text-muted-foreground mb-8">
              We provide mobile detailing services within approximately 30 miles of 
              downtown Baton Rouge. Don't see your area listed? Contact us – we may 
              still be able to serve you!
            </p>
            <div className="aspect-video bg-card rounded-xl border border-border flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Interactive Map Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  Call us to confirm service availability in your area
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Book in Your Area?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Enter your address during booking and we'll confirm service availability 
            and provide an accurate quote.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="glow-red">
              <Link to="/book">
                Book Your Detail
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="tel:+12255216264">Call (225) 521-6264</a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServiceAreasPage;
