import { Link, useLocation } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { NOT_FOUND_SEO, NOT_FOUND_LINKS } from "@/lib/not-found-seo";

const NotFound = () => {
  const location = useLocation();

  return (
    <>
      <SEOHead
        title={NOT_FOUND_SEO.title}
        description={NOT_FOUND_SEO.description}
        path={location.pathname}
        noIndex
        follow
        omitCanonical
      />
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Page not found</h1>
          <p className="mb-4 text-xl text-muted-foreground">The page you requested does not exist.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {NOT_FOUND_LINKS.map(l => <Button key={l.href} asChild variant={l.href === "/book" ? "default" : "outline"}><Link to={l.href}>{l.text}</Link></Button>)}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
