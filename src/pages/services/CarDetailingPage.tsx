import { Car } from "lucide-react";
import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";

const CarDetailingPage = () => {
  return (
    <ServicePageTemplate
      title="Car Detailing"
      location="Premium Auto Detailing in Baton Rouge, Louisiana"
      description="Complete interior and exterior detailing services for sedans, SUVs, trucks, and sports cars. We bring showroom-quality results directly to your location."
      heroImage="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop"
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
      packages={[
        {
          name: "Essential Wash",
          price: "$79+",
          description: "Perfect for regular maintenance",
          features: [
            "Hand wash & dry",
            "Wheel & tire cleaning",
            "Window cleaning (exterior)",
            "Tire dressing",
            "Quick interior vacuum",
          ],
        },
        {
          name: "Full Detail",
          price: "$199+",
          description: "Complete interior & exterior detail",
          features: [
            "Everything in Essential, plus:",
            "Clay bar treatment",
            "Machine polish",
            "Carnauba wax protection",
            "Full interior deep clean",
            "Leather conditioning",
            "Dashboard & trim dressing",
          ],
          popular: true,
        },
        {
          name: "Signature Detail",
          price: "$349+",
          description: "The ultimate in car care",
          features: [
            "Everything in Full Detail, plus:",
            "Paint correction (1-step)",
            "6-month sealant protection",
            "Engine bay detail",
            "Headlight restoration",
            "Odor elimination",
            "Fabric/carpet shampooing",
          ],
        },
      ]}
      addOns={[
        { name: "Pet Hair Removal", price: "$35" },
        { name: "Headlight Restoration", price: "$65" },
        { name: "Engine Bay Detail", price: "$55" },
        { name: "Odor Elimination", price: "$45" },
        { name: "Ceramic Spray Sealant", price: "$75" },
        { name: "Leather Deep Condition", price: "$40" },
      ]}
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
