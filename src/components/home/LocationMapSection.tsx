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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d569051.7110736609!2d-91.26148367307754!3d30.383755354933573!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x69297093817ae99b%3A0x61fddda493a8908c!2sAV%20Detailing!5e1!3m2!1sen!2sus!4v1781853068552!5m2!1sen!2sus"
              width="100%"
              height="400"
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
