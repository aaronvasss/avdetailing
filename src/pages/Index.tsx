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
        title="AV Detailing | Premium Mobile Auto Detailing in Baton Rouge"
        description="Professional mobile auto detailing in Baton Rouge, LA. Car, boat, RV & aircraft detailing with ceramic coating and paint correction. 5-star rated, fully insured."
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
