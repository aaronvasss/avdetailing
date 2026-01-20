import { Ship } from "lucide-react";
import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";

const BoatDetailingPage = () => {
  return (
    <ServicePageTemplate
      title="Boat Detailing"
      location="Professional Boat & Marine Detailing in Baton Rouge, Louisiana"
      description="Marine-grade detailing services for boats and watercraft of all sizes. Protect your investment from salt, sun, and water damage with our specialized marine care."
      heroImage="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=2000&auto=format&fit=crop"
      icon={<Ship className="h-6 w-6 text-primary" />}
      timeEstimate="4-10 hours"
      idealFor={[
        "Seasonal boat preparation",
        "Post-trip cleaning and maintenance",
        "Gel coat oxidation removal",
        "Pre-sale preparation",
        "Teak restoration",
        "Fishing and pontoon boats",
      ]}
      packages={[
        {
          name: "Hull Wash",
          price: "$12/ft",
          description: "Exterior maintenance",
          features: [
            "Hull wash & rinse",
            "Waterline cleaning",
            "Deck wash",
            "Metal polish (rails)",
            "Vinyl wipe down",
            "Minimum 18ft",
          ],
        },
        {
          name: "Full Marine Detail",
          price: "$25/ft",
          description: "Complete interior & exterior",
          features: [
            "Everything in Hull Wash, plus:",
            "Gel coat oxidation treatment",
            "Full interior cleaning",
            "Upholstery deep clean",
            "Canvas cleaning",
            "All metal polishing",
            "UV protectant application",
            "Minimum 18ft",
          ],
          popular: true,
        },
        {
          name: "Marine Restoration",
          price: "$45/ft",
          description: "Comprehensive restoration",
          features: [
            "Everything in Full Detail, plus:",
            "Heavy oxidation removal",
            "Gel coat compounding & polish",
            "Teak cleaning & oil",
            "Bilge cleaning",
            "Marine ceramic coating",
            "Complete metal restoration",
            "Minimum 20ft",
          ],
        },
      ]}
      addOns={[
        { name: "Bottom Paint Touch-Up", price: "$150+" },
        { name: "Teak Cleaning & Oil (per sq ft)", price: "$5" },
        { name: "Canvas Waterproofing", price: "$99" },
        { name: "Trailer Detail", price: "$75" },
        { name: "Outboard Motor Detail", price: "$65" },
        { name: "Marine Ceramic Coating", price: "$300+" },
      ]}
      faqs={[
        {
          question: "Do you detail at the marina or my home?",
          answer: "We can detail at either location! We service boats at most local marinas in the Baton Rouge area, or at your home if the boat is on a trailer. Just let us know your preferred location when booking.",
        },
        {
          question: "How often should I detail my boat?",
          answer: "We recommend a full detail at least twice per year - before the boating season starts and after it ends. Regular wash-downs after each use will keep your boat looking great between details and extend the life of your gel coat.",
        },
        {
          question: "Can you remove heavy oxidation from gel coat?",
          answer: "Yes! Our Marine Restoration package includes heavy oxidation removal using specialized marine compounds. We can bring back severely faded gel coat to a like-new shine in most cases.",
        },
        {
          question: "Do you clean the bilge?",
          answer: "Bilge cleaning is included in our Marine Restoration package or can be added to any service. We use marine-safe degreasers and ensure all cleaning products are environmentally compliant.",
        },
        {
          question: "What products do you use on boats?",
          answer: "We exclusively use marine-grade products designed for the harsh saltwater and freshwater environments. Our products are safe for gel coat, vinyl, canvas, teak, and all marine metals while being environmentally friendly.",
        },
      ]}
    />
  );
};

export default BoatDetailingPage;
