import { describe, expect, it } from "vitest";
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { JSDOM } from "jsdom";
import { render, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "@/pages/NotFound";
import { LOCATION_PAGES, NEW_LOCATION_AREAS } from "@/data/locationPages";
import { OWNER_SERVICE_AREAS, NOT_OFFERED, nearbyAreaLinks, HOME_LOCAL_FAQS } from "@/lib/local-expansion";
import { PUBLIC_PAYMENT_ANSWER } from "@/lib/public-business-facts";
import { localBusinessSchema } from "@/components/seo/schema";
import { schemaHasType } from "@/lib/schema-node";
import { faqSchema } from "@/components/seo/JsonLd";
import { buildFaqs } from "@/components/home/FAQSection";
import { buildPricing, FALLBACK_PACKAGES, FALLBACK_PLANS } from "@/lib/pricing";
import { seedSeoAssets } from "./helpers/seo-assets";

describe("owner local SEO expansion", () => {
  it("has twelve unique location H1s, titles, descriptions and four owner entry routes", () => {
    expect(LOCATION_PAGES).toHaveLength(12);
    for (const field of ["titleH1", "titleTag", "metaDescription"] as const) expect(new Set(LOCATION_PAGES.map(p => p[field])).size).toBe(12);
    expect(NEW_LOCATION_AREAS.map(p => p.slug)).toEqual(["car-detailing-baker-la", "car-detailing-port-allen-la", "car-detailing-brusly-la", "car-detailing-perkins-road-baton-rouge"]);
    for (const p of LOCATION_PAGES) { expect(`${p.titleTag} | AV Detailing`.length).toBeLessThan(60); expect(p.metaDescription.length).toBeLessThan(155); }
    for (const p of NEW_LOCATION_AREAS) expect(readFileSync("vite.config.ts", "utf8")).toContain(`"/${p.slug}"`);
  });
  it("uses confirmed parishes and served neighborhood names without adding landmarks", () => {
    expect(NEW_LOCATION_AREAS[0].geography).toContain("East Baton Rouge Parish");
    for (const p of NEW_LOCATION_AREAS.slice(1,3)) { expect(p.geography).toContain("West Baton Rouge Parish"); expect(p.geography).toContain("across the Mississippi River"); }
    for (const name of ["Southdowns", "LSU Lakes", "Country Club of Louisiana", "Mira Vista"]) expect(NEW_LOCATION_AREAS[3].neighborhoods).toContain(name);
    expect(LOCATION_PAGES[0].neighborhoods).toContain("Bocage");
  });
  it("gives every location three nearby public links, never itself", () => {
    const publicPaths = new Set(["/car-detailing-baton-rouge", ...LOCATION_PAGES.map(p => `/${p.slug}`)]);
    for (const p of LOCATION_PAGES) { const links = nearbyAreaLinks(p.slug); expect(links).toHaveLength(3); for (const l of links) { expect(publicPaths.has(l.href)).toBe(true); expect(l.href).not.toBe(`/${p.slug}`); } }
    expect(nearbyAreaLinks("car-detailing-port-allen-la")[0].href).toBe("/car-detailing-brusly-la");
  });
  it("keeps exact identity and five requested methods without review schema", () => {
    const s = localBusinessSchema();
    expect(s["@type"]).toEqual(["AutoWash", "LocalBusiness"]); expect(s["@id"]).toBe("https://avdetailing.net/#business");
    expect(s.legalName).toBe("AV Detailing LLC"); expect(s.founder).toEqual({ "@type": "Person", name: "Aaron Vasquez" });
    expect(s.paymentAccepted).toBe("Cash, Credit Card, Debit Card, Cash App, Venmo"); expect(s).not.toHaveProperty("aggregateRating");
  });
  it("shares homepage payment, area and excluded-service answers with FAQ schema", () => {
    const faqs = buildFaqs(buildPricing(FALLBACK_PACKAGES, FALLBACK_PLANS));
    const payment = faqs.find(f => f.question === "What payment methods do you accept?");
    expect(payment?.answer).toBe(PUBLIC_PAYMENT_ANSWER); expect(payment?.answer).toContain("Membership plans use recurring billing");
    expect(faqSchema(faqs).mainEntity.find(q => q.name === payment?.question)?.acceptedAnswer.text).toBe(payment?.answer);
    for (const area of OWNER_SERVICE_AREAS) expect(faqs.find(f => f.question === "What areas do you service?")?.answer).toContain(area);
    for (const service of NOT_OFFERED) expect(faqs.find(f => f.question === "What services do you not offer?")?.answer).toContain(service);
  });
  it("llms points only at indexable public pages and includes all owner areas", () => {
    const txt = readFileSync("public/llms.txt", "utf8"); const sitemap = readFileSync("public/sitemap.xml", "utf8");
    for (const m of txt.matchAll(/\]\((\/[^)]*)\)/g)) expect(sitemap).toContain(`<loc>https://avdetailing.net${m[1]}</loc>`);
    expect(txt).not.toContain("/rv-interior-detailing-baton-rouge"); expect(txt).toContain("RV services are exterior-only");
    for (const area of OWNER_SERVICE_AREAS) expect(txt).toContain(area);
    for (const p of NEW_LOCATION_AREAS) expect(sitemap).toContain(`<loc>https://avdetailing.net/${p.slug}</loc>`);
  });
  it("initial HTML shares nearby links, identity, FAQ facts and safe optional 404", () => {
    const temp = mkdtempSync(join(tmpdir(),"local-expansion-"));
    try {
      mkdirSync(join(temp,"dist"));seedSeoAssets(temp);copyFileSync(resolve("index.html"),join(temp,"dist/index.html"));
      // A captured mixed legacy/array business must normalize to one current node.
      const shell=readFileSync(join(temp,"dist/index.html"),"utf8").replace("</head>",'<script type="application/ld+json">[{"@type":"LocalBusiness"},{"@type":["AutoWash","LocalBusiness"]}]</script></head>');
      writeFileSync(join(temp,"dist/index.html"),shell);
      execFileSync(resolve("node_modules/.bin/tsx"),[resolve("scripts/postbuild-seo.ts")],{cwd:temp,stdio:"pipe"});
      for (const p of LOCATION_PAGES) {
        const dom=new JSDOM(readFileSync(join(temp,`dist/${p.slug}/index.html`),"utf8"));const d=dom.window.document;
        const nodes=[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(n=>{const s=JSON.parse(n.textContent??"{}");return Array.isArray(s)?s:[s];});
        expect(nodes.filter(n=>schemaHasType(n,"LocalBusiness"))).toEqual([localBusinessSchema()]);
        expect(nodes.find(n=>n["@type"]==="Service")?.areaServed.name).toBe(p.city);
        for(const l of nearbyAreaLinks(p.slug)) expect(d.querySelector(`a[href="${l.href}"]`)).not.toBeNull();
        expect(d.querySelector('a[href="sms:2255216264"]')).not.toBeNull();dom.window.close();
      }
      const home=new JSDOM(readFileSync(join(temp,"dist/index.html"),"utf8"));const nodes=[...home.window.document.querySelectorAll('script[type="application/ld+json"]')].flatMap(n=>{const s=JSON.parse(n.textContent??"{}");return Array.isArray(s)?s:[s];});
      expect(nodes.find(n=>n["@type"]==="FAQPage")?.mainEntity.map((q:{name:string;acceptedAnswer:{text:string}})=>({question:q.name,answer:q.acceptedAnswer.text}))).toEqual([...HOME_LOCAL_FAQS,{question:"What payment methods do you accept?",answer:PUBLIC_PAYMENT_ANSWER}]);home.window.close();
      const d=new JSDOM(readFileSync(join(temp,"dist/404.html"),"utf8")).window.document;
      expect(d.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, follow");expect(d.querySelector('link[rel="canonical"]')).toBeNull();expect(d.querySelector("h1")?.textContent).toBe("Page not found");
    }finally{rmSync(temp,{recursive:true,force:true});}
  },60000);
  it("NotFound removes homepage canonical and gives noindex follow with recovery links", async () => {
    document.head.innerHTML='<link rel="canonical" href="https://avdetailing.net/"><meta name="robots" content="index, follow">';
    const screen=render(<HelmetProvider><MemoryRouter initialEntries={["/unknown-local-seo-check"]}><NotFound /></MemoryRouter></HelmetProvider>);
    await waitFor(()=>expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, follow"));
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();for(const name of ["Home","Services","Service Areas","Book"])expect(screen.getByRole("link",{name})).toBeTruthy();cleanup();
  });
});