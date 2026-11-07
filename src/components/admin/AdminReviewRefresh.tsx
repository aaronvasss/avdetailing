import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_GOOGLE_REVIEWS_KEY, parseLiveGoogleReviews, useLiveGoogleReviews } from "@/lib/live-google-reviews";

export function AdminReviewRefresh() {
  const query = useLiveGoogleReviews();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-reviews", { body: { force: true } });
      if (error) throw error;
      const snapshot = parseLiveGoogleReviews(data?.cache);
      if (snapshot) client.setQueryData(LIVE_GOOGLE_REVIEWS_KEY, snapshot);
      if (data?.refreshing) toast.info("A refresh is already running. Existing reviews remain visible.");
      else if (!snapshot) throw new Error("No complete review snapshot returned");
      else toast.success("Google reviews refreshed");
    } catch { toast.error("Could not refresh reviews. Your last successful snapshot is unchanged."); }
    finally { setBusy(false); }
  };
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
    <p className="text-sm text-muted-foreground">Last successful refresh: {query.data ? new Date(query.data.fetched_at).toLocaleString("en-US", { timeZone: "America/Chicago" }) + " (Central Time)" : "Not available"}</p>
    <Button variant="outline" onClick={refresh} disabled={busy}><RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />{busy ? "Refreshing…" : "Refresh reviews now"}</Button>
  </div>;
}