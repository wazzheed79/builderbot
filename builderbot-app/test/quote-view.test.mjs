// Quote opens. The same visitor inside 24 hours does not count again.
// The SQL function uses this same window. See the migration named in the test below.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  QUOTE_VIEW_WINDOW_SECONDS,
  hashVisitorId,
  isVisitorId,
  newVisitorId,
  shouldCountQuoteView,
} from "../lib/quote-view.mjs";

const migration = readFileSync(
  new URL("../supabase/migrations/20261021110000_rate_limits_and_view_dedupe.sql", import.meta.url),
  "utf8"
);

test("a repeat open inside a day does not count, and the next day does", () => {
  assert.equal(QUOTE_VIEW_WINDOW_SECONDS, 24 * 60 * 60);
  const now = Date.parse("2026-10-21T12:00:00.000Z");
  assert.equal(shouldCountQuoteView(null, now), true);
  assert.equal(shouldCountQuoteView("", now), true);
  const recent = new Date(now - 60 * 60 * 1000).toISOString();
  assert.equal(shouldCountQuoteView(recent, now), false);
  const justInside = new Date(now - QUOTE_VIEW_WINDOW_SECONDS * 1000 + 1).toISOString();
  assert.equal(shouldCountQuoteView(justInside, now), false);
  const exactlyOneDay = new Date(now - QUOTE_VIEW_WINDOW_SECONDS * 1000).toISOString();
  assert.equal(shouldCountQuoteView(exactlyOneDay, now), true);
});

test("the visitor cookie is random and only its hash would be stored", () => {
  const id = newVisitorId();
  assert.equal(isVisitorId(id), true);
  assert.equal(isVisitorId("not-a-visitor"), false);
  assert.equal(isVisitorId(id.toUpperCase()), false);
  const hash = hashVisitorId(id);
  assert.equal(hash.length, 64);
  assert.equal(hash.includes(id), false);
  assert.equal(hashVisitorId("short"), "");
});

test("the migration removes the old open counter and keeps the new one service-role only", () => {
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.record_public_quote_view\(TEXT\);/);
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.record_public_quote_view\(TEXT, TEXT, INTEGER\) TO service_role;/
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.consume_rate_limit\(TEXT, TEXT, INTEGER, INTEGER\) TO service_role;/
  );
  assert.equal(/record_public_quote_view\(TEXT, TEXT, INTEGER\) TO anon/.test(migration), false);
  assert.match(migration, /p_window_seconds INTEGER DEFAULT 86400/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
});
