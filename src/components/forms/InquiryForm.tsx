import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { sendContactEmail } from "@/lib/email";
import { contactFormSchema } from "@/lib/validations";
import { checkRateLimit, clearRateLimit } from "@/lib/security";
import { supabase } from "@/integrations/supabase/client";

interface InquiryFormProps {
  /** Identifies where the form was submitted from (e.g. "homepage", "service:ceramic-coating") */
  source?: string;
  /** Optional pre-filled service interest (shown to admin in message) */
  serviceContext?: string;
  className?: string;
}

export function InquiryForm({ source = "inquiry_form", serviceContext, className = "" }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    if (!formRef.current) return;
    const existing = formRef.current.querySelector(
      'script[data-tracking-id="tk_347c00e8680f42a88abeb9ae8eef1082"]'
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://link.msgsndr.com/js/external-tracking.js";
    script.setAttribute("data-tracking-id", "tk_347c00e8680f42a88abeb9ae8eef1082");
    script.async = true;
    formRef.current.appendChild(script);

    return () => {
      if (formRef.current && script.parentNode === formRef.current) {
        formRef.current.removeChild(script);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const rateCheck = checkRateLimit(`inquiry-form:${source}`, 3, 300000, 600000);
    if (!rateCheck.allowed) {
      const waitTime = rateCheck.blockedUntil
        ? Math.ceil((rateCheck.blockedUntil.getTime() - Date.now()) / 60000)
        : 5;
      toast.error(`Too many attempts. Please wait ${waitTime} minute${waitTime !== 1 ? "s" : ""}.`);
      return;
    }

    const payload = {
      ...formData,
      service: serviceContext || "",
      message: formData.message,
    };

    const result = contactFormSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const messageWithSource = serviceContext
        ? `[Source: ${source} • Interested in: ${serviceContext}]\n\n${formData.message}`
        : `[Source: ${source}]\n\n${formData.message}`;

      const { error: contactError } = await supabase
        .from("contacts" as never)
        .insert({
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          service: serviceContext || null,
          message: formData.message,
          source,
        } as never);

      if (contactError) throw contactError;

      await sendContactEmail({
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        service: serviceContext,
        message: messageWithSource,
      });

      clearRateLimit(`inquiry-form:${source}`);
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ firstName: "", lastName: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error sending inquiry:", error);
      toast.error("Failed to send message. Please try calling us instead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${source}-firstName`}>First Name</Label>
          <Input
            id={`${source}-firstName`}
            placeholder="John"
            required
            maxLength={50}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${source}-lastName`}>Last Name</Label>
          <Input
            id={`${source}-lastName`}
            placeholder="Doe"
            required
            maxLength={50}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${source}-email`}>Email</Label>
          <Input
            id={`${source}-email`}
            type="email"
            placeholder="john@example.com"
            required
            maxLength={255}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${source}-phone`}>Phone</Label>
          <Input
            id={`${source}-phone`}
            type="tel"
            placeholder="(225) 555-1234"
            required
            maxLength={20}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${source}-message`}>
          How can we help?{serviceContext ? ` (about ${serviceContext})` : ""}
        </Label>
        <Textarea
          id={`${source}-message`}
          placeholder="Tell us about your vehicle and what you're looking for..."
          rows={4}
          required
          maxLength={2000}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={errors.message ? "border-destructive" : ""}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>

      <Button type="submit" className="w-full glow-red" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Message"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        We'll get back to you within 24 hours.
      </p>
    </form>
  );
}
