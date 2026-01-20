import { useState } from "react";
import { cn } from "@/lib/utils";

const beforeAfterImages = [
  {
    id: 1,
    category: "Car",
    before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
    after: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop",
    title: "Full Detail - BMW M4",
  },
  {
    id: 2,
    category: "Boat",
    before: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop",
    after: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=800&auto=format&fit=crop",
    title: "Marine Detail - 32ft Yacht",
  },
  {
    id: 3,
    category: "Car",
    before: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=80&w=800&auto=format&fit=crop",
    after: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
    title: "Paint Correction - Porsche 911",
  },
];

export function GalleryPreview() {
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeImage === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(x, 0), 100));
  };

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Our Work
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Before & After Gallery
          </h2>
          <p className="text-lg text-muted-foreground">
            See the dramatic transformations we achieve with every detail. 
            Drag the slider to reveal the results.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beforeAfterImages.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group animate-fade-in-up"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={() => {
                setActiveImage(item.id);
                setSliderPosition(50);
              }}
              onMouseLeave={() => setActiveImage(null)}
              onMouseMove={handleSliderMove}
            >
              {/* After Image (Full) */}
              <img
                src={item.after}
                alt={`${item.title} - After`}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Before Image (Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: `inset(0 ${100 - (activeImage === item.id ? sliderPosition : 50)}% 0 0)`,
                }}
              >
                <img
                  src={item.before}
                  alt={`${item.title} - Before`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* Slider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                style={{ left: `${activeImage === item.id ? sliderPosition : 50}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 12l-4 4m0 0l4 4m-4-4h16m-4-4l4-4m0 0l-4-4m4 4H4" />
                  </svg>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium">
                Before
              </div>
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                After
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
                <span className="text-xs text-primary font-medium">{item.category}</span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* View Full Gallery Link */}
        <div className="text-center mt-12">
          <a
            href="/gallery"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View Full Gallery
            <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
