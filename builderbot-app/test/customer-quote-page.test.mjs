import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the terms error sits under the checkbox and does not replace it", () => {
  const page = readFileSync(new URL("../app/q/[id]/CustomerQuoteClient.tsx", import.meta.url), "utf8");
  assert.match(page, /id="acceptance-terms"/);
  assert.match(page, /aria-describedby=\{decisionError === TERMS_ERROR \? "acceptance-terms-error" : undefined\}/);
  assert.match(page, /id="acceptance-terms-error"/);
  assert.match(page, /I agree to the terms, scope of work/);
  assert.match(page, /if \(e\.target\.checked\) setDecisionError\(null\)/);
});

test("progress steps use green for done, slate for the current step, and red only when declined or expired", () => {
  const page = readFileSync(new URL("../app/q/[id]/CustomerQuoteClient.tsx", import.meta.url), "utf8");
  assert.match(page, /state === "done"[\s\S]*bg-emerald-100/);
  assert.match(page, /state === "current"[\s\S]*bg-slate-900/);
  assert.match(page, /state === "problem"[\s\S]*bg-rose-100/);
  assert.match(page, /label: "3\. Declined"/);
  assert.match(page, /label: "3\. Expired"/);
  assert.equal(page.includes("bg-clay-700 text-white ring-4 ring-clay-100"), false);
});

test("the customer quote route shows a loading state instead of a blank page", () => {
  const loading = readFileSync(new URL("../app/q/[id]/loading.tsx", import.meta.url), "utf8");
  assert.match(loading, /Opening customer link/);
  const quotes = readFileSync(new URL("../app/quotes/QuotesClient.tsx", import.meta.url), "utf8");
  assert.match(quotes, /Opening customer link…/);
  assert.match(quotes, /Send by email/);
  assert.match(quotes, /getEmailShareUrl/);
  assert.match(quotes, /publishQuote\("Sent"\)/);
});
