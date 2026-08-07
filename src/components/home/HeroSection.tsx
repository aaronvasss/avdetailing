import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Award } from "lucide-react";
import heroAvif640 from "@/assets/optimized/hero-bg-640.avif";
import heroAvif1024 from "@/assets/optimized/hero-bg-1024.avif";
import heroAvif1600 from "@/assets/optimized/hero-bg-1600.avif";
import heroAvif2000 from "@/assets/optimized/hero-bg-2000.avif";
import heroWebp640 from "@/assets/optimized/hero-bg-640.webp";
import heroWebp1024 from "@/assets/optimized/hero-bg-1024.webp";
import heroWebp1600 from "@/assets/optimized/hero-bg-1600.webp";
import heroWebp2000 from "@/assets/optimized/hero-bg-2000.webp";

const heroAvifSrcSet = [
  `${heroAvif640} 640w`,
  `${heroAvif1024} 1024w`,
  `${heroAvif1600} 1600w`,
  `${heroAvif2000} 2000w`,
].join(", ");

const heroWebpSrcSet = [
  `${heroWebp640} 640w`,
  `${heroWebp1024} 1024w`,
  `${heroWebp1600} 1600w`,
  `${heroWebp2000} 2000w`,
].join(", ");

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <picture>
          <source type="image/avif" srcSet={heroAvifSrcSet} sizes="100vw" />
          <source type="image/webp" srcSet={heroWebpSrcSet} sizes="100vw" />
          <img
            src={heroWebp1600}
            alt="Premium mobile car detailing service in Baton Rouge Louisiana"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width={2000}
            height={2757}
          />
        </picture>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>


      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Professional Mobile Detailing in Baton Rouge
            </span>
          </div>

          {/* Headline - Single H1 */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6 animate-fade-in-up">
            Car <span className="text-primary">Detailing</span> in Baton Rouge
            <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 font-semibold text-muted-foreground">Mobile — we come to you</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Professional mobile car detailing in Baton Rouge — System X ceramic coating, paint correction, interior detailing and more, booked 24/7. We come to you across Highland Road, Shenandoah, Gonzales, Denham Springs, Perkins & Prairieville.
          </p>


          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button asChild size="lg" className="glow-red text-lg h-14 px-8">
              <Link to="/book">
                Book Your Detail
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg h-14 px-8"
              onClick={() =>
                document
                  .getElementById("services")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Our Services
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>Fully Insured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span>Same-Week Availability</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-5 w-5 text-primary" />
              <span>Detail-Obsessed Work</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
