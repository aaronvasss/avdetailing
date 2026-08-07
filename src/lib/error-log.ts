import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight frontend error logging.
 * Writes to public.app_error_logs (insert is open to anon + authenticated)
 * so booking/checkout failures are traceable from the admin dashboard.
 */

export type ErrorSeverity = "info" | "warning" | "error" | "fatal";

export interface LogErrorInput {
  message: string;
  code?: string;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  bookingId?: string | null;
  stack?: string | null;
  errorId?: string | null;
}

// Avoid flooding the table with the same repeated error
const recent = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30_000;

const truncate = (value: string | null | undefined, max: number) =>
  value ? value.slice(0, max) : null;

export async function logAppError(input: LogErrorInput): Promise<void> {
  try {
    const key = `${input.code || ""}|${input.message}`;
    const now = Date.now();
    const last = recent.get(key);
    if (last && now - last < DEDUPE_WINDOW_MS) return;
    recent.set(key, now);

    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
    } catch {
      // unauthenticated / preview — keep logging anyway
    }

    await supabase.from("app_error_logs").insert({
      source: "frontend",
      severity: input.severity || "error",
      code: truncate(input.code, 120),
      message: truncate(input.message, 2000) || "Unknown error",
      route: typeof window !== "undefined" ? window.location.pathname : null,
      url: truncate(typeof window !== "undefined" ? window.location.href : null, 1000),
      user_agent: truncate(typeof navigator !== "undefined" ? navigator.userAgent : null, 500),
      user_id: userId,
      booking_id: input.bookingId || null,
      error_id: input.errorId || null,
      stack: truncate(input.stack, 4000),
      context: (input.context || {}) as never,
    });
  } catch (err) {
    // Never let logging break the app
    console.warn("[error-log] failed to record error", err);
  }
}

/** Convenience wrapper for caught exceptions. */
export function logCaughtError(
  error: unknown,
  context?: Record<string, unknown>,
  severity: ErrorSeverity = "error",
) {
  const e = error as Error & { code?: string };
  void logAppError({
    message: e?.message || String(error),
    code: e?.code,
    stack: e?.stack,
    severity,
    context,
  });
}

let installed = false;

/** Install global window error / unhandled rejection listeners once. */
export function installGlobalErrorLogging() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    if (!event?.message) return;
    void logAppError({
      message: event.message,
      severity: "error",
      code: "window_error",
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as Error | undefined;
    void logAppError({
      message: reason?.message || String(event.reason || "Unhandled promise rejection"),
      severity: "error",
      code: (reason as never as { code?: string })?.code || "unhandled_rejection",
      stack: reason?.stack,
    });
  });
}
