import { Caravan } from "lucide-react";
import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";

const RVDetailingPage = () => {
  return (
    <ServicePageTemplate
      title="RV Detailing"
      location="Professional RV & Motorhome Detailing in Baton Rouge, Louisiana"
      description="Comprehensive detailing services for motorhomes, travel trailers, and fifth wheels of all sizes. Protect your home on wheels from the elements."
      heroImage="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2000&auto=format&fit=crop"
      icon={<Caravan className="h-6 w-6 text-primary" />}
      timeEstimate="6-12 hours"
      idealFor={[
        "Pre-trip preparation",
        "Post-season storage prep",
        "Oxidation and streak removal",
        "Roof cleaning and treatment",
        "Pre-sale preparation",
        "New RV protection packages",
      ]}
      packages={[
        {
          name: "RV Wash",
          price: "$8/ft",
          description: "Exterior maintenance",
          features: [
            "Full exterior wash",
            "Wheel & tire cleaning",
            "Awning cleaning",
            "Window cleaning",
            "Black streak removal",
            "Tire dressing",
            "Minimum 20ft",
          ],
        },
        {
          name: "RV Full Detail",
          price: "$15/ft",
          description: "Complete care package",
          features: [
            "Everything in RV Wash, plus:",
            "Oxidation treatment",
            "Wax protection",
            "Interior deep clean",
            "Upholstery cleaning",
            "Kitchen & bathroom sanitize",
            "Dashboard conditioning",
            "Minimum 20ft",
          ],
          popular: true,
        },
        {
          name: "RV Restoration",
          price: "$25/ft",
          description: "Full restoration package",
          features: [
            "Everything in Full Detail, plus:",
            "Heavy oxidation removal",
            "Gel coat/fiberglass compound",
            "Roof cleaning & treatment",
            "Seal inspection & treatment",
            "Metal polishing",
            "RV ceramic coating",
            "Generator cleaning",
            "Minimum 22ft",
          ],
        },
      ]}
      addOns={[
        { name: "Roof Deep Clean & Seal", price: "$199" },
        { name: "Generator Cleaning", price: "$75" },
        { name: "Holding Tank Treatment", price: "$45" },
        { name: "Slide-Out Seal Clean & Lube", price: "$65" },
        { name: "Leather Deep Condition", price: "$99" },
        { name: "Awning Deep Clean & Protect", price: "$85" },
      ]}
      faqs={[
        {
          question: "Can you detail RVs of any size?",
          answer: "Yes! We service everything from pop-up campers to 45-foot Class A motorhomes. Our mobile equipment is designed to handle vehicles of all sizes. Pricing is based on length with minimums for each package.",
        },
        {
          question: "Do you clean RV roofs?",
          answer: "Roof cleaning and treatment is included in our RV Restoration package or can be added to any service. We clean all roof types (rubber, fiberglass, aluminum) and apply appropriate protectants to prevent UV damage and extend roof life.",
        },
        {
          question: "How do I prepare my RV for detailing?",
          answer: "Please remove personal items and food from interior spaces. Ensure we have access to your location with enough clearance for our equipment. If at a campsite, please confirm with management that mobile detailing is permitted.",
        },
        {
          question: "Can you remove oxidation from fiberglass?",
          answer: "Absolutely! Our RV Restoration package includes heavy oxidation removal from fiberglass and gel coat surfaces. We use specialized RV compounds that safely restore the shine without damaging decals or graphics.",
        },
        {
          question: "Do you service travel trailers and fifth wheels?",
          answer: "Yes, we detail all types of RVs including travel trailers, fifth wheels, toy haulers, and motorhomes of all classes. The same pricing and packages apply based on total length.",
        },
      ]}
    />
  );
};

export default RVDetailingPage;
