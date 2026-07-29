import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_bookings",
  title: "List my bookings",
  description:
    "List detailing bookings for the signed-in AV Detailing customer, most recent first.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Maximum number of bookings to return (default 10)."),
    status: z
      .enum(["pending", "confirmed", "in_progress", "completed", "canceled"])
      .optional()
      .describe("Optional status filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return {
        content: [{ type: "text", text: "Not authenticated" }],
        isError: true,
      };
    }
    let query = supabaseForUser(ctx)
      .from("bookings")
      .select(
        "id, scheduled_date, scheduled_time, service_type, package_name, status, payment_status, total_price, vehicle_make, vehicle_model, service_address, notes",
      )
      .eq("user_id", ctx.getUserId())
      .order("scheduled_date", { ascending: false })
      .limit(limit ?? 10);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return {
        content: [{ type: "text", text: error.message }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { bookings: data ?? [] },
    };
  },
});
