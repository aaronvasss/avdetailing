import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does mobile detailing work?",
    answer: "We bring everything needed to detail your vehicle directly to your location - home, office, or anywhere in the Baton Rouge area. Our fully-equipped mobile unit includes water, power, and all professional-grade products and equipment. You don't need to provide anything except access to your vehicle.",
  },
  {
    question: "How long does a typical detail take?",
    answer: "Service times vary based on the package and vehicle size. A basic exterior wash takes about 1-2 hours, while a full detail can take 4-6 hours. Ceramic coating applications may require 1-2 days. We'll provide an accurate time estimate when you book.",
  },
  {
    question: "What areas do you service?",
    answer: "We service Baton Rouge and surrounding areas including Prairieville, Gonzales, Denham Springs, Central, Zachary, and more. If you're within 30 miles of downtown Baton Rouge, we can come to you. Contact us for locations outside this range.",
  },
  {
    question: "Are you insured?",
    answer: "Yes, we are fully insured with comprehensive liability coverage. Your vehicle is protected while in our care. We also use only pH-balanced, paint-safe products to ensure no damage to your vehicle's finish.",
  },
  {
    question: "What's included in your membership plans?",
    answer: "Our membership plans include scheduled recurring visits at your chosen frequency (weekly, bi-weekly, or monthly). Each visit includes our signature maintenance wash plus additional services based on your tier. Members also get priority scheduling, discounts on add-ons, and flexible cancellation.",
  },
  {
    question: "Do I need to be present during the service?",
    answer: "No, you don't need to be present. Many clients leave their vehicle accessible and go about their day. We'll send you before/after photos and notify you when the service is complete. For first-time clients, we recommend a brief walkthrough to discuss any specific concerns.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and digital payments including Apple Pay and Google Pay. Payment is processed securely online when you book. For membership plans, we set up automatic recurring billing.",
  },
  {
    question: "What if it rains on my appointment day?",
    answer: "We monitor weather closely and will contact you to reschedule if conditions aren't suitable. For exterior-only services, we need dry conditions. Interior services and covered locations can proceed rain or shine. There's no fee for weather-related rescheduling.",
  },
];

export function FAQSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Got questions? We've got answers. If you don't see what you're looking for, 
            feel free to contact us.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border border-border rounded-lg px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left hover:no-underline hover:text-primary py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
