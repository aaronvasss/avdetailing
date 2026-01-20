import { Plane } from "lucide-react";
import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";

const AircraftDetailingPage = () => {
  return (
    <ServicePageTemplate
      title="Aircraft Detailing"
      location="Professional Aircraft Detailing in Baton Rouge, Louisiana"
      description="Precision detailing for private aircraft using aviation-approved products. Protect your investment and maintain your aircraft's appearance with our specialized services."
      heroImage="https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2000&auto=format&fit=crop"
      icon={<Plane className="h-6 w-6 text-primary" />}
      timeEstimate="4-12 hours"
      idealFor={[
        "Private aircraft owners",
        "Flight schools and training centers",
        "Corporate aviation departments",
        "Aircraft brokers (pre-sale prep)",
        "Annual inspection preparation",
        "Post-maintenance cleaning",
      ]}
      packages={[
        {
          name: "Exterior Wash",
          price: "From $299",
          description: "Exterior maintenance",
          features: [
            "Hand wash with aviation soap",
            "Bug & exhaust residue removal",
            "Window cleaning",
            "Wheel & tire cleaning",
            "Chrome & metal polish",
            "Prices vary by aircraft size",
          ],
        },
        {
          name: "Complete Detail",
          price: "From $599",
          description: "Full aircraft care",
          features: [
            "Everything in Exterior Wash, plus:",
            "Oxidation treatment",
            "Paint polish & protection",
            "Interior deep cleaning",
            "Leather conditioning",
            "Instrument panel detail",
            "Carpet & upholstery care",
            "Prices vary by aircraft size",
          ],
          popular: true,
        },
        {
          name: "Show Quality",
          price: "From $1,199",
          description: "Concours preparation",
          features: [
            "Everything in Complete Detail, plus:",
            "Multi-step paint correction",
            "Aviation ceramic coating",
            "Engine compartment detail",
            "Landing gear restoration",
            "Comprehensive metal polish",
            "Documentation photos",
            "Prices vary by aircraft size",
          ],
        },
      ]}
      addOns={[
        { name: "Engine Compartment Detail", price: "$199" },
        { name: "Propeller/Spinner Polish", price: "$99" },
        { name: "Belly Wash (heavy exhaust)", price: "$150" },
        { name: "Interior Leather Treatment", price: "$125" },
        { name: "Window Clarity Restoration", price: "$150" },
        { name: "Aircraft Cover Cleaning", price: "$75" },
      ]}
      faqs={[
        {
          question: "What aviation products do you use?",
          answer: "We exclusively use aviation-approved products that are safe for aircraft finishes, plastics, and rubber components. All products are pH-balanced and designed specifically for aircraft use, including brands like Aero Cosmetics and Aircraft Spruce approved cleaners.",
        },
        {
          question: "Do you work at hangars or FBOs?",
          answer: "Yes, we provide mobile service to hangars, FBOs, and airports throughout the Baton Rouge region. We work with airport management and follow all security and access protocols. Please provide badge access details when booking.",
        },
        {
          question: "What types of aircraft do you service?",
          answer: "We detail single-engine pistons, multi-engine aircraft, turboprops, and light jets. From Cessna 172s to Citation jets, our team has experience with a wide range of aircraft. Contact us for pricing on your specific aircraft.",
        },
        {
          question: "How often should I detail my aircraft?",
          answer: "We recommend a full exterior wash every 30-60 days for aircraft in regular use, with a complete detail every 6-12 months. Aircraft stored outside or in coastal areas may need more frequent care due to salt and UV exposure.",
        },
        {
          question: "Can you remove exhaust stains and bugs?",
          answer: "Absolutely! Our specialized aviation cleaning products are designed to safely remove exhaust soot, oil stains, bug residue, and other stubborn contaminants without damaging paint or delicate surfaces.",
        },
      ]}
    />
  );
};

export default AircraftDetailingPage;
