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
import { lazy, Suspense } from "react";
import { DeferUntilVisible } from "@/components/common/DeferUntilVisible";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema } from "@/components/seo/JsonLd";

// The inquiry form talks to the backend; load it only when the visitor
// actually scrolls to it so the homepage's first load stays light.
const InquirySection = lazy(() =>
  import("@/components/home/InquirySection").then((m) => ({ default: m.InquirySection })),
);

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Mobile Car Detailing in Baton Rouge — AV Detailing"
        description="Mobile detailing in Baton Rouge — we come to you. Ceramic coating, paint correction, interior detailing for cars, RVs, boats. (225) 521-6264."

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
      <DeferUntilVisible minHeight={600}>
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <InquirySection source="homepage" />
        </Suspense>
      </DeferUntilVisible>
      <CTASection />
    </Layout>
  );
};

export default Index;
