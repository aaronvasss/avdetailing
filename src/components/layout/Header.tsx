import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, ChevronDown, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const navigation = [
  { name: "Home", href: "/" },
  {
    name: "Services",
    href: "/services",
    children: [
      { name: "Car Detailing", href: "/car-detailing-baton-rouge" },
      { name: "Ceramic Coating", href: "/ceramic-coating-baton-rouge" },
      { name: "Paint Correction", href: "/paint-correction-baton-rouge" },
      { name: "Boat Detailing", href: "/boat-detailing-baton-rouge" },
      { name: "RV Detailing", href: "/rv-detailing-baton-rouge" },
      { name: "Aircraft Detailing", href: "/aircraft-detailing-baton-rouge" },
    ],
  },
  { name: "Memberships", href: "/memberships" },
  { name: "Reviews", href: "/reviews" },
  { name: "About", href: "/about" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const { settings } = useBusinessSettings();
  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" aria-label="AV Detailing home">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight leading-none">
              <span className="text-foreground">AV</span>{" "}
              <span className="text-primary">DETAILING</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {navigation.map((item) => (
              <div key={item.name} className="relative group flex items-center">
                {item.children ? (
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md group/trigger",
                        isActive(item.href)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.name}
                      <ChevronDown 
                        className={cn(
                          "ml-1 h-4 w-4 transition-transform duration-300",
                          servicesOpen && "rotate-180"
                        )} 
                      />
                    </Link>
                    {/* Premium Dropdown */}
                    <div
                      className={cn(
                        "absolute top-full left-0 mt-2 w-64 py-3 bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl shadow-black/20 transition-all duration-300 ease-out origin-top",
                        servicesOpen
                          ? "opacity-100 visible scale-100 translate-y-0"
                          : "opacity-0 invisible scale-95 -translate-y-2"
                      )}
                    >
                      {/* Decorative top accent */}
                      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                      
                      {item.children.map((child, index) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className="group/item flex items-center gap-3 mx-2 px-4 py-3 text-sm text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-primary/10 hover:pl-6"
                          style={{
                            transitionDelay: servicesOpen ? `${index * 50}ms` : '0ms',
                            opacity: servicesOpen ? 1 : 0,
                            transform: servicesOpen ? 'translateX(0)' : 'translateX(-8px)'
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/item:bg-primary group-hover/item:scale-125 transition-all duration-200" />
                          <span className="flex-1">{child.name}</span>
                          <span className="opacity-0 group-hover/item:opacity-100 translate-x-[-4px] group-hover/item:translate-x-0 transition-all duration-200 text-primary">
                            →
                          </span>
                        </Link>
                      ))}
                      
                      {/* View all services link */}
                      <div className="mx-2 mt-2 pt-2 border-t border-border/50">
                        <Link
                          to="/services"
                          className="flex items-center justify-between px-4 py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          View All Services
                          <span className="text-sm">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
                      "after:absolute after:bottom-1 after:left-4 after:right-4 after:h-px after:bg-primary after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100",
                      isActive(item.href)
                        ? "text-primary after:scale-x-100"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center space-x-4 shrink-0">
            <a
              href="tel:+12255216264"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              <Phone className="h-4 w-4 mr-2" />
              (225) 521-6264
            </a>
            {user ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/account">
                  {isAdmin ? <Shield className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                  {isAdmin ? "Admin" : "Account"}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            {!isAdmin && (
              <Button asChild className="glow-red">
                <Link to="/book">Book Now</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-[80vh] pb-4" : "max-h-0"
          )}
        >
          <div className="space-y-1 pt-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-base font-medium rounded-md",
                        isActive(item.href)
                          ? "text-primary bg-secondary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {item.name}
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        mobileServicesOpen && "rotate-180"
                      )} />
                    </button>
                    <div className={cn(
                      "overflow-hidden transition-all duration-200",
                      mobileServicesOpen ? "max-h-96" : "max-h-0"
                    )}>
                      <div className="pl-4 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 text-base font-medium rounded-md",
                      isActive(item.href)
                        ? "text-primary bg-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-4 space-y-3 px-3">
              {user ? (
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)}>
                    {isAdmin ? <Shield className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                    {isAdmin ? "Admin Panel" : "My Account"}
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
