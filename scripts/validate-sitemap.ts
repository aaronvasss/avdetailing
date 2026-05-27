/**
 * Validates public/sitemap.xml:
 *   1. Parses it as well-formed XML.
 *   2. Extracts every <loc> URL.
 *   3. Fetches each URL and asserts the response is 200 or 301.
 *
 * Usage:
 *   bun scripts/validate-sitemap.ts                 # uses URLs as-is in sitemap
 *   BASE_URL=https://avdetailing.net bun scripts/validate-sitemap.ts
 *   bun scripts/validate-sitemap.ts --skip-fetch    # XML validation only
 *
 * Exits non-zero on any failure so it can gate a CI deploy.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser, XMLValidator } from "fast-xml-parser";

const SITEMAP_PATH = resolve(process.cwd(), "public/sitemap.xml");
const SKIP_FETCH = process.argv.includes("--skip-fetch");
const BASE_URL_OVERRIDE = process.env.BASE_URL?.replace(/\/$/, "");
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 8);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 15000);
const ACCEPTED_STATUSES = new Set([200, 301]);

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!existsSync(SITEMAP_PATH)) {
  fail(`sitemap not found at ${SITEMAP_PATH}`);
}

const xml = readFileSync(SITEMAP_PATH, "utf8");

const validation = XMLValidator.validate(xml, { allowBooleanAttributes: true });
if (validation !== true) {
  fail(`sitemap.xml is not well-formed XML: ${validation.err.msg} (line ${validation.err.line})`);
}
console.log("✅ sitemap.xml is well-formed XML");

const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
const urlset = parsed.urlset?.url;
if (!urlset) fail("sitemap.xml is missing <urlset>/<url> entries");

const entries: string[] = (Array.isArray(urlset) ? urlset : [urlset])
  .map((e: any) => (typeof e === "string" ? e : e.loc))
  .filter((u: unknown): u is string => typeof u === "string" && u.length > 0);

if (entries.length === 0) fail("sitemap.xml contains no <loc> URLs");
console.log(`✅ Found ${entries.length} URLs in sitemap.xml`);

if (SKIP_FETCH) {
  console.log("⏭️  --skip-fetch passed, skipping URL reachability checks");
  process.exit(0);
}

function resolveUrl(loc: string): string {
  if (!BASE_URL_OVERRIDE) return loc;
  try {
    const u = new URL(loc);
    return `${BASE_URL_OVERRIDE}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return `${BASE_URL_OVERRIDE}${loc.startsWith("/") ? "" : "/"}${loc}`;
  }
}

async function check(url: string): Promise<{ url: string; status: number | string; ok: boolean }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "manual", signal: ctrl.signal });
    // Some hosts disallow HEAD — retry GET.
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", redirect: "manual", signal: ctrl.signal });
    }
    return { url, status: res.status, ok: ACCEPTED_STATUSES.has(res.status) };
  } catch (e: any) {
    return { url, status: e?.name === "AbortError" ? "TIMEOUT" : `ERROR:${e?.message ?? e}`, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

const targets = entries.map(resolveUrl);
console.log(`🔎 Checking ${targets.length} URLs (concurrency=${CONCURRENCY})…`);

const results: Awaited<ReturnType<typeof check>>[] = [];
let cursor = 0;
async function worker() {
  while (cursor < targets.length) {
    const i = cursor++;
    const r = await check(targets[i]);
    results.push(r);
    const mark = r.ok ? "✅" : "❌";
    console.log(`${mark} ${r.status}  ${r.url}`);
  }
}
await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, worker));

const failures = results.filter((r) => !r.ok);
if (failures.length > 0) {
  console.error(`\n❌ ${failures.length} of ${results.length} URLs failed (must be 200 or 301).`);
  process.exit(1);
}
console.log(`\n✅ All ${results.length} URLs returned 200/301.`);
