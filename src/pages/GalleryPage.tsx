import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import carDetailBefore from "@/assets/gallery/car-detail-before.jpg";
import carDetailAfter from "@/assets/gallery/car-detail-after.jpg";
import boatDetailBefore from "@/assets/gallery/boat-detail-before.jpg";
import boatDetailAfter from "@/assets/gallery/boat-detail-after.jpg";
import paintCorrectionBefore from "@/assets/gallery/paint-correction-before.jpg";
import paintCorrectionAfter from "@/assets/gallery/paint-correction-after.jpg";

const categories = ["All", "Cars", "Boats", "RVs", "Aircraft"];

const galleryItems = [
  { id: 1, category: "Cars", before: carDetailBefore, after: carDetailAfter, title: "BMW 5 Series Full Detail", service: "Signature Detail" },
  { id: 2, category: "Cars", before: paintCorrectionBefore, after: paintCorrectionAfter, title: "Porsche 911 Paint Correction", service: "2-Step Correction" },
  { id: 3, category: "Boats", before: boatDetailBefore, after: boatDetailAfter, title: "Yacht Marine Restoration", service: "Full Marine Detail" },
];

const GalleryPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const filteredItems = activeCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Our Work
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Before & After Gallery
            </h1>
            <p className="text-lg text-muted-foreground">
              See the dramatic transformations we achieve. Hover over any image to see the before/after.
            </p>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 bg-background border-b border-border sticky top-16 lg:top-20 z-40">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* After (shown by default) */}
                <img
                  src={item.after}
                  alt={`${item.title} - After`}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                    hoveredItem === item.id ? "opacity-0" : "opacity-100"
                  )}
                />
                {/* Before (shown on hover) */}
                <img
                  src={item.before}
                  alt={`${item.title} - Before`}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  )}
                />

                {/* Labels */}
                <div className={cn(
                  "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium transition-all",
                  hoveredItem === item.id 
                    ? "bg-background/80 text-foreground" 
                    : "bg-primary text-primary-foreground"
                )}>
                  {hoveredItem === item.id ? "Before" : "After"}
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
                  <span className="text-xs text-primary font-medium">{item.category}</span>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.service}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Want Results Like These?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book your detail today and see the transformation for yourself.
          </p>
          <Button asChild size="lg" className="glow-red">
            <Link to="/book">
              Book Your Detail
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default GalleryPage;
