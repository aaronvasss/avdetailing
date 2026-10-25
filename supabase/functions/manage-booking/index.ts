import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createManageHandler } from "./handler.ts";
const url = Deno.env.get("SUPABASE_URL") ?? "";
const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
Deno.serve(createManageHandler({ db, cors: corsHeaders, now: () => new Date(), authenticate: async (header) => {
  const { data, error } = await createClient(url, anon, { global: { headers: { Authorization: header } } }).auth.getUser();
  return error ? null : data.user?.id ?? null;
} }));
