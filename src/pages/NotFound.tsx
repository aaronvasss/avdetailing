import { Link, useLocation } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <>
      <SEOHead
        title="Page Not Found | AV Detailing"
        description="This page does not exist. Explore AV Detailing services, book an appointment or contact us."
        path={location.pathname}
        noIndex
        omitCanonical
      />
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Return to Home
          </a>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline"><Link to="/services">Services</Link></Button>
            <Button asChild><Link to="/book">Book</Link></Button>
            <Button asChild variant="outline"><Link to="/contact">Contact</Link></Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
