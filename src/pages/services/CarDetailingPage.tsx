import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";
import carDetailingImage from "@/assets/car-detailing-service.jpg";
import { supabase } from "@/integrations/supabase/client";

const CAR_SERVICE_ID = "3763f8d6-9045-45d5-99cd-cb878bdceeb8";

// Per-package feature lists (descriptive content stays static; prices come from DB)
const PACKAGE_FEATURES: Record<string, { description: string; features: string[]; popular?: boolean }> = {
  "exterior-only": {
    description: "Quick exterior refresh",
    features: [
      "Hand wash & dry",
      "Wheels & tires cleaned",
      "Tire shine",
      "Exterior windows",
    ],
  },
  basic: {
    description: "Perfect for regular maintenance",
    features: [
      "Hand wash & dry",
      "Wheel & tire cleaning",
      "Window cleaning (exterior)",
      "Tire dressing",
      "Quick interior vacuum",
    ],
  },
  silver: {
    description: "Complete interior & exterior detail",
    features: [
      "Everything in Basic, plus:",
      "Full interior deep clean",
      "Dashboard & trim dressing",
    ],
    popular: true,
  },
  gold: {
    description: "The ultimate in car care",
    features: [
      "Everything in Silver, plus:",
      "2-month sealant protection",
      "Engine bay detail",
      "Odor elimination",
      "Seat shampooing (fabric or leather)",
    ],
  },
};

const FALLBACK_PACKAGES = [
  { name: "Exterior Only", price: "Price unavailable — contact admin", description: PACKAGE_FEATURES["exterior-only"].description, features: PACKAGE_FEATURES["exterior-only"].features },
  { name: "Basic Package", price: "Price unavailable — contact admin", description: PACKAGE_FEATURES.basic.description, features: PACKAGE_FEATURES.basic.features },
  { name: "Silver Package", price: "Price unavailable — contact admin", description: PACKAGE_FEATURES.silver.description, features: PACKAGE_FEATURES.silver.features, popular: true },
  { name: "Gold Package", price: "Price unavailable — contact admin", description: PACKAGE_FEATURES.gold.description, features: PACKAGE_FEATURES.gold.features },
];

interface DynPackage {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

interface DynAddOn {
  name: string;
  price: string;
}

const CarDetailingPage = () => {
  const [packages, setPackages] = useState<DynPackage[]>(FALLBACK_PACKAGES);
  const [addOns, setAddOns] = useState<DynAddOn[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pkgRes, addRes] = await Promise.all([
          supabase
            .from("service_packages")
            .select("slug, name, price, sort_order")
            .eq("service_id", CAR_SERVICE_ID)
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("service_add_ons")
            .select("name, price")
            .eq("is_active", true)
            .order("price", { ascending: true }),
        ]);
        if (cancelled) return;
        if (pkgRes.error || addRes.error) return;

        // Group packages by slug, take the lowest price as "starting at"
        const grouped = new Map<string, { name: string; minPrice: number; sort_order: number }>();
        for (const r of pkgRes.data || []) {
          const existing = grouped.get(r.slug);
          const p = Number(r.price);
          if (!existing || p < existing.minPrice) {
            grouped.set(r.slug, { name: r.name, minPrice: p, sort_order: r.sort_order });
          }
        }
        const built: DynPackage[] = Array.from(grouped.entries())
          .sort((a, b) => a[1].sort_order - b[1].sort_order)
          .map(([slug, info]) => {
            const meta = PACKAGE_FEATURES[slug] || { description: "", features: [] };
            return {
              name: info.name,
              price: `$${Math.round(info.minPrice)}+`,
              description: meta.description,
              features: meta.features,
              popular: meta.popular,
            };
          });
        if (built.length > 0) setPackages(built);

        setAddOns(
          (addRes.data || []).map(a => ({
            name: a.name,
            price: `$${Math.round(Number(a.price))}`,
          }))
        );
      } catch (err) {
        console.error("Failed to load car detailing pricing:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ServicePageTemplate
      noIndex
      title="Car Detailing"
      location="Premium Auto Detailing in Baton Rouge, Louisiana"
      description="Complete interior and exterior detailing services for sedans, SUVs, trucks, and sports cars. We bring showroom-quality results directly to your location."
      heroImage={carDetailingImage}
      icon={<Car className="h-6 w-6 text-primary" />}
      timeEstimate="2-6 hours"
      idealFor={[
        "Daily drivers needing a refresh",
        "Pre-sale vehicle preparation",
        "New car protection packages",
        "Luxury and exotic vehicles",
        "Fleet vehicles and company cars",
        "Special occasions and events",
      ]}
      packages={packages}
      addOns={addOns}
      faqs={[
        {
          question: "How long does a full car detail take?",
          answer: "A full detail typically takes 3-5 hours depending on the size and condition of your vehicle. Our Signature Detail may take 5-6 hours for thorough paint correction. We'll provide a time estimate when you book.",
        },
        {
          question: "Do I need to provide water or electricity?",
          answer: "No, our mobile unit is fully self-contained with water tanks and generators. We bring everything needed. Just provide access to your vehicle and we handle the rest.",
        },
        {
          question: "Can you remove scratches from my paint?",
          answer: "Our Signature Detail includes 1-step paint correction that removes light scratches and swirl marks. For deeper scratches, we recommend our dedicated Paint Correction service for multi-step correction.",
        },
        {
          question: "Is your process safe for all paint types?",
          answer: "Yes, we use pH-balanced, paint-safe products and proper techniques for all finishes including clear coats, matte finishes, and ceramic-coated vehicles. We adjust our approach based on your vehicle's specific needs.",
        },
        {
          question: "How often should I get my car detailed?",
          answer: "We recommend a full detail every 3-4 months, with maintenance washes in between. Our membership plans offer convenient bi-weekly or monthly maintenance to keep your vehicle looking its best year-round.",
        },
      ]}
    />
  );
};

export default CarDetailingPage;
