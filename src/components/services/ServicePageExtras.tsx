import { usePricing } from "@/lib/pricing";
import { corePageFaqs } from "@/lib/page-faqs";
import { jobForPage, jobAlt, jobCaption } from "@/lib/job-gallery";
import { GALLERY_PHOTOS } from "@/lib/gallery-images";
import { ResponsivePhoto } from "@/components/ui/responsive-photo";
import { PageFaqSection } from "@/components/seo/PageFaqSection";
import { approvedPhotosForPage, approvedPhotoCaption } from "@/lib/approved-job-photos";
import { SERVICE_EXPECTATIONS } from "@/lib/service-expectations";
import { Link } from "react-router-dom";

/** Layout invokes this only for reviewed money pages, never utility/private pages. */
export function ServicePageExtras({ path }: { path: string }) {
  const pricing = usePricing();
  const job = jobForPage(path);
  const expectations = SERVICE_EXPECTATIONS[path];
  const faqs = corePageFaqs(path, pricing).length ? corePageFaqs(path, pricing) : expectations?.faqs ?? [];
  const photos = approvedPhotosForPage(path);
  return <>
    {expectations && <section className="section-padding" data-service-expectations><div className="container-custom max-w-4xl"><h2 className="text-3xl font-bold mb-6">What to expect</h2><p className="text-muted-foreground mb-8">{expectations.summary}</p><h3 className="text-xl font-semibold mb-3">Prepare for your appointment</h3><p className="text-muted-foreground mb-8">{expectations.preparation}</p><ul className="space-y-3">{expectations.links.map(l => <li key={l.href}><Link to={l.href} className="text-primary underline">{l.text}</Link></li>)}</ul></div></section>}
    {job && <section className="section-padding" data-job-pair={job.key}>
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">{jobCaption(job)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["before", "after"] as const).map(stage => <figure key={stage}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <ResponsivePhoto photo={GALLERY_PHOTOS[stage === "before" ? job.beforeKey : job.afterKey]} alt={jobAlt(job, stage)} sizes="(min-width: 768px) 420px, 100vw" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-muted-foreground">{stage === "before" ? "Before" : "After"} · {jobCaption(job)}</figcaption>
          </figure>)}
        </div>
      </div>
    </section>}
    {photos.length > 0 && <section className="section-padding" data-approved-job-photos>
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">{approvedPhotoCaption(photos[0])}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {photos.map(p => <figure key={p.key}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <ResponsivePhoto photo={p.photo} alt={p.alt} sizes="(min-width: 768px) 420px, 100vw" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-muted-foreground">{approvedPhotoCaption(p)}</figcaption>
          </figure>)}
        </div>
      </div>
    </section>}
    <PageFaqSection faqs={faqs} />
  </>;
}