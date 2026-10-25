import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { createCancellationHandler } from "./handler.ts";
import { verifyAppointmentLink } from "../_shared/appointment-links.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const schema = z.object({ bookingId: z.string().uuid(), expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expectedTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/), reason: z.string().trim().max(1000).optional(), manageToken: z.string().min(32).max(100).optional() });
Deno.serve(createCancellationHandler({
  db, cors: corsHeaders, now: () => new Date(),
  verifyLink: (id, token) => verifyAppointmentLink(db, id, token, new Date()),
  parse: (body) => { const result = schema.safeParse(body); return result.success ? result.data : null; },
  authenticate: async (authorization) => {
    const { data, error } = await createClient(url, anon, { global: { headers: { Authorization: authorization } } }).auth.getUser();
    return error ? null : data.user?.id ?? null;
  },
}));
