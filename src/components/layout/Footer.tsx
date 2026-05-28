import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5A2.89 2.89 0 0 1 6.6 15.17a2.89 2.89 0 0 1 2.88-2.89c.3 0 .6.05.88.13V9.08a6.37 6.37 0 0 0-.88-.06A6.18 6.18 0 0 0 3.22 15.17a6.18 6.18 0 0 0 6.17 6.17 6.18 6.18 0 0 0 6.17-6.17V9.03a8.15 8.15 0 0 0 4.78 1.53V7.11a4.85 4.85 0 0 1-.75-.42z"/>
    </svg>
  );
}

const services = [
  { name: "Car Detailing", href: "/car-detailing-baton-rouge" },
  { name: "Ceramic Coating", href: "/ceramic-coating-baton-rouge" },
  { name: "Paint Correction", href: "/paint-correction-baton-rouge" },
  { name: "Boat Detailing", href: "/boat-detailing-baton-rouge" },
  { name: "RV Detailing", href: "/rv-detailing-baton-rouge" },
  { name: "Aircraft Detailing", href: "/aircraft-detailing-baton-rouge" },
];

const company = [
  { name: "About Us", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Reviews", href: "/reviews" },
  { name: "Service Areas", href: "/service-areas" },
  { name: "Contact", href: "/contact" },
];

const locationLinks = [
  { name: "Highland Road", href: "/car-detailing-highland-road-baton-rouge" },
  { name: "Shenandoah", href: "/car-detailing-shenandoah-baton-rouge" },
  { name: "Gonzales", href: "/car-detailing-gonzales-la" },
  { name: "Prairieville", href: "/car-detailing-prairieville-la" },
  { name: "Denham Springs", href: "/car-detailing-denham-springs-la" },
  { name: "Walker", href: "/car-detailing-walker-la" },
  { name: "Zachary", href: "/car-detailing-zachary-la" },
  { name: "Central, LA", href: "/car-detailing-central-la" },
];

const specialtyLinks = [
  { name: "Aircraft Cleaning", href: "/aircraft-cleaning-baton-rouge" },
  { name: "Aircraft Interior Detail", href: "/aircraft-interior-detailing-baton-rouge" },
  { name: "Aircraft Paint Protection", href: "/aircraft-paint-protection-baton-rouge" },
  { name: "Mobile Car Detailing", href: "/mobile-car-detailing-baton-rouge" },
  { name: "Interior Detailing", href: "/interior-detailing-baton-rouge" },
  { name: "Exterior Detailing", href: "/exterior-detailing-baton-rouge" },
  { name: "Headlight Restoration", href: "/headlight-restoration-baton-rouge" },
  { name: "Odor Removal", href: "/odor-removal-baton-rouge" },
  { name: "Engine Bay Cleaning", href: "/engine-bay-cleaning-baton-rouge" },
  { name: "Pet Hair Removal", href: "/pet-hair-removal-baton-rouge" },
];

const boatRvLinks = [
  { name: "Mobile Boat Detailing", href: "/mobile-boat-detailing-baton-rouge" },
  { name: "Boat Ceramic Coating", href: "/boat-ceramic-coating-baton-rouge" },
  { name: "Hull Cleaning", href: "/hull-cleaning-baton-rouge" },
  { name: "Pontoon Cleaning", href: "/pontoon-cleaning-baton-rouge" },
  { name: "Gelcoat Restoration", href: "/gelcoat-restoration-baton-rouge" },
  { name: "Mobile RV Detailing", href: "/mobile-rv-detailing-baton-rouge" },
  { name: "RV Ceramic Coating", href: "/rv-ceramic-coating-baton-rouge" },
  { name: "RV Interior Detailing", href: "/rv-interior-detailing-baton-rouge" },
  { name: "RV Roof Cleaning", href: "/rv-roof-cleaning-baton-rouge" },
  { name: "RV Oxidation Removal", href: "/rv-oxidation-removal-baton-rouge" },
];

const serviceAreas = [
  "Baton Rouge", "Denham Springs", "Highland Road", "Perkins Road", "Old Jefferson",
  "Shenandoah", "Highland Lakes", "Prairieville", "Gonzales", "Walker",
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useBusinessSettings();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-foreground">AV</span>
                <span className="text-primary"> DETAILING</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium mobile detailing services in Baton Rouge, Louisiana. We bring
              the showroom shine to your doorstep for cars, boats, RVs, and aircraft.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/avdetailingg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AV Detailing on Facebook"
                className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/avdetailinngg/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AV Detailing on Instagram"
                className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@avdetailinngg?_r=1&_t=ZT-96jE8KwVW9t"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AV Detailing on TikTok"
                className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@avdetailing"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AV Detailing on YouTube"
                className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Services</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    to={service.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/memberships"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Memberships
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Service Areas */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+12255216264"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 mr-3 text-primary" />
                  (225) 521-6264
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@avdetailing.com"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 mr-3 text-primary" />
                  info@avdetailing.com
                </a>
              </li>
              <li className="flex items-start text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-3 mt-0.5 text-primary shrink-0" />
                <address className="not-italic">
                  AV Detailing<br />
                  Baton Rouge, LA
                </address>
              </li>
              <li className="flex items-start text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-3 mt-0.5 text-primary shrink-0" />
                <span>
                  Serving {serviceAreas.join(", ")} & surrounding areas within 30 miles
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Cross-links for SEO / internal linking */}
        <div className="mt-16 pt-10 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-lg font-semibold mb-5">Detailing by City</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
              {locationLinks.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-5">Specialty Services</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
              {specialtyLinks.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-5">Boat & RV Services</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
              {boatRvLinks.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} AV Detailing. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" className="hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-center text-muted-foreground">
            Licensed & Insured • Satisfaction Guaranteed • Eco-Friendly Products
          </p>
        </div>
      </div>
    </footer>
  );
}
