import { z } from "zod";

export const recoveryEmailSchema = z.string().trim().email("Enter a valid email address.").max(255);
export const replacementPasswordSchema = z.object({
  password: z.string().min(6, "Use at least 6 characters.").max(100, "Use no more than 100 characters."),
  confirmation: z.string(),
}).refine(({ password, confirmation }) => password === confirmation, {
  message: "Passwords do not match.", path: ["confirmation"],
});

/** Only same-origin account destinations; never forward external URLs or credentials. */
export function recoveryDestination(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return "/account";
  const url = new URL(value, "https://avdetailing.net");
  if (url.origin !== "https://avdetailing.net" || url.pathname !== "/account") return "/account";
  return url.pathname + url.search;
}

export function recoveryUrl(origin: string, destination: string | null): string {
  const url = new URL("/reset-password", origin);
  url.searchParams.set("redirect", recoveryDestination(destination));
  return url.toString();
}

export function recoveryCredentials(hash: string) {
  const values = new URLSearchParams(hash.replace(/^#/, ""));
  if (values.get("type") !== "recovery" || values.has("error") || values.has("error_code")) return null;
  const accessToken = values.get("access_token");
  return accessToken && values.get("refresh_token") ? { accessToken } : null;
}

// Loaded with App before lazy pages or the auth client can consume the URL hash.
export const initialRecovery = typeof window === "undefined" ? null : recoveryCredentials(window.location.hash);

export const RECOVERY_CONFIRMATION = "If an account uses that email, you’ll receive a password reset link. Check your inbox and spam folder.";