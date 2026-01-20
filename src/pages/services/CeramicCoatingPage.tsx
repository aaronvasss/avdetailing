import { Droplets } from "lucide-react";
import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";

const CeramicCoatingPage = () => {
  return (
    <ServicePageTemplate
      title="Ceramic Coating"
      location="Professional Ceramic Coating in Baton Rouge, Louisiana"
      description="Long-lasting paint protection with professional-grade ceramic coating. Shield your vehicle from UV rays, chemicals, and environmental contaminants for years."
      heroImage="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2000&auto=format&fit=crop"
      icon={<Droplets className="h-6 w-6 text-primary" />}
      timeEstimate="1-2 days"
      idealFor={[
        "New vehicle owners wanting maximum protection",
        "Luxury and exotic car enthusiasts",
        "Anyone tired of constant waxing",
        "Vehicles with recently corrected paint",
        "Daily drivers in harsh conditions",
        "Long-term vehicle owners",
      ]}
      packages={[
        {
          name: "Ceramic Lite",
          price: "$499+",
          description: "1-year protection",
          features: [
            "Single-layer ceramic coating",
            "Surface decontamination",
            "Light polish prep",
            "Wheel face coating",
            "1-year durability",
            "Hydrophobic finish",
          ],
        },
        {
          name: "Ceramic Pro",
          price: "$899+",
          description: "3-year protection",
          features: [
            "Dual-layer ceramic coating",
            "Full paint correction (1-step)",
            "Wheel & caliper coating",
            "Glass coating (windshield)",
            "Trim restoration",
            "3-year durability",
            "Enhanced gloss & depth",
          ],
          popular: true,
        },
        {
          name: "Ceramic Elite",
          price: "$1,499+",
          description: "5+ year protection",
          features: [
            "Multi-layer ceramic system",
            "Full paint correction (2-step)",
            "Complete wheel coating",
            "All glass coating",
            "Leather/interior coating",
            "Plastic & trim coating",
            "5+ year durability",
            "Annual maintenance included",
          ],
        },
      ]}
      addOns={[
        { name: "Additional Paint Correction Step", price: "$200" },
        { name: "Leather Interior Coating", price: "$199" },
        { name: "Fabric Protection Coating", price: "$149" },
        { name: "Wheel Off & Coat (all surfaces)", price: "$250" },
        { name: "Engine Bay Coating", price: "$150" },
        { name: "PPF Edge Sealing", price: "$100" },
      ]}
      faqs={[
        {
          question: "What is ceramic coating?",
          answer: "Ceramic coating is a liquid polymer that chemically bonds with your vehicle's paint, creating a permanent or semi-permanent layer of protection. It provides superior resistance to chemicals, UV rays, minor scratches, and makes cleaning much easier with its hydrophobic properties.",
        },
        {
          question: "How long does ceramic coating last?",
          answer: "Depending on the package, our ceramic coatings last 1-5+ years. The Ceramic Elite package includes annual maintenance to maximize longevity. Proper care and avoiding harsh chemicals will extend the coating's life.",
        },
        {
          question: "Do I need paint correction before ceramic coating?",
          answer: "We recommend paint correction before coating because the ceramic locks in whatever is on your paint - good or bad. Light swirls and scratches should be removed first for the best results. Our Pro and Elite packages include paint correction.",
        },
        {
          question: "Can I wash my car after ceramic coating?",
          answer: "Yes, but we recommend waiting 7 days after application for the coating to fully cure. After that, hand washing with pH-neutral soap is recommended. Avoid automatic car washes with brushes that can mar the surface.",
        },
        {
          question: "Is ceramic coating worth it?",
          answer: "Absolutely. While the upfront cost is higher than traditional waxing, you'll save money and time over the coating's lifespan. No more monthly waxing, easier cleaning, and superior protection against Louisiana's harsh sun and humidity.",
        },
      ]}
    />
  );
};

export default CeramicCoatingPage;
