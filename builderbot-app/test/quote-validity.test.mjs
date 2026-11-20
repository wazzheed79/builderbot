import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateQuoteExpiry,
  clampValidityDays,
  effectiveValidityDays,
  quotesExpiringSoon,
  QUOTE_VALIDITY_MAX_DAYS,
  QUOTE_VALIDITY_MIN_DAYS,
} from "../lib/quote-rules.mjs";
import { readWorkingDraft, toCloudDraftQuote, writeWorkingDraft } from "../lib/quote-autosave.mjs";

const DAY = 24 * 60 * 60 * 1000;
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("validity days are kept between 1 and 365 whole days", () => {
  assert.equal(QUOTE_VALIDITY_MIN_DAYS, 1);
  assert.equal(QUOTE_VALIDITY_MAX_DAYS, 365);
  assert.equal(clampValidityDays(14), 14);
  assert.equal(clampValidityDays("21"), 21);
  assert.equal(clampValidityDays(7.6), 8);
  assert.equal(clampValidityDays(900), 365);
  for (const blank of [null, undefined, "", "abc", 0, -3, Number.NaN, Infinity]) {
    assert.equal(clampValidityDays(blank), null, String(blank));
  }
});

test("a quote's own validity wins over the business default", () => {
  assert.equal(effectiveValidityDays({ validityDays: 14 }, 30), 14);
  assert.equal(effectiveValidityDays({}, 45), 45, "older quotes fall back to the setting");
  assert.equal(effectiveValidityDays(null, undefined), 30, "nothing set means 30 days");
  assert.equal(effectiveValidityDays({ validityDays: 0 }, "60"), 60);
});

test("changing the setting later does not move a sent quote's expiry", () => {
  const quote = { createdAt: "2026-11-01", validityDays: 30 };
  const now = Date.parse("2026-11-10T12:00:00Z");
  const before = calculateQuoteExpiry(quote.createdAt, effectiveValidityDays(quote, 30), now);
  const after = calculateQuoteExpiry(quote.createdAt, effectiveValidityDays(quote, 7), now);
  assert.equal(after.expiryDateIso, before.expiryDateIso);
  assert.equal(after.isExpired, false);
});

test("expiring soon lists sent, undecided quotes ending within 3 days, soonest first", () => {
  const now = Date.parse("2026-11-18T09:00:00Z");
  const ago = (days) => new Date(now - days * DAY).toISOString();
  const quotes = [
    { id: "two-left", status: "Sent", createdAt: ago(28), validityDays: 30, clientName: "A", total: 100 },
    { id: "plenty", status: "Sent", createdAt: ago(5), validityDays: 30 },
    { id: "ends-today", status: "Viewed", createdAt: ago(13.8), validityDays: 14 },
    { id: "gone", status: "Sent", createdAt: ago(31), validityDays: 30 },
    { id: "draft", status: "Draft", createdAt: ago(29), validityDays: 30 },
    { id: "won", status: "Accepted", createdAt: ago(29), validityDays: 30 },
    { id: "lost", status: "Declined", createdAt: ago(29), validityDays: 30 },
    { id: "old-quote", status: "Sent", createdAt: ago(5) },
  ];
  const rows = quotesExpiringSoon(quotes, 7, now, 3);
  assert.deepEqual(
    rows.map((row) => row.quote.id),
    ["ends-today", "two-left", "old-quote"]
  );
  assert.equal(rows[0].daysLeft, 1);
  assert.equal(rows[1].daysLeft, 2);
  assert.equal(rows[2].validityDays, 7, "older quotes use the business default");
  assert.deepEqual(quotesExpiringSoon([], 30, now), []);
  assert.deepEqual(quotesExpiringSoon(undefined, 30, now), []);
});

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

test("validity survives a refresh and goes up with the cloud draft", () => {
  const storage = memoryStorage();
  writeWorkingDraft(storage, { notesInput: "Fit a new door", validityDays: 14 }, "2026-11-18T08:00:00.000Z");
  assert.equal(readWorkingDraft(storage).validityDays, 14);
  const cloud = toCloudDraftQuote({ notesInput: "Fit a new door", items: [], validityDays: 14 }, "2026-11-18");
  assert.equal(cloud.validityDays, 14);
  const blank = toCloudDraftQuote({ notesInput: "Fit a new door", items: [] }, "2026-11-18");
  assert.equal(blank.validityDays, undefined);
});

test("the app still saves quotes if the validity column has not been added yet", () => {
  const source = read("lib/supabase.ts");
  assert.match(source, /OPTIONAL_QUOTE_COLUMNS[^;]*"validity_days"/s);
  assert.match(source, /validity_days:\s*clampValidityDays\(quote\.validityDays\)/);
  assert.match(source, /validity_days\/i/);
  assert.match(source, /validityDays:\s*clampValidityDays\(row\.validity_days\)/);
});

test("customer page, local saves and the editor use the quote's own validity", () => {
  assert.match(read("app/q/[id]/CustomerQuoteClient.tsx"), /effectiveValidityDays\(loadedQuote, activeProfile\.quoteValidityDays\)/);
  assert.match(read("lib/storage.ts"), /effectiveValidityDays\(existing, profile\.quoteValidityDays\)/);
  assert.match(read("app/quotes/QuotesClient.tsx"), /id="quote-validity-days"/);
  assert.match(read("lib/supabase-server.ts"), /validity_days:\s*raw\.validityDays/);
});

test("the migration adds the column and both database functions use it", () => {
  const sql = read("supabase/migrations/20261120120000_quote_validity_days.sql");
  assert.match(sql, /ALTER TABLE public\.quotes ADD COLUMN IF NOT EXISTS validity_days INT;/);
  assert.match(sql, /quotes_validity_days_range/);
  assert.equal((sql.match(/v_validity_days := v_quote\.validity_days;/g) || []).length, 2);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.get_public_quote\(/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.submit_public_quote_decision\(/);
  assert.match(sql, /FOR UPDATE/, "the decision lock stays");
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.get_public_quote\(TEXT\) TO anon, authenticated, service_role;/);
  assert.match(sql, /submit_public_quote_decision\(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT\) FROM anon;/);
  assert.match(sql, /submit_public_quote_decision\(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT\) TO service_role;/);

  const schema = read("supabase/schema.sql");
  assert.match(schema, /ADD COLUMN IF NOT EXISTS validity_days INT;/);
  assert.equal((schema.match(/v_validity_days := v_quote\.validity_days;/g) || []).length, 2);
});

test("the dashboard shows the expiring soon card", () => {
  assert.match(read("app/dashboard/page.tsx"), /<ExpiringSoon \/>/);
  const card = read("components/dashboard/ExpiringSoon.tsx");
  assert.match(card, /quotesExpiringSoon\(/);
  assert.match(card, /return null/);
});

test("quote links share a proper preview and stay out of search", () => {
  const page = read("app/q/[id]/page.tsx");
  assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(page, /siteName:\s*brand\.name/);
  assert.match(page, /locale:\s*"en_GB"/);
  assert.match(page, /url:\s*`\/q\/\$\{id\}`/);
  assert.match(page, /width:\s*1200,\s*height:\s*630/);
  const server = read("lib/supabase-server.ts");
  assert.match(server, /const lookupPublicQuote = cache\(/);
  assert.equal((server.match(/rpc\("get_public_quote"/g) || []).length, 1, "one cached lookup");
});
