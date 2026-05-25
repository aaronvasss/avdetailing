import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, contactPageSchema, breadcrumbSchema, localBusinessSchema } from "@/components/seo/JsonLd";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { sendContactEmail } from "@/lib/email";
import { contactFormSchema } from "@/lib/validations";
import { checkRateLimit, clearRateLimit } from "@/lib/security";
import { supabase } from "@/integrations/supabase/client";

const services = [
  "Car Detailing",
  "Ceramic Coating",
  "Paint Correction",
  "Boat Detailing",
  "RV Detailing",
  "Aircraft Detailing",
  "Membership Inquiry",
  "Other",
];

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side rate limiting (3 submissions per 5 minutes, 10 min block)
    const rateCheck = checkRateLimit('contact-form', 3, 300000, 600000);
    if (!rateCheck.allowed) {
      const waitTime = rateCheck.blockedUntil 
        ? Math.ceil((rateCheck.blockedUntil.getTime() - Date.now()) / 60000)
        : 5;
      toast.error(`Too many attempts. Please wait ${waitTime} minute${waitTime !== 1 ? 's' : ''}.`);
      return;
    }
    
    // Validate with Zod
    const result = contactFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { error: contactError } = await supabase
        .from("contacts" as never)
        .insert({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          service: formData.service,
          message: formData.message,
          source: "contact_form",
        } as never);

      if (contactError) throw contactError;

      await sendContactEmail({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        message: formData.message,
      });

      // Clear rate limit on successful submission
      clearRateLimit('contact-form');
      
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        service: "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try calling us instead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Contact Us"
        description="Contact AV Detailing in Baton Rouge, LA. Call (225) 521-6264 or fill out our form for a free estimate. Same-week availability for most services."
        path="/contact"
      />
      {/* Hero */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Contact Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Contact AV Detailing in Baton Rouge, LA
            </h1>
            <p className="text-lg text-muted-foreground">
              Have a question about our mobile detailing services? Ready to book or get a quote for System X ceramic coating, paint correction, or any of our detailing packages? Reach out to AV Detailing — we serve Baton Rouge, Highland Road, Shenandoah, Gonzales, Prairieville, Denham Springs, Walker, Zachary, Central, and all surrounding areas within 30 miles. Call us at (225) 521-6264 or fill out the form below and we will get back to you promptly.
            </p>
          </div>
        </div>
      </section>

      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={contactPageSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />

      {/* Contact Content */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Contact Information</h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <a href="tel:+12255216264" className="text-muted-foreground hover:text-primary transition-colors">
                      (225) 521-6264
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Call or text anytime
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:info@avdetailing.com" className="text-muted-foreground hover:text-primary transition-colors">
                      info@avdetailing.com
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      We respond within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Service Area</h3>
                    <p className="text-muted-foreground">
                      Baton Rouge, Prairieville, Gonzales, Denham Springs, Central, Zachary
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Mobile service – we come to you!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Saturday: 7am - 7pm
                    </p>
                    <p className="text-muted-foreground">
                      Sunday: By appointment
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button asChild className="w-full glow-red">
                    <a href="tel:+12255216264">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="sms:+12255216264">
                      Text Us
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-8 bg-card rounded-xl border border-border">
              <h2 className="text-2xl font-bold mb-2">Send Us a Message</h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      required 
                      maxLength={50}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe" 
                      required 
                      maxLength={50}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    maxLength={255}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="(225) 555-1234" 
                    required 
                    maxLength={20}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service Interest</Label>
                  <Select 
                    value={formData.service} 
                    onValueChange={(value) => setFormData({ ...formData, service: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your vehicle and what you're looking for..."
                    rows={4}
                    required
                    maxLength={2000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={errors.message ? "border-destructive" : ""}
                  />
                  {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                </div>

                <Button type="submit" className="w-full glow-red" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
