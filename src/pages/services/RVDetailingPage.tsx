import { Caravan } from "lucide-react";
import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";
import rvDetailingImage from "@/assets/rv-detailing.jpg";

const RVDetailingPage = () => {
  return (
    <ServicePageTemplate
      title="RV Exterior Wash"
      location="Professional RV & Motorhome Exterior Wash in Baton Rouge, Louisiana"
      description="Expert exterior wash services for motorhomes, travel trailers, and fifth wheels of all sizes. Keep your RV looking showroom-ready with our thorough roof-to-tire cleaning."
      heroImage={rvDetailingImage}
      icon={<Caravan className="h-6 w-6 text-primary" />}
      timeEstimate="2-4 hours"
      idealFor={[
        "Pre-trip preparation",
        "Post-trip cleaning",
        "Pre-storage wash",
        "Black streak removal",
        "Roof cleaning",
        "Seasonal maintenance",
      ]}
      packages={[
        {
          name: "RV Exterior Wash",
          price: "Starting at $180",
          description: "Complete exterior cleaning",
          features: [
            "Full roof wash & rinse",
            "Body wash & hand dry",
            "Wheel & tire cleaning",
            "Tire dressing",
            "Black streak removal",
            "Exterior window cleaning",
            "Awning rinse",
            "Price based on RV length",
          ],
          popular: true,
        },
        {
          name: "RV Wash + Protection",
          price: "Starting at $280",
          description: "Wash with added protection",
          features: [
            "Everything in Exterior Wash, plus:",
            "Spray wax protection",
            "UV protectant on rubber seals",
            "Tire shine & protection",
            "Exterior trim dressing",
            "Recommended for extended outdoor storage",
          ],
        },
        {
          name: "RV Oxidation Treatment",
          price: "Starting at $400",
          description: "Restore faded fiberglass",
          features: [
            "Everything in Wash + Protection, plus:",
            "Oxidation removal compound",
            "Gel coat restoration",
            "Hand polish & seal",
            "Ideal for neglected or older RVs",
            "Restores original shine",
          ],
        },
      ]}
      addOns={[
        { name: "Roof Deep Clean & Seal", price: "Starting at $150" },
        { name: "Awning Deep Clean", price: "$75" },
        { name: "Generator Exterior Cleaning", price: "$45" },
        { name: "Slide-Out Seal Clean & Lube", price: "$65" },
        { name: "Wheel Polishing (per wheel)", price: "$25" },
        { name: "Ceramic Spray Sealant Upgrade", price: "$100" },
      ]}
      faqs={[
        {
          question: "What RV sizes do you service?",
          answer: "We service all RV types and sizes from pop-up campers to 45-foot Class A motorhomes. Pricing is based on overall length, with a minimum charge equivalent to 20 feet.",
        },
        {
          question: "Do you offer interior cleaning?",
          answer: "We specialize in exterior wash services only. This allows us to focus on delivering the best possible exterior results for your RV. For interior needs, we recommend professional RV interior cleaning specialists.",
        },
        {
          question: "Do you clean RV roofs?",
          answer: "Yes! Roof washing is included in all our exterior wash packages. We safely clean all roof types (rubber EPDM, fiberglass, aluminum) and remove dirt, debris, and buildup.",
        },
        {
          question: "How do I prepare my RV for the wash?",
          answer: "Please ensure we have access to your RV with enough clearance around all sides. Retract all slide-outs and close windows. If at a campsite or RV park, please confirm with management that mobile wash services are permitted.",
        },
        {
          question: "Can you remove oxidation from fiberglass?",
          answer: "Yes! Our RV Oxidation Treatment package includes compound polishing to remove oxidation from fiberglass and gel coat surfaces, restoring the original shine without damaging decals or graphics.",
        },
        {
          question: "What about travel trailers and fifth wheels?",
          answer: "Absolutely! We wash all types of RVs including travel trailers, fifth wheels, toy haulers, and motorhomes of all classes. The same exterior wash packages apply based on total length.",
        },
      ]}
    />
  );
};

export default RVDetailingPage;
