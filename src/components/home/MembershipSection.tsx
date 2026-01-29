import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  price: number;
  frequency: string;
  description: string | null;
  features: string[] | null;
  is_popular: boolean | null;
}

// Fallback plans that match the database structure
const fallbackPlans: MembershipPlan[] = [
  {
    id: "monthly",
    slug: "monthly-maintenance",
    name: "Monthly",
    frequency: "1x per month",
    price: 135,
    description: "Perfect for maintaining that fresh detail look.",
    features: [
      "Full exterior wash & dry",
      "Interior vacuum & wipe down",
      "Tire & wheel cleaning",
      "Window cleaning inside & out",
      "Dashboard & console conditioning",
    ],
    is_popular: false,
  },
  {
    id: "bi-weekly",
    slug: "bi-weekly-maintenance",
    name: "Bi-Weekly",
    frequency: "2x per month",
    price: 260,
    description: "Ideal for daily drivers and high-use vehicles.",
    features: [
      "Everything in Monthly, plus:",
      "Leather conditioning",
      "Priority scheduling",
      "10% off additional services",
    ],
    is_popular: true,
  },
  {
    id: "weekly",
    slug: "weekly-maintenance",
    name: "Weekly Premium",
    frequency: "4x per month",
    price: 520,
    description: "The ultimate in vehicle care for enthusiasts.",
    features: [
      "Everything in Bi-Weekly, plus:",
      "Paint sealant refresh",
      "VIP priority scheduling",
      "15% off additional services",
      "Includes one free add-on per month",
    ],
    is_popular: false,
  },
];

// Map database frequency to display format
const frequencyDisplayMap: Record<string, string> = {
  "monthly": "1x per month",
  "bi-weekly": "2x per month",
  "weekly": "4x per month",
};

// Map database names to display names for home page
const nameDisplayMap: Record<string, string> = {
  "Monthly Maintenance": "Monthly",
  "Bi-Weekly Maintenance": "Bi-Weekly",
  "Weekly Premium": "Weekly Premium",
};

export function MembershipSection() {
  const [plans, setPlans] = useState<MembershipPlan[]>(fallbackPlans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform database data to match home page display format
        setPlans(data.map(plan => ({
          ...plan,
          name: nameDisplayMap[plan.name] || plan.name,
          frequency: frequencyDisplayMap[plan.frequency] || plan.frequency,
        })));
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      // Keep fallback plans on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Membership Plans
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Keep Your Vehicle Pristine
          </h2>
          <p className="text-lg text-muted-foreground">
            Join our maintenance program and never worry about scheduling. We come to you 
            on a regular basis to keep your vehicle looking its best.
          </p>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl p-8 animate-fade-in-up flex flex-col",
                  plan.is_popular
                    ? "bg-gradient-to-b from-primary/10 to-card border-2 border-primary"
                    : "bg-background border border-border"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Popular Badge */}
                {plan.is_popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                      <Star className="h-4 w-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.frequency}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>

                {/* Features - grows to fill space */}
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features?.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA - always at bottom */}
                <div className="mt-auto">
                  <Button
                    asChild
                    className={cn(
                      "w-full",
                      plan.is_popular ? "glow-red" : ""
                    )}
                    variant={plan.is_popular ? "default" : "outline"}
                  >
                    <Link to="/memberships">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          All memberships include free cancellation anytime. No long-term contracts.
        </p>
      </div>
    </section>
  );
}
