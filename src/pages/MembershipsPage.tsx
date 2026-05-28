import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Check,
  Star,
  ArrowRight,
  Phone,
  Loader2,
  Sparkles,
  Calendar,
  CreditCard,
  ShieldCheck,
  Clock,
  Car,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { MEMBERSHIP_PRICES } from "@/lib/stripe";
import { toast } from "sonner";
import { MembershipSignupModal } from "@/components/membership/MembershipSignupModal";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, offerCatalogSchema, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  price: number;
  frequency: string;
  description: string | null;
  features: string[] | null;
  is_popular: boolean | null;
  stripe_price_id: string | null;
}

const fallbackPlans = [
  {
    id: "monthly",
    slug: "monthly",
    name: "Monthly Maintenance",
    frequency: "1 visit per month",
    price: 135,
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
    is_popular: false,
    stripe_price_id: MEMBERSHIP_PRICES.monthly,
  },
  {
    id: "bi-weekly",
    slug: "bi-weekly",
    name: "Bi-Weekly Maintenance",
    frequency: "2x per month",
    price: 260,
    savings: "Save $109/month vs. one-time",
    description: "Ideal for daily drivers and high-use vehicles that need regular care.",
    features: [
      "Everything in Monthly, plus:",
      "Leather conditioning",
      "Door jamb cleaning",
      "Priority scheduling",
      "10% off all add-ons",
    ],
    is_popular: true,
    stripe_price_id: MEMBERSHIP_PRICES['bi-weekly'],
  },
  {
    id: "weekly-premium",
    slug: "weekly-premium",
    name: "Weekly Premium",
    frequency: "4x per month",
    price: 520,
    savings: "Save $217/month vs. one-time",
    description: "The ultimate in vehicle care for enthusiasts and luxury owners.",
    features: [
      "Everything in Bi-Weekly, plus:",
      "Paint sealant refresh (monthly)",
      "VIP priority scheduling",
      "15% off all add-ons",
      "Includes one free add-on per month",
      "Dedicated detailing specialist",
    ],
    is_popular: false,
    stripe_price_id: MEMBERSHIP_PRICES['weekly-premium'],
  },
];

const savingsMap: Record<string, string> = {
  "monthly": "Save $30/month vs. one-time",
  "bi-weekly": "Save $109/month vs. one-time",
  "weekly-premium": "Save $217/month vs. one-time",
};

const billingLabels: Record<string, string> = {
  "monthly": "/month",
  "bi-weekly": "/month",
  "weekly-premium": "/month",
};

const visitsPerMonth: Record<string, number> = {
  "monthly": 1,
  "bi-weekly": 2,
  "weekly": 4,
  "weekly-premium": 4,
};

const monthlyMultiplier: Record<string, number> = {
  "monthly": 1,
  "bi-weekly": 2,
  "weekly": 4,
  "weekly-premium": 4,
};

const frequencyDisplay: Record<string, string> = {
  "monthly": "1 visit per month",
  "bi-weekly": "2x per month",
  "weekly": "4x per month",
  "weekly-premium": "4x per month",
};

const PERKS = [
  { icon: ShieldCheck, label: "No long-term contracts" },
  { icon: Calendar, label: "Cancel or pause anytime" },
  { icon: Car, label: "Fully mobile — we come to you" },
  { icon: Clock, label: "Priority scheduling" },
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

const HOW_STEPS = [
  { icon: Star, title: "Choose Your Plan", desc: "Select the frequency that fits your lifestyle." },
  { icon: Car, title: "Tell Us About Your Vehicle", desc: "Share your address and vehicle details." },
  { icon: CreditCard, title: "Secure Checkout", desc: "Easy, encrypted payment via Stripe." },
  { icon: Sparkles, title: "Enjoy the Shine", desc: "We arrive on schedule. You keep the shine." },
];

const MembershipsPage = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<(MembershipPlan & { savings?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<(MembershipPlan & { savings?: string }) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchPlans();

    if (searchParams.get("canceled") === "true") {
      toast.info("Subscription checkout was canceled");
    }
    if (searchParams.get("success") === "true") {
      toast.success("Membership activated! Check your email to set up your account password.");
    }
  }, [searchParams]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;

      if (data && data.length > 0) {
        setPlans(data.map(plan => {
          const multiplier = monthlyMultiplier[plan.frequency] || monthlyMultiplier[plan.slug] || 1;
          return {
            ...plan,
            price: plan.price * multiplier,
            frequency: frequencyDisplay[plan.frequency] || frequencyDisplay[plan.slug] || plan.frequency,
            savings: savingsMap[plan.slug] || "",
          };
        }));
      } else {
        setPlans(fallbackPlans);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: MembershipPlan & { savings?: string }) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  return (
    <Layout>
      <SEOHead
        title="Detailing Memberships"
        description="Recurring mobile detailing memberships in Baton Rouge. Monthly, bi-weekly, and weekly maintenance plans to keep your vehicle showroom-fresh."
        path="/memberships"
      />
      <JsonLd
        data={offerCatalogSchema(
          "AV Detailing Memberships",
          plans.map((p) => ({ name: p.name, price: p.price, description: p.description ?? undefined, url: "/memberships" }))
        )}
      />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Memberships", path: "/memberships" }])} />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div className="container-custom relative pt-12 pb-14 md:pt-16 md:pb-20">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Membership Plans · Baton Rouge, LA
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
                Showroom-fresh, <span className="text-primary">on autopilot</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
                Pick a frequency that fits your life. We show up, detail your vehicle, and
                keep it looking pristine all year — no scheduling stress, no surprises, and
                you save versus booking one-time details.
              </p>
            </div>
            {/* Perks card */}
            <aside className="lg:col-span-4">
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  Every membership includes
                </div>
                <ul className="space-y-3">
                  {PERKS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <li key={p.label} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{p.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
              {plans.map((plan) => {
                const visits = visitsPerMonth[plan.slug] || 1;
                const perVisit = Math.round(plan.price / visits);
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl p-7 md:p-8 transition-colors",
                      plan.is_popular
                        ? "bg-gradient-to-b from-primary/10 via-card to-card border-2 border-primary shadow-xl shadow-primary/10"
                        : "bg-card border border-border hover:border-primary/40"
                    )}
                  >
                    {plan.is_popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-1.5 px-3.5 py-1 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-full shadow-md">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          Most Popular
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.frequency}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-foreground leading-none">
                          ${plan.price}
                        </span>
                        <span className="text-muted-foreground">
                          {billingLabels[plan.slug] || '/month'}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        ≈ ${perVisit} per visit
                      </div>
                      {plan.savings && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <TrendingDown className="h-3.5 w-3.5" />
                          {plan.savings}
                        </div>
                      )}
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="border-t border-border pt-5 mb-6 flex-grow">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        What's included
                      </div>
                      <ul className="space-y-2.5">
                        {plan.features?.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <Button
                      className={cn("w-full font-semibold tracking-wide", plan.is_popular && "glow-red")}
                      variant={plan.is_popular ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleSubscribe(plan)}
                    >
                      Subscribe Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-10 max-w-2xl mx-auto">
            All memberships include free cancellation anytime — no long-term contracts.
            Prices shown are for standard sedans; contact us for SUV, truck, or other vehicle pricing.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS — connected horizontal steps */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              Simple Setup
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              How membership works
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
            {/* connecting line desktop */}
            <div
              className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent"
              aria-hidden
            />
            {HOW_STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="relative text-center">
                  <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-primary text-primary">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                      {idx + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Membership FAQs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <div
                key={faq.question}
                className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-primary mt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold mb-2 leading-snug">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card border-t border-border">
        <div className="container-custom max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-primary/60" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to join?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your membership today and enjoy a consistently pristine vehicle without the
            hassle. Questions? Give us a call — we're happy to help you choose the right plan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild className="font-semibold tracking-wide">
              <Link to="/book">
                Book a Single Detail
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold tracking-wide">
              <a href="tel:+12255216264">
                <Phone className="mr-2 h-4 w-4" />
                (225) 521-6264
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Signup Modal */}
      <MembershipSignupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        plan={selectedPlan}
      />
    </Layout>
  );
};

export default MembershipsPage;
