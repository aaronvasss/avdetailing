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
        title="Mobile Detailing Service in Baton Rouge, LA | AV Detailing"
        description="Premium mobile detailing in Baton Rouge, LA. Cars, boats, RVs, and aircraft. Ceramic coating, paint correction, interior. Book online today!"
        path="/"
      />
      <JsonLd data={localBusinessSchema()} />
      <HeroSection />
      <LocalServicesSection />
      <ServicesSection />
      <MembershipSection />
      <HowItWorksSection />
      <GalleryPreview />
      <TestimonialsSection />
      <ReviewsWidgetSection />
      <LocationMapSection />
      <FAQSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
