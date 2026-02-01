import { ServicePageTemplate } from "@/components/services/ServicePageTemplate";
import paintCorrectionImage from "@/assets/paint-correction-service.jpg";
import polisherIcon from "@/assets/icons/orbital-polisher-icon.png";

const PaintCorrectionPage = () => {
  return (
    <ServicePageTemplate
      title="Paint Correction"
      location="Expert Paint Correction & Buffing in Baton Rouge, Louisiana"
      description="Remove swirl marks, scratches, oxidation, and water spots to restore your vehicle's paint to like-new clarity and depth. Professional multi-stage correction."
      heroImage={paintCorrectionImage}
      icon={<img src={polisherIcon} alt="Paint Correction" className="h-10 w-10 object-contain" />}
      timeEstimate="4-12 hours"
      idealFor={[
        "Vehicles with swirl marks from improper washing",
        "Faded or oxidized paint",
        "Cars with light to moderate scratches",
        "Pre-ceramic coating preparation",
        "Show car preparation",
        "Restoring neglected vehicles",
      ]}
      packages={[
        {
          name: "1-Step Polish",
          price: "$400+",
          description: "Light correction",
          features: [
            "Single-stage machine polish",
            "Removes light swirls",
            "Enhances gloss & clarity",
            "Surface decontamination",
            "Wax or sealant finish",
            "Best for well-maintained paint",
            "Same price for all vehicle types",
          ],
        },
        {
          name: "2-Step Correction",
          price: "$500+",
          description: "Moderate correction",
          features: [
            "Compound & polish stages",
            "Removes moderate swirls",
            "Eliminates water spots",
            "Restores depth & clarity",
            "Clay bar decontamination",
            "6-month sealant protection",
            "Before/after documentation",
            "Same price for all vehicle types",
          ],
          popular: true,
        },
        {
          name: "3-Step Restoration",
          price: "$650+",
          description: "Full paint restoration",
          features: [
            "Multi-stage correction process",
            "Removes heavy swirls & scratches",
            "Oxidation removal",
            "Maximum clarity restoration",
            "Wet sanding if needed",
            "Premium sealant protection",
            "Paint depth readings",
            "Detailed documentation",
            "Same price for all vehicle types",
          ],
        },
      ]}
      addOns={[
        { name: "Headlight Restoration", price: "$65" },
        { name: "Taillight Restoration", price: "$45" },
        { name: "Ceramic Coating Application", price: "$399+" },
        { name: "Wheel Face Polish", price: "$80" },
        { name: "Exhaust Tip Polish", price: "$35" },
        { name: "Chrome Trim Polish", price: "$55" },
      ]}
      faqs={[
        {
          question: "What is paint correction?",
          answer: "Paint correction is the process of using machine polishers and specialized compounds to remove surface defects in your vehicle's clear coat. This includes swirl marks, light scratches, water spots, bird dropping etching, and oxidation.",
        },
        {
          question: "Can all scratches be removed?",
          answer: "We can remove scratches that are in the clear coat layer. If a scratch has gone through the clear coat to the base coat or primer, it cannot be fully removed through correction alone and may require touch-up paint or repainting.",
        },
        {
          question: "How do I know which level I need?",
          answer: "Send us photos of your paint in direct sunlight and we'll recommend the appropriate level. Generally: 1-step for light swirls, 2-step for moderate damage, 3-step for heavily neglected or show-quality results.",
        },
        {
          question: "Will paint correction damage my clear coat?",
          answer: "When done properly, no. We use paint depth gauges to measure clear coat thickness before and during the process. We never remove more material than necessary and always leave adequate clear coat for protection.",
        },
        {
          question: "How long do the results last?",
          answer: "The correction itself is permanent - we're physically removing defects. However, new swirls and scratches can occur over time from washing and environmental factors. We recommend following up with ceramic coating and proper wash techniques to protect your corrected paint.",
        },
      ]}
    />
  );
};

export default PaintCorrectionPage;
