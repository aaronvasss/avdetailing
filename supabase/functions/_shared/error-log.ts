// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Shared edge-function error logger. Writes to public.app_error_logs with the
 * service role so failures inside functions are visible in the admin dashboard.
 */
export async function logEdgeError(params: {
  functionName: string;
  message: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "fatal";
  errorId?: string;
  bookingId?: string | null;
  userId?: string | null;
  stack?: string | null;
  context?: Record<string, unknown>;
}): Promise<void> {
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    await client.from("app_error_logs").insert({
      source: "edge",
      severity: params.severity ?? "error",
      function_name: params.functionName,
      message: (params.message || "Unknown error").slice(0, 2000),
      code: params.code?.slice(0, 120) ?? null,
      error_id: params.errorId ?? null,
      booking_id: params.bookingId ?? null,
      user_id: params.userId ?? null,
      stack: params.stack ? params.stack.slice(0, 4000) : null,
      context: (params.context ?? {}) as any,
    });
  } catch (err) {
    console.error("[error-log] failed to persist edge error", err);
  }
}
