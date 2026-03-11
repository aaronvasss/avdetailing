import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { MEMBERSHIP_PRICES } from "@/lib/stripe";
import { toast } from "sonner";
import { MembershipSignupModal } from "@/components/membership/MembershipSignupModal";

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
    price: 130,
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

// Monthly cost multipliers by frequency slug
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
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl p-8 flex flex-col",
                    plan.is_popular
                      ? "bg-gradient-to-b from-primary/10 to-card border-2 border-primary scale-105"
                      : "bg-card border border-border"
                  )}
                >
                  {plan.is_popular && (
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
                      <span className="text-muted-foreground">
                        {billingLabels[plan.slug] || '/month'}
                      </span>
                    </div>
                    {plan.savings && (
                      <p className="text-sm text-primary font-medium mt-2">{plan.savings}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-4">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features?.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Button
                      className={cn("w-full", plan.is_popular && "glow-red")}
                      variant={plan.is_popular ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleSubscribe(plan)}
                    >
                      Subscribe Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
              { step: 2, title: "Enter Your Info", desc: "Tell us about your vehicle and location" },
              { step: 3, title: "Complete Payment", desc: "Secure checkout through Stripe" },
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
            <Button asChild variant="outline" size="lg">
              <a href="tel:+12255216264">
                <Phone className="mr-2 h-5 w-5" />
                Call to Discuss
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
