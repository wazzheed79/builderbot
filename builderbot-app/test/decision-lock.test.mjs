import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizePhoneNumber } from "../lib/share-rules.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const SIG = "submit_public_quote_decision\\(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT\\)";

test("the decision function is service-role only, in the schema and the newest migration", () => {
  for (const file of [
    "supabase/schema.sql",
    "supabase/migrations/20261108120000_lock_decision_function.sql",
  ]) {
    const sql = read(file);
    assert.match(sql, new RegExp(`REVOKE ALL ON FUNCTION public\\.${SIG} FROM anon`), file);
    assert.match(sql, new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${SIG} TO service_role;`), file);
    assert.doesNotMatch(sql, new RegExp(`${SIG} TO anon`), file);
  }
});

test("a decision locks the quote row so accept and reject cannot overwrite each other", () => {
  const sql = read("supabase/migrations/20261108120000_lock_decision_function.sql");
  assert.match(sql, /FROM public\.quotes WHERE token = lookup_token FOR UPDATE;/);
});

test("the server sends decisions with the service-role client", () => {
  const source = read("lib/supabase-server.ts");
  const start = source.indexOf("export async function submitPublicDecision");
  assert.ok(start > 0);
  assert.match(source.slice(start), /getServiceRoleSupabase\(\)/);
  assert.doesNotMatch(source.slice(start), /getServerSupabase\(\)/);
});

test("UK numbers become wa.me numbers", () => {
  assert.equal(normalizePhoneNumber("07911 123456"), "447911123456");
  assert.equal(normalizePhoneNumber("+44 7911 123456"), "447911123456");
});

test("saving a customer does not invent a phone, email or address", () => {
  const source = read("app/customers/page.tsx");
  assert.doesNotMatch(source, /(phone|email|address)\.trim\(\)\s*\|\|/);
});
