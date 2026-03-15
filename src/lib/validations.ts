import { z } from "zod";

// HTML encode string to prevent XSS
export function htmlEncode(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Phone number regex - supports various US formats
const phoneRegex = /^[\d\s()+-]{10,20}$/;

// Booking form validation schema
export const bookingCustomerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(phoneRegex, "Please enter a valid phone number"),
  address: z
    .string()
    .trim()
    .min(5, "Please enter a valid address")
    .max(200, "Address must be less than 200 characters"),
  city: z
    .string()
    .trim()
    .min(2, "Please enter a valid city")
    .max(100, "City must be less than 100 characters"),
  zip: z
    .string()
    .trim()
    .min(5, "Please enter a valid ZIP code")
    .max(10, "ZIP code is too long"),
  vehicleYear: z
    .string()
    .trim()
    .min(4, "Please enter a valid year")
    .max(4, "Year must be 4 digits"),
  vehicleMake: z
    .string()
    .trim()
    .min(1, "Vehicle make is required")
    .max(50, "Make must be less than 50 characters"),
  vehicleModel: z
    .string()
    .trim()
    .min(1, "Vehicle model is required")
    .max(50, "Model must be less than 50 characters"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
});

// Contact form validation schema
export const contactFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(phoneRegex, "Please enter a valid phone number"),
  service: z
    .string()
    .max(100, "Service selection is too long")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

// Auth form validation schema
export const authFormSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .optional(),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .optional(),
});

export type BookingCustomerData = z.infer<typeof bookingCustomerSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type AuthFormData = z.infer<typeof authFormSchema>;
