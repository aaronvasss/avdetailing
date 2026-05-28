import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { ReviewsWidgetSection } from "@/components/home/ReviewsWidgetSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ServiceContentSection } from "@/components/home/ServiceContentSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { MembershipSection } from "@/components/home/MembershipSection";
import { ServiceAreasSection } from "@/components/home/ServiceAreasSection";
import { LocationMapSection } from "@/components/home/LocationMapSection";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema } from "@/components/seo/JsonLd";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Car Detailing Service in Baton Rouge, LA | AV Detailing"
        description="Baton Rouge's #1 mobile detailing for cars, RVs, boats & aircraft. Ceramic coating, paint correction & interior detailing. Call (225) 521-6264."
        path="/"
      />
      <JsonLd data={localBusinessSchema()} />
      <HeroSection />
      <ReviewsWidgetSection />
      <ServicesSection />
      <HowItWorksSection />
      <ServiceContentSection />
      <GalleryPreview />
      <MembershipSection />
      <ServiceAreasSection />
      <LocationMapSection />
      <FAQSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
