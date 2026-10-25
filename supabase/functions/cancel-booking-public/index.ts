import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
// Retired mutation endpoint: current and legacy web routes use the validated customer writer.
Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(JSON.stringify({ error: "Reopen your appointment email link to review and confirm cancellation securely." }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
