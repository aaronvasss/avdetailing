import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GOOGLE_REVIEWS_URL } from "@/lib/google-business";
import { featuredReviewSchema, loadFeaturedReviews, saveFeaturedReviews, type FeaturedGoogleReview } from "@/lib/featured-google-reviews";

const blank: FeaturedGoogleReview = { reviewer_name: "", rating: 5, review_date: "", text: "", source_url: GOOGLE_REVIEWS_URL };

export function AdminGoogleReviews() {
  const [reviews, setReviews] = useState<FeaturedGoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState(blank);
  const [formError, setFormError] = useState("");
  const load = async () => {
    setLoading(true); setFailed(false);
    try { setReviews(await loadFeaturedReviews(AbortSignal.timeout(15000))); }
    catch { setFailed(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const open = (index: number) => { setDraft(reviews[index] ?? { ...blank }); setEditing(index); setFormError(""); };
  const apply = () => {
    const parsed = featuredReviewSchema.safeParse(draft);
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Check the review fields."); return; }
    if (editing === null) return;
    setReviews((items) => { const next = [...items]; next[editing] = parsed.data; return next; });
    setDirty(true); setEditing(null);
  };
  const move = (index: number, offset: number) => {
    setReviews((items) => { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
    setDirty(true);
  };
  const save = async () => {
    setSaving(true);
    try { setReviews(await saveFeaturedReviews(reviews)); setDirty(false); toast.success("Google reviews saved"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save reviews. Try again."); }
    finally { setSaving(false); }
  };
  return (
    <section aria-label="Featured Google reviews" className="space-y-4 border-b border-border pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Featured Google Reviews</h2>
        <Button onClick={save} disabled={saving || loading || failed || !dirty || reviews.length !== 3}><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save Reviews"}</Button>
      </div>
      <p className="text-sm text-muted-foreground">Use exactly three genuine Google reviews. Keep the original reviewer, rating, date and text. Changes appear on both pages after saving.</p>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading reviews" /> : failed ? <div role="alert">Could not load reviews. <Button variant="outline" onClick={load}>Try Again</Button></div> : <>
        {reviews.map((review, index) => <div key={index} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
          <span className="text-primary font-bold">{index + 1}</span>
          <div className="min-w-0 flex-1 basis-32"><p className="break-words font-semibold">{review.reviewer_name}</p><p className="text-xs text-muted-foreground">{review.rating} stars · {review.review_date}</p></div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" title="Move up" aria-label={`Move ${review.reviewer_name} up`} disabled={index === 0 || saving} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Move down" aria-label={`Move ${review.reviewer_name} down`} disabled={index === reviews.length - 1 || saving} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Edit or replace review" aria-label={`Edit ${review.reviewer_name}`} disabled={saving} onClick={() => open(index)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Remove from selection" aria-label={`Remove ${review.reviewer_name}`} disabled={saving} onClick={() => { setReviews(items => items.filter((_, i) => i !== index)); setDirty(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>)}
        {reviews.length < 3 && <Button variant="outline" onClick={() => open(reviews.length)}><Plus className="mr-2 h-4 w-4" />Add Google Review</Button>}
        {dirty && <p role="status" className="text-sm text-primary">{reviews.length === 3 ? "Unsaved changes" : "Add a replacement to save exactly three reviews."}</p>}
      </>}
      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing !== null && editing < reviews.length ? "Edit or Replace Google Review" : "Add Google Review"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={event => { event.preventDefault(); apply(); }}>
            <div className="space-y-2"><Label htmlFor="review-name">Reviewer name</Label><Input id="review-name" value={draft.reviewer_name} onChange={e => setDraft({ ...draft, reviewer_name: e.target.value })} required maxLength={160} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Original rating</Label><Select value={String(draft.rating)} onValueChange={v => setDraft({ ...draft, rating: Number(v) })}><SelectTrigger aria-label="Original rating"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(v => <SelectItem key={v} value={String(v)}>{v} stars</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="review-date">Review date</Label><Input id="review-date" type="date" value={draft.review_date} onChange={e => setDraft({ ...draft, review_date: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="review-text">Original Google review text</Label><Textarea id="review-text" rows={7} value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} required maxLength={10000} /></div>
            <div className="space-y-2"><Label htmlFor="review-url">View on Google link</Label><Input id="review-url" type="url" value={draft.source_url} onChange={e => setDraft({ ...draft, source_url: e.target.value })} required /></div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full">Apply Review</Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}