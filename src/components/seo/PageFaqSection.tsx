import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonLd } from "./JsonLd";
import { pageFaqSchema, type PageFaq } from "@/lib/page-faqs";

export function PageFaqSection({ faqs }: { faqs: PageFaq[] }) {
  if (!faqs.length) return null;
  return <section className="section-padding bg-card" data-page-faqs>
    <JsonLd data={pageFaqSchema(faqs)} />
    <div className="container-custom max-w-4xl">
      <h2 className="text-3xl md:text-4xl font-bold mb-8">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible>
        {faqs.map((faq, i) => <AccordionItem key={faq.question} value={`page-faq-${i}`}>
          <AccordionTrigger className="text-left hover:text-primary">{faq.question}</AccordionTrigger>
          <AccordionContent forceMount className="text-muted-foreground text-base leading-relaxed">{faq.answer}</AccordionContent>
        </AccordionItem>)}
      </Accordion>
    </div>
  </section>;
}