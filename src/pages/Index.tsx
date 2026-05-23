import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceContentSection } from "@/components/home/ServiceContentSection";
import { ServicesSection } from "@/components/home/ServicesSection";

import { MembershipSection } from "@/components/home/MembershipSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";

import { ReviewsWidgetSection } from "@/components/home/ReviewsWidgetSection";
import { ServiceAreasSection } from "@/components/home/ServiceAreasSection";
import { LocationMapSection } from "@/components/home/LocationMapSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema } from "@/components/seo/JsonLd";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Car Detailing Service in Baton Rouge, LA | AV Detailing"
        description="AV Detailing is Baton Rouge's #1 mobile detailing service for cars, RVs, boats, and aircraft. Ceramic coating, paint correction, interior detailing & more. We come to you. Call (225) 521-6264."
        path="/"
      />
      <JsonLd data={localBusinessSchema()} />
      <HeroSection />
      <ServiceContentSection />
      <ServicesSection />
      <HowItWorksSection />
      <GalleryPreview />
      <ReviewsWidgetSection />
      <MembershipSection />
      <ServiceAreasSection />
      <LocationMapSection />
      <FAQSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
