import { Link } from "react-router-dom";

export function ServiceContentSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom max-w-4xl space-y-16 md:space-y-24">

        {/* H2 #1 — Car Detailing */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Car Detailing in Baton Rouge, LA
          </h2>
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
            AV Detailing is Baton Rouge&apos;s most trusted mobile car detailing service, bringing professional-grade equipment and premium products directly to your driveway, office, or anywhere across the Baton Rouge metro. Whether your vehicle needs a quick refresh or a complete transformation with System X ceramic coating, paint correction, deep interior cleaning, or headlight restoration, we handle every detail on-site — no drop-off required. We serve Highland Road, Shenandoah, Gonzales, Central Baton Rouge, Prairieville, Walker, and surrounding areas. Explore our complete{" "}
            <Link to="/car-detailing-baton-rouge" className="text-primary underline">
              car detailing services in Baton Rouge
            </Link>{" "}
            and find the right package for your vehicle.
          </p>
        </div>

        {/* H2 #2 — RV Detailing */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            RV Detailing in Baton Rouge, LA
          </h2>
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
            Louisiana&apos;s relentless heat, UV exposure, and humidity are the worst conditions possible for an RV&apos;s exterior and interior. Oxidation, black streaks, mold growth, and faded fiberglass develop fast — and left untreated, they permanently damage your RV&apos;s surface and reduce its resale value. AV Detailing provides fully mobile RV detailing including exterior wash, oxidation removal, roof cleaning, interior deep clean, and System X ceramic coating — all at your location across Baton Rouge and surrounding parishes. Learn more about our{" "}
            <Link to="/rv-detailing-baton-rouge" className="text-primary underline">
              RV detailing services in Baton Rouge
            </Link>{" "}
            and protect your investment before Louisiana&apos;s climate does more damage.
          </p>
        </div>

        {/* H2 #3 — Boat Detailing */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Boat Detailing in Baton Rouge, LA
          </h2>
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
            Louisiana is one of the top boating states in the country, and Baton Rouge area boat owners know exactly how fast algae, oxidation, waterline scum, and UV damage can destroy a vessel&apos;s finish. Whether you&apos;re on the Mississippi, False River, or any of the lakes and waterways across the parish, AV Detailing provides fully mobile boat detailing — hull cleaning, gelcoat restoration, marine ceramic coating, and upholstery cleaning — all performed at your marina, dock, or driveway. See everything included in our{" "}
            <Link to="/boat-detailing-baton-rouge" className="text-primary underline">
              boat detailing services in Baton Rouge
            </Link>{" "}
            and book at your convenience.
          </p>
        </div>

        {/* H2 #4 — Aircraft Detailing */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Aircraft Detailing in Baton Rouge, Lafayette &amp; New Orleans
          </h2>
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
            AV Detailing serves private pilots, charter operators, and aircraft owners throughout South Louisiana with professional aircraft cleaning and detailing using only aviation-safe products and procedures. We service aircraft at Baton Rouge Metropolitan Airport (BTR), Lafayette Regional Airport (LFT), Louis Armstrong New Orleans International (MSY), and New Orleans Lakefront Airport (NEW). For pilots and aircraft operators who demand the same precision in their aircraft&apos;s presentation as they do in their flying, discover our{" "}
            <Link to="/aircraft-detailing-baton-rouge" className="text-primary underline">
              aircraft detailing services serving Baton Rouge, Lafayette, and New Orleans
            </Link>
            .
          </p>
        </div>

      </div>
    </section>
  );
}
