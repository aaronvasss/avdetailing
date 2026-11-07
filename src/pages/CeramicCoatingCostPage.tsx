import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { PageFaqSection } from "@/components/seo/PageFaqSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CERAMIC_COST, CERAMIC_COST_ROWS, CERAMIC_COST_GUIDANCE, CERAMIC_COST_FAQS, CERAMIC_COST_LINKS } from "@/lib/ceramic-cost";

export default function CeramicCoatingCostPage() {
  return <Layout>
    <SEOHead title={CERAMIC_COST.title} description={CERAMIC_COST.description} path={CERAMIC_COST.path} />
    <JsonLd data={localBusinessSchema()} />
    <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Ceramic Coating", path: "/ceramic-coating-baton-rouge" }, { name: "Ceramic Coating Cost", path: CERAMIC_COST.path }])} />
    <section className="section-padding bg-card border-b border-border"><div className="container-custom max-w-4xl">
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb"><Link to="/">Home</Link> / <Link to="/ceramic-coating-baton-rouge">Ceramic Coating</Link> / Cost</nav>
      <h1 className="text-4xl md:text-5xl font-bold leading-tight">{CERAMIC_COST.h1}</h1>
      <p className="mt-6 text-lg text-muted-foreground">{CERAMIC_COST.intro}</p>
      <Button asChild className="mt-8"><Link to="/book">Book Ceramic Coating <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </div></section>
    <section className="section-padding"><div className="container-custom max-w-4xl">
      <h2 className="text-3xl font-bold mb-8">Prices by vehicle and tier</h2>
      <table className="w-full text-left text-sm sm:text-base"><thead><tr className="border-b border-border"><th scope="col" className="py-4">Option</th><th scope="col" className="py-4">Sedan / coupe</th><th scope="col" className="py-4">SUV / truck</th></tr></thead>
        <tbody>{CERAMIC_COST_ROWS.map(r => <tr key={r.key} className="border-b border-border"><th scope="row" className="py-5">{r.label}</th><td className="py-5">${r.car.toLocaleString("en-US")}</td><td className="py-5">${r.suvTruck.toLocaleString("en-US")}</td></tr>)}</tbody></table>
      <h2 className="text-3xl font-bold mt-12 mb-8">What changes the scope and price?</h2>
      <div className="space-y-8">{CERAMIC_COST_GUIDANCE.map(g => <div key={g.title}><h3 className="text-xl font-semibold mb-2">{g.title}</h3><p className="text-muted-foreground">{g.text}</p></div>)}</div>
      <ul className="mt-10 space-y-3">{CERAMIC_COST_LINKS.map(l => <li key={l.href}><Link to={l.href} className="text-primary underline">{l.text}</Link></li>)}</ul>
    </div></section>
    <PageFaqSection faqs={CERAMIC_COST_FAQS} />
  </Layout>;
}