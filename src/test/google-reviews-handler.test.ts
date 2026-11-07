import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";
import { describe, expect, it, vi } from "vitest";
import * as model from "../../supabase/functions/google-reviews/model";

// Exercise the actual handler with isolated storage/auth/provider adapters, no network.
function fixture(admin = true, authenticated = true, claimed: string | null = "lease") {
  const cache = { rating: 5, total_review_count: 7, reviews: [{ reviewer: { displayName: "Fixture" }, starRating: "FIVE", createTime: "2026-11-01T00:00:00Z", updateTime: "2026-11-01T00:00:00Z" }], fetched_at: new Date(Date.now()-7200000).toISOString(), expires_at: new Date(Date.now()+7200000).toISOString(), google_maps_uri: model.GOOGLE_REVIEW_PROFILE };
  const rpc = vi.fn(async (name: string) => ({ data: name === "has_role" ? admin : name === "claim_google_reviews_refresh_lease" ? claimed : true, error: null }));
  const chain = { select: () => chain, eq: () => chain, gt: () => chain, maybeSingle: async () => ({ data: cache, error: null }) };
  const db = { from: () => chain, rpc, auth: { getUser: vi.fn(async () => ({ data: { user: authenticated ? { id: "mock-user" } : null }, error: null })) } };
  let handler: (req: Request) => Promise<Response> = async () => new Response();
  const source = readFileSync("supabase/functions/google-reviews/index.ts", "utf8").replace(/^import .*;\n/gm, "");
  const js = transformSync(source, { loader: "ts", format: "cjs" }).code;
  const keys = Object.keys(model);
  new Function("createClient", "corsHeaders", "Deno", ...keys, js)(() => db, {}, { env: { get: () => "fixture-only" }, serve: (h: typeof handler) => { handler = h; } }, ...Object.values(model));
  return { handler, rpc, cache };
}
describe("review handler authorization and lease behavior", () => {
  it("denies unsigned forced refresh before claiming or contacting Google", async () => {
    const f = fixture(true, false);
    expect((await f.handler(new Request("https://example.test", { method: "POST", body: '{"force":true}' }))).status).toBe(401);
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it("denies signed-in non-admin forced refresh", async () => {
    const f = fixture(false);
    expect((await f.handler(new Request("https://example.test", { method: "POST", body: '{"force":true}' }))).status).toBe(403);
    expect(f.rpc.mock.calls.map(c => c[0])).toEqual(["has_role"]);
  });
  it("returns retained stale snapshot when another visitor owns the lease", async () => {
    const f = fixture(true, true, null);
    const result = await f.handler(new Request("https://example.test"));
    expect(await result.json()).toEqual({ cache: f.cache, refreshing: true });
    expect(f.rpc.mock.calls.map(c => c[0])).toEqual(["claim_google_reviews_refresh_lease"]);
  });
  it("admin force uses the same claim and releases on upstream failure", async () => {
    const f = fixture();
    const fetchMock = vi.fn().mockResolvedValue(new Response("Provider unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const result = await f.handler(new Request("https://example.test", { method: "POST", body: '{"force":true}', headers: { Authorization: "Bearer fixture" } }));
      expect(result.status).toBe(503);
      expect((await result.json()).cache).toEqual(f.cache);
      expect(f.rpc).toHaveBeenCalledWith("claim_google_reviews_refresh_lease", { force_refresh: true });
      expect(f.rpc).toHaveBeenCalledWith("release_google_reviews_refresh", { claim_token: "lease" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllGlobals(); }
  });
});