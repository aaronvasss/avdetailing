import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GOOGLE_REVIEW_SUMMARY_KEY, parseGoogleReviewSummary } from "@/lib/google-review-summary";
import { toast } from "sonner";

export function AdminGoogleRatingSettings() {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState("");
  const [count, setCount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.from("business_settings").select("value").eq("key", GOOGLE_REVIEW_SUMMARY_KEY).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      setFailed(Boolean(error));
      const value = parseGoogleReviewSummary(data?.value);
      setRating(value ? String(value.rating) : "");
      setCount(value ? String(value.count) : "");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const save = async () => {
    const empty = !rating.trim() && !count.trim();
    const value = JSON.stringify({ rating: Number(rating), count: Number(count) });
    if (!empty && !parseGoogleReviewSummary(value)) { toast.error("Enter a rating from 1 to 5 and a positive whole review count, or clear both fields."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("business_settings").upsert({ key: GOOGLE_REVIEW_SUMMARY_KEY, value: empty ? "" : value, description: "Owner-verified overall Google listing rating and review count" }, { onConflict: "key" });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: [GOOGLE_REVIEW_SUMMARY_KEY] });
      toast.success("Google review badge updated");
    } catch { toast.error("Could not save Google review values"); }
    finally { setSaving(false); }
  };
  return <Card>
    <CardHeader><CardTitle>Google rating badge</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter the current rating and total from your Google listing. Leave both empty to hide the badge.</p>
      {failed && <p className="text-sm text-destructive">Could not load saved values. Reload before editing.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="google-rating">Google rating</Label><Input id="google-rating" type="number" min="1" max="5" step="0.1" value={rating} onChange={e => setRating(e.target.value)} disabled={loading || failed} /></div>
        <div className="space-y-2"><Label htmlFor="google-count">Total Google reviews</Label><Input id="google-count" type="number" min="1" step="1" value={count} onChange={e => setCount(e.target.value)} disabled={loading || failed} /></div>
      </div>
      <Button onClick={save} disabled={loading || failed || saving}>{saving ? "Saving…" : "Save Google rating"}</Button>
    </CardContent>
  </Card>;
}