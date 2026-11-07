import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

type Status = { enabled: boolean; customer_messaging_via_ghl: boolean; last_success: string | null; queued: number; sent_today: number; failed: number; recent_failures: { id: string; kind: string; attempts: number; error: string | null; created_at: string }[] };
const ct = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/Chicago" }) + " CT" : "Never");

export function AdminGhlSync() {
  const client = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["ghl-sync-status"],
    queryFn: async () => { const { data, error } = await (supabase.rpc as any)("ghl_sync_status"); if (error) throw error; return data as Status; },
    refetchInterval: 60_000,
  });
  const act = async (name: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(name);
    try { await fn(); toast.success(ok); client.invalidateQueries({ queryKey: ["ghl-sync-status"] }); }
    catch { toast.error("That didn't work. Nothing was changed."); }
    finally { setBusy(null); }
  };
  const setConfig = (enabled: boolean, messaging: boolean) => act("config", async () => {
    const { error } = await (supabase.rpc as any)("ghl_set_config", { _enabled: enabled, _customer_messaging_via_ghl: messaging }); if (error) throw error;
  }, "GoHighLevel settings saved");
  const backfill = (mode: "dry_run" | "run") => act(mode, async () => {
    const { data, error } = await supabase.functions.invoke("ghl-backfill", { body: { mode } }); if (error) throw error;
    toast.info(mode === "dry_run" ? `${data.bookings} upcoming/completed bookings would be sent.` : `${data.newly_queued} bookings queued for GoHighLevel.`);
  }, mode === "dry_run" ? "Dry run finished — nothing was sent" : "Backfill queued");
  const s = q.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle>GoHighLevel sync</CardTitle>
        <CardDescription>Sends customers, bookings and payments from this app to GoHighLevel. This app stays the source of truth.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : q.isError || !s ? <p className="text-sm text-destructive">Sync status is unavailable.</p> : <>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><p className="text-muted-foreground">Last success</p><p className="font-medium">{ct(s.last_success)}</p></div>
            <div><p className="text-muted-foreground">Waiting</p><p className="font-medium">{s.queued}</p></div>
            <div><p className="text-muted-foreground">Sent today</p><p className="font-medium">{s.sent_today}</p></div>
            <div><p className="text-muted-foreground">Failed</p><p className="font-medium">{s.failed}</p></div>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <span className="text-sm"><span className="font-medium">Send to GoHighLevel</span><br /><span className="text-muted-foreground">Off: changes wait in the queue and nothing is sent.</span></span>
            <Switch checked={s.enabled} disabled={!!busy} onCheckedChange={v => setConfig(v, s.customer_messaging_via_ghl)} aria-label="Send to GoHighLevel" />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <span className="text-sm"><span className="font-medium">Let GoHighLevel send customer follow-ups</span><br /><span className="text-muted-foreground">Turn on only after your GoHighLevel workflows are live. Stops this app's reminder, review-request, booking and job-update texts. Confirmation emails and your owner alerts keep running.</span></span>
            <Switch checked={s.customer_messaging_via_ghl} disabled={!!busy} onCheckedChange={v => setConfig(s.enabled, v)} aria-label="Let GoHighLevel send customer follow-ups" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!!busy || !s.failed} onClick={() => act("retry", async () => { const { error } = await (supabase.rpc as any)("ghl_retry_failed"); if (error) throw error; }, "Failed items queued again")}><RefreshCw className="mr-2 h-4 w-4" />Retry failed</Button>
            <Button variant="outline" disabled={!!busy} onClick={() => backfill("dry_run")}>Backfill dry run</Button>
            <Button variant="outline" disabled={!!busy} onClick={() => backfill("run")}>Run backfill</Button>
          </div>
          {s.recent_failures.length > 0 && <ul className="space-y-1 text-xs text-muted-foreground">{s.recent_failures.map(f => <li key={f.id}>{ct(f.created_at)} · {f.kind} · {f.error}</li>)}</ul>}
        </>}
      </CardContent>
    </Card>
  );
}
