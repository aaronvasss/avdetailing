import { Calendar, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Calendar,
    title: "Book Online",
    description: "Choose your service, pick a time that works for you, and enter your location. It takes less than 2 minutes.",
  },
  {
    icon: MapPin,
    title: "We Come to You",
    description: "Our fully-equipped mobile unit arrives at your home, office, or anywhere in the Baton Rouge area.",
  },
  {
    icon: Sparkles,
    title: "Enjoy the Results",
    description: "Relax while we work. When we're done, your vehicle will look showroom-ready. Guaranteed.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Simple as 1-2-3
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting a professional detail has never been easier. No driving, no waiting rooms, 
            no hassle. Just premium results.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={cn(
                "relative text-center animate-fade-in-up"
              )}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line (hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-border" />
              )}

              {/* Icon */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6" />
                <div className="absolute inset-0 bg-primary/5 rounded-2xl -rotate-6" />
                <div className="relative flex items-center justify-center w-20 h-20 bg-card border border-border rounded-2xl">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
