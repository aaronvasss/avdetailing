import { Link } from "react-router-dom";
import { Car, Caravan, Ship, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    icon: Car,
    heading: "Car Detailing in Baton Rouge, LA",
    sentence:
      "Mobile car detailing at your home or office — paint correction, System X ceramic coating, interior deep clean & more.",
    link: {
      to: "/car-detailing-baton-rouge",
      text: "car detailing services in Baton Rouge",
    },
  },
  {
    icon: Caravan,
    heading: "RV Detailing in Baton Rouge, LA",
    sentence:
      "Full mobile RV detailing including oxidation removal, roof cleaning, interior deep clean & System X ceramic coating.",
    link: {
      to: "/rv-detailing-baton-rouge",
      text: "RV detailing services in Baton Rouge",
    },
  },
  {
    icon: Ship,
    heading: "Boat Detailing in Baton Rouge, LA",
    sentence:
      "Mobile boat detailing for all vessel types — hull cleaning, gelcoat restoration & marine ceramic coating at your marina.",
    link: {
      to: "/boat-detailing-baton-rouge",
      text: "boat detailing services in Baton Rouge",
    },
  },
  {
    icon: Plane,
    heading: "Aircraft Detailing — BTR · LFT · MSY · NEW",
    sentence:
      "Professional aircraft cleaning & detailing using aviation-safe products at Baton Rouge, Lafayette & New Orleans airports.",
    link: {
      to: "/aircraft-detailing-baton-rouge",
      text: "aircraft detailing services serving Baton Rouge, Lafayette, and New Orleans",
    },
  },
];

export function ServiceContentSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {services.map((service, index) => (
            <div
              key={service.heading}
              className={cn(
                "group rounded-xl bg-background border border-border p-5 md:p-6 card-hover",
                "flex flex-col"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="mb-3">
                <div className="p-2 bg-primary/10 rounded-lg inline-flex">
                  <service.icon className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-lg font-bold mb-2 leading-tight">
                {service.heading}
              </h2>

              {/* Sentence */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-3 flex-1">
                {service.sentence}
              </p>

              {/* Editorial Link */}
              <Link
                to={service.link.to}
                className="text-sm text-primary underline inline-block"
              >
                {service.link.text}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
