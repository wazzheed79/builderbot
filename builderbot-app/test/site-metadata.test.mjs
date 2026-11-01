import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { absoluteCanonicalUrl, sitemapLocations } from "../lib/site-urls.mjs";
import { manifestRewrites } from "../lib/pwa-manifest.mjs";

const CANONICAL = "https://www.chuffedquotes.co.uk";

test("sitemap locations use the www host", () => {
  const locations = sitemapLocations();
  assert.ok(locations.length >= 8);
  for (const url of locations) {
    assert.equal(url.startsWith(`${CANONICAL}/`) || url === CANONICAL, true, url);
    assert.equal(url.includes("://chuffedquotes.co.uk"), false, url);
  }
  assert.ok(locations.includes(`${CANONICAL}/pricing`));
  assert.ok(locations.includes(`${CANONICAL}/try`));
  assert.ok(locations.includes(`${CANONICAL}/walkthrough`));
  assert.equal(absoluteCanonicalUrl("/sitemap.xml"), `${CANONICAL}/sitemap.xml`);
});

test("pricing, try, and the van demo publish the www address", () => {
  const pricing = readFileSync(new URL("../app/pricing/page.tsx", import.meta.url), "utf8");
  const tryPage = readFileSync(new URL("../app/try/page.tsx", import.meta.url), "utf8");
  const walkthrough = readFileSync(new URL("../app/walkthrough/page.tsx", import.meta.url), "utf8");
  assert.match(pricing, /absoluteCanonicalUrl\("\/pricing"\)/);
  assert.match(pricing, /alternates:\s*\{\s*canonical:\s*pricingUrl\s*\}/);
  assert.match(pricing, /url:\s*pricingUrl/);
  assert.match(pricing, /Build professional quotes in under 2 minutes, with no card and no paid plans/);
  assert.doesNotMatch(pricing, /\{brand\.tagline\}/);
  assert.match(tryPage, /absoluteCanonicalUrl\("\/try"\)/);
  assert.match(tryPage, /url:\s*tryUrl/);
  assert.match(walkthrough, /absoluteCanonicalUrl\("\/walkthrough"\)/);
  assert.match(walkthrough, /url:\s*walkthroughUrl/);
});

test("/site.webmanifest serves the home-screen manifest, and email pages stay in the browser", () => {
  const rewrites = manifestRewrites();
  assert.ok(rewrites.some((rule) => rule.source === "/manifest.json" && rule.destination === "/api/pwa-manifest"));
  assert.ok(
    rewrites.some((rule) => rule.source === "/site.webmanifest" && rule.destination === "/api/pwa-manifest")
  );
  const authLayout = readFileSync(new URL("../app/auth/layout.tsx", import.meta.url), "utf8");
  assert.match(authLayout, /manifest:\s*"\/api\/auth-manifest"/);
  assert.match(authLayout, /capable:\s*false/);
  assert.doesNotMatch(authLayout, /site\.webmanifest/);
  assert.doesNotMatch(authLayout, /display:\s*"standalone"/);
  assert.doesNotMatch(authLayout, /capable:\s*true/);
});
