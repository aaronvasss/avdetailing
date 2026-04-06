import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { MembershipSection } from "@/components/home/MembershipSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema } from "@/components/seo/JsonLd";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="AV Detailing | Mobile Auto, Boat & Aircraft Detailing in Baton Rouge, LA"
        description="AV Detailing offers premium mobile detailing in Baton Rouge and across Louisiana. Cars, RVs, boats, and aircraft. Ceramic coating, paint correction, and interior detailing. Book online today."
        path="/"
      />
      <JsonLd data={localBusinessSchema()} />
      <HeroSection />
      <ServicesSection />
      <MembershipSection />
      <HowItWorksSection />
      <GalleryPreview />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
