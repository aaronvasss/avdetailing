import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { createCancellationHandler } from "./handler.ts";
import { notifyCancellationOwner } from "./owner-notification.ts";
import { logEdgeError } from "../_shared/error-log.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const schema = z.object({ bookingId: z.string().uuid(), expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expectedTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/), reason: z.string().trim().max(1000).optional() });
Deno.serve(createCancellationHandler({
  db, cors: corsHeaders, now: () => new Date(),
  parse: (body) => { const result = schema.safeParse(body); return result.success ? result.data : null; },
  authenticate: async (authorization) => {
    const { data, error } = await createClient(url, anon, { global: { headers: { Authorization: authorization } } }).auth.getUser();
    return error ? null : data.user?.id ?? null;
  },
  logFailure: (bookingId, message) => logEdgeError({ functionName: "cancel-customer-booking", bookingId, message, code: "OWNER_CANCELLATION_NOTIFICATION_FAILED" }),
  notify: (notice) => notifyCancellationOwner(notice, {
    env: (key) => Deno.env.get(key), fetch,
    record: async (channel, recipient, status, error) => {
      const { error: logError } = await db.from("booking_notification_log").insert({ booking_id: notice.bookingId,
        notification_type: `owner_cancellation_${channel}`, recipient, status, error_message: error ?? null });
      if (logError) throw new Error("Owner notification delivery log could not be saved.");
    },
    failure: ({ channel, message }) => logEdgeError({ functionName: "cancel-customer-booking", bookingId: notice.bookingId,
      code: "OWNER_CANCELLATION_NOTIFICATION_FAILED", message, context: { channel, revision: notice.revision, cancellationSaved: true } }),
  }),
}));