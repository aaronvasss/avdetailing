import { MapPin, Phone } from "lucide-react";

export function LocationMapSection() {
  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Find Us in <span className="text-primary">Baton Rouge</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AV Detailing Baton Rouge — proudly serving Baton Rouge, LA and the surrounding area.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe
              title="AV Detailing Baton Rouge on Google Maps"
              src="https://www.google.com/maps?q=AV+Detailing+Baton+Rouge,+LA&output=embed"
              width="100%"
              height="450"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="space-y-6 bg-card rounded-2xl p-6 border border-border">
            <div>
              <h3 className="text-xl font-semibold mb-2">AV Detailing Baton Rouge</h3>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Baton Rouge, LA</span>
              </div>
            </div>
            <div>
              <a
                href="tel:+12255216264"
                className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium">(225) 521-6264</span>
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Mobile service — we come to you across Baton Rouge, Denham Springs,
              Prairieville, Gonzales, Walker, and surrounding areas within 30 miles.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
