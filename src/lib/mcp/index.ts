import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBookings from "./tools/list-bookings";
import listMemberships from "./tools/list-memberships";
import getProfile from "./tools/get-profile";

// The OAuth issuer must be the direct Supabase host, derived from the project
// ref (never SUPABASE_URL). VITE_SUPABASE_PROJECT_ID is inlined at build time.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "av-detailing-pro",
  title: "AV Detailing Pro",
  version: "0.1.0",
  instructions:
    "Read-only tools for the signed-in AV Detailing customer. Use `list_bookings` for detailing appointments, `list_memberships` for active plans, and `get_profile` for the customer's contact info.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBookings, listMemberships, getProfile],
});
