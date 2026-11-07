import { useLocation, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { ResponsivePhoto } from "@/components/ui/responsive-photo";
import { GALLERY_PHOTOS } from "@/lib/gallery-images";
import { JOB_GALLERY, jobAlt, jobCaption } from "@/lib/job-gallery";
import { CARE_GUIDES, GUIDES_INDEX, GUIDE_PUBLISH_DATE, guideSchemas } from "@/lib/guides";
import { SPANISH_PAGES } from "@/lib/language-pages";
import { spanishPackagePrices } from "@/lib/editorial-html";
import { usePricing, FALLBACK_PACKAGES } from "@/lib/pricing";
import { ArrowRight } from "lucide-react";

export default function EditorialPage() {
  const { pathname } = useLocation();
  const pricing = usePricing();
  const guide = CARE_GUIDES.find(g => g.path === pathname);
  const spanish = SPANISH_PAGES.find(p => p.path === pathname);
  const page = guide ?? spanish;
  if (!page && pathname !== GUIDES_INDEX.path) return null;
  const meta = page ?? GUIDES_INDEX;
  const job = JOB_GALLERY.find(j => j.key === (guide?.photo ?? "car"));
  const fallback = (name: string) => FALLBACK_PACKAGES.find(p => p.service === "car" && p.name === name)?.price ?? 0;
  const packages = spanishPackagePrices(pricing.packageFrom("car", "Silver Package") ?? fallback("Silver Package"), pricing.packageFrom("car", "Gold Package") ?? fallback("Gold Package"));
  return <Layout>
    <SEOHead title={meta.title} description={meta.description} path={pathname} type={guide ? "article" : "website"} />
    <JsonLd data={localBusinessSchema()} />
    {guide && <JsonLd data={guideSchemas(guide)} />}
    <div lang={spanish ? "es" : "en"}>
      <section className="section-padding border-b border-border bg-card"><div className="container-custom max-w-4xl">
        <nav aria-label={spanish ? "Ruta de navegación" : "Breadcrumb"} className="mb-6 text-sm text-muted-foreground">
          <Link to={spanish ? "/es" : "/"}>{spanish ? "Inicio" : "Home"}</Link>
          {guide && <> / <Link to="/guides">Guides</Link></>}
          {page && <> / <span>{guide ? guide.h1 : "AV Detailing"}</span></>}
        </nav>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">{page?.h1 ?? "Car & boat care guides"}</h1>
        {guide && <p className="mt-5 text-sm text-muted-foreground">By AV Detailing · Published <time dateTime={GUIDE_PUBLISH_DATE}>November 7, 2026</time></p>}
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{page?.intro ?? GUIDES_INDEX.description}</p>
      </div></section>
      {!page ? <section className="section-padding"><div className="container-custom max-w-4xl grid md:grid-cols-2 gap-6">
        {CARE_GUIDES.map(g => <article key={g.path} className="border border-border rounded-lg p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-4"><Link className="hover:text-primary" to={g.path}>{g.h1}</Link></h2>
          <p className="text-muted-foreground leading-relaxed flex-1">{g.description}</p>
          <Link to={g.path} className="mt-6 text-primary flex items-center gap-2">Read guide <ArrowRight className="h-4 w-4" /></Link>
        </article>)}
      </div></section> : <article className="section-padding"><div className="container-custom max-w-4xl">
        {pathname === SPANISH_PAGES[1].path && <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Precios iniciales para sedanes y cupés</h2>
          <ul className="divide-y divide-border">{packages.map(p => <li key={p.name} className="py-4 flex justify-between"><span>{p.name}</span><span>desde {p.price}</span></li>)}</ul>
          <p className="mt-4 text-muted-foreground">El precio final depende del vehículo y de las selecciones al reservar.</p>
        </section>}
        {page.sections.map(s => <section key={s.heading} className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-5">{s.heading}</h2>
          {s.paragraphs.map(p => <p key={p} className="text-muted-foreground leading-relaxed mb-4">{p}</p>)}
        </section>)}
        <nav aria-label={spanish ? "Servicios relacionados" : "Related services"} className="space-y-4 mb-8">{page.links.map(l => <p key={l.href}><Link to={l.href} className="text-primary underline underline-offset-4">{l.text}</Link></p>)}</nav>
        <Button asChild><Link to="/book">{spanish ? "Reservar servicio (en inglés)" : "Book a service"}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        {guide && <section className="mt-12"><h2 className="text-xl font-bold mb-4">Further reading</h2><ul className="space-y-3">{guide.sources.map(s => <li key={s.href}><a href={s.href} rel="noopener noreferrer" className="text-muted-foreground underline">{s.text}</a></li>)}</ul></section>}
        {job && <section className="mt-12"><h2 className="text-2xl font-bold mb-6">{spanish ? "Trabajo de AV Detailing: Range Rover Biography" : jobCaption(job)}</h2><div className="grid md:grid-cols-2 gap-6">
          {(["before", "after"] as const).map(stage => <figure key={stage}><div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <ResponsivePhoto photo={GALLERY_PHOTOS[stage === "before" ? job.beforeKey : job.afterKey]} alt={spanish ? `Range Rover Biography ${stage === "before" ? "antes" : "después"} del detallado por AV Detailing` : jobAlt(job, stage)} sizes="(min-width: 768px) 420px, 100vw" className="absolute inset-0 w-full h-full object-cover" />
          </div><figcaption className="mt-3 text-sm text-muted-foreground">{spanish ? (stage === "before" ? "Antes" : "Después") : stage === "before" ? "Before" : "After"}</figcaption></figure>)}
        </div></section>}
      </div></article>}
    </div>
  </Layout>;
}