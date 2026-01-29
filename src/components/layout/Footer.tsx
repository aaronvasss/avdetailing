import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

const services = [
  { name: "Car Detailing", href: "/services/car-detailing" },
  { name: "Ceramic Coating", href: "/services/ceramic-coating" },
  { name: "Paint Correction", href: "/services/paint-correction" },
  { name: "Boat Detailing", href: "/services/boat-detailing" },
  { name: "RV Detailing", href: "/services/rv-detailing" },
  { name: "Aircraft Detailing", href: "/services/aircraft-detailing" },
];

const company = [
  { name: "About Us", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Reviews", href: "/reviews" },
  { name: "Service Areas", href: "/service-areas" },
  { name: "Contact", href: "/contact" },
];

const serviceAreas = [
  "Baton Rouge",
  "Prairieville",
  "Gonzales",
  "Denham Springs",
  "Central",
  "Zachary",
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
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
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
                  href={`tel:${settings.publicBusinessPhoneE164}`}
                  className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 mr-3 text-primary" />
                  {settings.publicBusinessPhone}
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
                <span>
                  Serving {serviceAreas.join(", ")} and surrounding areas
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} AV Detailing. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary transition-colors">
                Terms of Service
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
