import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

const serviceAreas = [
  {
    city: "Highland Road",
    anchor: "Mobile Detailing in Highland Road",
    description: "Serving the Highland Road corridor, Bocage, Kenilworth & LSU area.",
    href: "/car-detailing-highland-road-baton-rouge",
  },
  {
    city: "Shenandoah",
    anchor: "Mobile Detailing in Shenandoah",
    description: "Serving Shenandoah Estates, Siegen Lane & the Mall of Louisiana area.",
    href: "/car-detailing-shenandoah-baton-rouge",
  },
  {
    city: "Gonzales",
    anchor: "Mobile Detailing in Gonzales",
    description: "Serving Gonzales, Burnside & the Ascension Parish I-10 corridor.",
    href: "/car-detailing-gonzales-la",
  },
  {
    city: "Prairieville",
    anchor: "Mobile Detailing in Prairieville",
    description: "Serving Prairieville, Galvez & all Ascension Parish subdivisions.",
    href: "/car-detailing-prairieville-la",
  },
  {
    city: "Denham Springs",
    anchor: "Mobile Detailing in Denham Springs",
    description: "Serving Denham Springs, Juban Road & all of Livingston Parish.",
    href: "/car-detailing-denham-springs-la",
  },
  {
    city: "Walker",
    anchor: "Mobile Detailing in Walker",
    description: "Serving Walker, Highway 16 & north Livingston Parish communities.",
    href: "/car-detailing-walker-la",
  },
  {
    city: "Zachary",
    anchor: "Mobile Detailing in Zachary",
    description: "Serving Zachary, Pride Road & north Baton Rouge communities.",
    href: "/car-detailing-zachary-la",
  },
  {
    city: "Central",
    anchor: "Mobile Detailing in Central",
    description: "Serving the City of Central, Greenwell Springs & Sullivan Road.",
    href: "/car-detailing-central-la",
  },
];

export function ServiceAreasSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Service Areas
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Mobile Detailing Across the Baton Rouge Area
          </h2>
          <p className="text-lg text-muted-foreground">
            We come to you — no drop-off required. AV Detailing serves Baton Rouge
            and all surrounding communities within 30 miles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceAreas.map((area) => (
            <Link
              key={area.city}
              to={area.href}
              className="group flex flex-col gap-3 p-5 bg-background rounded-xl border border-border hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-base group-hover:text-primary transition-colors">
                  {area.anchor}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {area.description}
              </p>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Don't see your area?{" "}
          <Link to="/contact" className="text-primary underline hover:text-primary/80">
            Contact us
          </Link>{" "}
          — we likely serve your location too.
        </p>
      </div>
    </section>
  );
}
