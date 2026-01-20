import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Monthly Maintenance",
    frequency: "1 visit per month",
    price: 149,
    savings: "Save $30/month vs. one-time",
    description: "Perfect for maintaining that fresh detail look with minimal commitment.",
    features: [
      "Full exterior wash & dry",
      "Interior vacuum & wipe down",
      "Tire & wheel cleaning",
      "Window cleaning inside & out",
      "Dashboard & console conditioning",
      "Air freshener",
    ],
    popular: false,
  },
  {
    name: "Bi-Weekly Maintenance",
    frequency: "2 visits per month",
    price: 249,
    savings: "Save $109/month vs. one-time",
    description: "Ideal for daily drivers and high-use vehicles that need regular care.",
    features: [
      "Everything in Monthly, plus:",
      "Clay bar treatment (once monthly)",
      "Leather conditioning",
      "Engine bay wipe down (monthly)",
      "Door jamb cleaning",
      "Priority scheduling",
      "10% off all add-ons",
    ],
    popular: true,
  },
  {
    name: "Weekly Premium",
    frequency: "4 visits per month",
    price: 399,
    savings: "Save $217/month vs. one-time",
    description: "The ultimate in vehicle care for enthusiasts and luxury owners.",
    features: [
      "Everything in Bi-Weekly, plus:",
      "Paint sealant refresh (monthly)",
      "Ceramic coating maintenance",
      "Odor elimination treatment",
      "VIP priority scheduling",
      "20% off all add-ons",
      "1 free add-on per visit",
      "Dedicated detailing specialist",
    ],
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I cancel my membership anytime?",
    answer: "Yes! There are no long-term contracts. You can cancel, pause, or modify your membership at any time through your member dashboard or by contacting us.",
  },
  {
    question: "What if I need to skip a visit?",
    answer: "Life happens! You can reschedule any visit through your member dashboard. We just ask for 24-hour notice when possible.",
  },
  {
    question: "Are memberships per vehicle?",
    answer: "Yes, each membership covers one vehicle. However, we offer multi-vehicle discounts – contact us for family or fleet pricing.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Absolutely. You can change your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
];

const MembershipsPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Membership Plans
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Keep Your Vehicle Pristine
            </h1>
            <p className="text-lg text-muted-foreground">
              Join our maintenance program and never worry about scheduling. We come to you 
              on a regular basis to keep your vehicle looking showroom-fresh.
            </p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl p-8",
                  plan.popular
                    ? "bg-gradient-to-b from-primary/10 to-card border-2 border-primary scale-105"
                    : "bg-card border border-border"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                      <Star className="h-4 w-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.frequency}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-primary font-medium mt-2">{plan.savings}</p>
                  <p className="text-sm text-muted-foreground mt-4">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn("w-full", plan.popular && "glow-red")}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  <Link to="/book">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-12">
            All memberships include free cancellation anytime. No long-term contracts. 
            Prices shown are for standard sedans – contact us for SUV, truck, or other vehicle pricing.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            How Membership Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: 1, title: "Choose Your Plan", desc: "Select the frequency that fits your lifestyle" },
              { step: 2, title: "Set Your Schedule", desc: "Pick your preferred day and time window" },
              { step: 3, title: "We Show Up", desc: "Our team arrives on schedule, every time" },
              { step: 4, title: "Enjoy the Shine", desc: "Your vehicle stays pristine year-round" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Membership FAQs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Join?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your membership today and enjoy a consistently pristine vehicle without the hassle.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="glow-red">
              <Link to="/book">
                Choose Your Plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="tel:+12255551234">
                <Phone className="mr-2 h-5 w-5" />
                Call to Discuss
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MembershipsPage;
