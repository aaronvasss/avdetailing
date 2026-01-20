import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Monthly",
    frequency: "1x per month",
    price: 149,
    description: "Perfect for maintaining that fresh detail look.",
    features: [
      "Full exterior wash & dry",
      "Interior vacuum & wipe down",
      "Tire & wheel cleaning",
      "Window cleaning inside & out",
      "Dashboard & console conditioning",
    ],
    popular: false,
  },
  {
    name: "Bi-Weekly",
    frequency: "2x per month",
    price: 249,
    description: "Ideal for daily drivers and high-use vehicles.",
    features: [
      "Everything in Monthly, plus:",
      "Clay bar treatment (monthly)",
      "Leather conditioning",
      "Engine bay wipe down",
      "Priority scheduling",
      "10% off additional services",
    ],
    popular: true,
  },
  {
    name: "Weekly Premium",
    frequency: "4x per month",
    price: 399,
    description: "The ultimate in vehicle care for enthusiasts.",
    features: [
      "Everything in Bi-Weekly, plus:",
      "Paint sealant refresh",
      "Ceramic coating maintenance",
      "Odor elimination treatment",
      "VIP priority scheduling",
      "20% off additional services",
      "Free add-on per visit",
    ],
    popular: false,
  },
];

export function MembershipSection() {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-8 animate-fade-in-up",
                plan.popular
                  ? "bg-gradient-to-b from-primary/10 to-card border-2 border-primary"
                  : "bg-background border border-border"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
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

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                className={cn(
                  "w-full",
                  plan.popular ? "glow-red" : ""
                )}
                variant={plan.popular ? "default" : "outline"}
              >
                <Link to="/memberships">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          All memberships include free cancellation anytime. No long-term contracts.
        </p>
      </div>
    </section>
  );
}
