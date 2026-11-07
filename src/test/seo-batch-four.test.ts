import { describe, expect, it } from "vitest";
import { CERAMIC_COST, CERAMIC_COST_ROWS, CERAMIC_COST_FAQS } from "@/lib/ceramic-cost";
import { SERVICE_EXPECTATIONS, serviceExpectationsHtml } from "@/lib/service-expectations";
import { newestReviews, publicReview, validTotals } from "../../supabase/functions/google-reviews/model";
import { parseLiveGoogleReviews } from "@/lib/live-google-reviews";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { seedSeoAssets } from "./helpers/seo-assets";

const review = (day: number) => ({ reviewer: { displayName: `Fixture ${day}` }, starRating: "FIVE", comment: "Mock only", createTime: `2026-10-${String(day).padStart(2,"0")}T12:00:00Z`, updateTime: "2026-11-06T12:00:00Z" });
describe("ceramic price guide", () => {
  it("preserves exact booking prices and legacy key", () => expect(CERAMIC_COST_ROWS.map(r => [r.key, r.label, r.car, r.suvTruck])).toEqual([
    ["3-year", "3-Year", 850, 950], ["5-year", "6-Year", 1300, 1400], ["10-year", "10-Year", 1700, 1800],
  ]));
  it("has bounded metadata and useful FAQs", () => {
    expect(CERAMIC_COST.title.length).toBeLessThanOrEqual(60); expect(CERAMIC_COST.description.length).toBeLessThanOrEqual(155);
    expect(CERAMIC_COST_FAQS.length).toBeGreaterThanOrEqual(4);
  });
  it("shared initial HTML matches FAQs, expectations and exact prices", () => {
    const temp=mkdtempSync(join(tmpdir(),"seo-four-"));
    try {
      mkdirSync(join(temp,"dist")); seedSeoAssets(temp); copyFileSync(resolve("index.html"),join(temp,"dist/index.html"));
      execFileSync(resolve("node_modules/.bin/tsx"),[resolve("scripts/postbuild-seo.ts")],{cwd:temp,stdio:"pipe"});
      for (const [path,value] of Object.entries(SERVICE_EXPECTATIONS)) {
        const html=readFileSync(join(temp,`dist${path}/index.html`),"utf8");
        expect(html).toContain(serviceExpectationsHtml(path));
        const faqNodes=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const s=JSON.parse(m[1]);return Array.isArray(s)?s:[s];}).filter(s=>s["@type"]==="FAQPage");
        expect(faqNodes).toHaveLength(1);
        if (value.faqs.length) expect(faqNodes[0].mainEntity.map((q:{name:string})=>q.name)).toEqual(value.faqs.map(q=>q.question));
      }
      const cost=readFileSync(join(temp,`dist${CERAMIC_COST.path}/index.html`),"utf8");
      for (const row of CERAMIC_COST_ROWS) {expect(cost).toContain(`$${row.car.toLocaleString("en-US")}`);expect(cost).toContain(`$${row.suvTruck.toLocaleString("en-US")}`);}
    } finally {rmSync(temp,{recursive:true,force:true});}
  },60000);
});
describe("provider-only review data",()=>{
  it("selects five newest by creation, not update/reply order",()=>expect(newestReviews([review(1),review(9),review(4),review(10),review(2),review(3)]).map(r=>r.reviewer.displayName)).toEqual(["Fixture 10","Fixture 9","Fixture 4","Fixture 3","Fixture 2"]));
  it("does not store owner replies, media or account IDs",()=>expect(publicReview({...review(1),reviewReply:{comment:"private"},name:"account",reviewId:"id"})).toEqual(review(1)));
  it("rejects invalid star/count data",()=>{expect(validTotals(6,20)).toBe(false);expect(validTotals(4.8,0)).toBe(false);expect(validTotals(4.8,1.5)).toBe(false);expect(validTotals(4.8,20)).toBe(true);});
  it("rejects malformed reviews rather than displaying partial selections",()=>expect(()=>newestReviews([{...review(1),starRating:"INVALID"}])).toThrow());
  const now=Date.parse("2026-11-07T12:00:00Z");
  const cached={rating:4.8,total_review_count:20,reviews:[review(1)],google_maps_uri:"https://www.google.com/maps?cid=7061043489708478604",fetched_at:"2026-11-07T00:00:00Z",expires_at:"2026-11-08T00:00:00Z"};
  it("accepts unexpired complete provider cache",()=>expect(parseLiveGoogleReviews(cached,now)?.total_review_count).toBe(20));
  it("hides expired content",()=>expect(parseLiveGoogleReviews(cached,Date.parse(cached.expires_at))).toBeNull());
  it("hides empty, forged or overretained data",()=>{expect(parseLiveGoogleReviews({...cached,reviews:[]},now)).toBeNull();expect(parseLiveGoogleReviews({...cached,google_maps_uri:"https://example.com"},now)).toBeNull();expect(parseLiveGoogleReviews({...cached,expires_at:"2026-12-01T00:00:00Z"},now)).toBeNull();});
  it("removes live provider content from captured initial HTML",()=>{
    const temp=mkdtempSync(join(tmpdir(),"reviews-capture-"));
    try {
      mkdirSync(join(temp,"dist"));seedSeoAssets(temp);
      const shell=readFileSync("index.html","utf8").replace('<div id="root"></div>', '<div id="root"><h1>Captured home</h1><section data-live-google-content>temporary-provider-text</section><a data-live-google-content>temporary-provider-rating</a></div>');
      requireWrite(join(temp,"dist/index.html"),shell);
      execFileSync(resolve("node_modules/.bin/tsx"),[resolve("scripts/postbuild-seo.ts")],{cwd:temp,stdio:"pipe"});
      const out=readFileSync(join(temp,"dist/index.html"),"utf8");
      expect(out).not.toContain("temporary-provider-text");expect(out).not.toContain("temporary-provider-rating");
    }finally{rmSync(temp,{recursive:true,force:true});}
  },60000);
});