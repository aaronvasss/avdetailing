import { Link } from "react-router-dom";
import { Car, Caravan, Ship, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    icon: Car,
    heading: "Car Detailing in Baton Rouge, LA",
    description:
      "AV Detailing is Baton Rouge's most trusted mobile car detailing service, bringing professional-grade equipment and premium products directly to your driveway, office, or anywhere across the Baton Rouge metro.",
    link: {
      to: "/car-detailing-baton-rouge",
      text: "car detailing services in Baton Rouge",
      rest: " and find the right package for your vehicle.",
    },
  },
  {
    icon: Caravan,
    heading: "RV Detailing in Baton Rouge, LA",
    description:
      "Louisiana's relentless heat, UV exposure, and humidity are the worst conditions possible for an RV's exterior and interior. Oxidation, black streaks, mold growth, and faded fiberglass develop fast — and left untreated, they permanently damage your RV's surface and reduce its resale value.",
    link: {
      to: "/rv-detailing-baton-rouge",
      text: "RV detailing services in Baton Rouge",
      rest: " and protect your investment before Louisiana's climate does more damage.",
    },
  },
  {
    icon: Ship,
    heading: "Boat Detailing in Baton Rouge, LA",
    description:
      "Louisiana is one of the top boating states in the country, and Baton Rouge area boat owners know exactly how fast algae, oxidation, waterline scum, and UV damage can destroy a vessel's finish.",
    link: {
      to: "/boat-detailing-baton-rouge",
      text: "boat detailing services in Baton Rouge",
      rest: " and book at your convenience.",
    },
  },
  {
    icon: Plane,
    heading: "Aircraft Detailing in Baton Rouge, Lafayette & New Orleans",
    description:
      "AV Detailing serves private pilots, charter operators, and aircraft owners throughout South Louisiana with professional aircraft cleaning and detailing using only aviation-safe products and procedures.",
    link: {
      to: "/aircraft-detailing-baton-rouge",
      text: "aircraft detailing services serving Baton Rouge, Lafayette, and New Orleans",
      rest: ".",
    },
  },
];

export function ServiceContentSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        {/* Grid: 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => (
            <div
              key={service.heading}
              className={cn(
                "group rounded-xl bg-background border border-border p-4 md:p-6 card-hover",
                "flex flex-col"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="mb-4">
                <div className="p-2.5 bg-primary/10 rounded-lg inline-flex">
                  <service.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-base md:text-lg font-bold mb-3 leading-tight">
                {service.heading}
              </h2>

              {/* Description with inline link */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {service.description}{" "}
                <Link to={service.link.to} className="text-primary underline">
                  {service.link.text}
                </Link>
                {service.link.rest}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
