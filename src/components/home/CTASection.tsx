import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export function CTASection() {
  const { settings } = useBusinessSettings();

  return (
    <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready for a{" "}
            <span className="text-primary">Showroom Shine</span>?
          </h2>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Book your mobile detail today and experience the convenience of professional 
            detailing at your doorstep. Same-week availability for most services.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button asChild size="lg" className="glow-red-lg text-lg h-14 px-10">
              <Link to="/book">
                Book Your Detail
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg h-14 px-10">
              <a href={`tel:${settings.publicBusinessPhoneE164}`}>
                <Phone className="mr-2 h-5 w-5" />
                Call {settings.publicBusinessPhone}
              </a>
            </Button>
          </div>

          {/* Trust Note */}
          <p className="text-sm text-muted-foreground">
            ✓ No deposit required for most services &nbsp;•&nbsp; 
            ✓ 100% satisfaction guaranteed &nbsp;•&nbsp; 
            ✓ Free estimates
          </p>
        </div>
      </div>
    </section>
  );
}
