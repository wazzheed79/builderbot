import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  TYPED_ACCEPTANCE_REQUIRED,
  TYPED_ACCEPTANCE_TOO_LONG,
  buildTypedAcceptance,
} from "../lib/acceptance-record.mjs";

const migration = readFileSync(
  new URL("../supabase/migrations/20261030120000_typed_acceptance_record.sql", import.meta.url),
  "utf8"
);
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("a typed acceptance stores the name, time, address, total, and option", () => {
  const built = buildTypedAcceptance({
    typedName: "  Sarah Jenkins  ",
    acceptedAt: "2026-10-30T09:00:00.000Z",
    clientIp: "203.0.113.9",
    totalAccepted: 1250.5,
    selectedOptionId: "better",
  });
  assert.equal(built.ok, true);
  assert.deepEqual(built.record, {
    typedName: "Sarah Jenkins",
    acceptedAt: "2026-10-30T09:00:00.000Z",
    clientIp: "203.0.113.9",
    totalAccepted: 1250.5,
    selectedOptionId: "better",
  });
  assert.throws(() => {
    built.record.typedName = "Someone else";
  }, TypeError);
  assert.equal(built.record.typedName, "Sarah Jenkins");
});

test("a blank name is refused in plain English, and a bad total is not stored", () => {
  assert.equal(buildTypedAcceptance({ typedName: "   ", totalAccepted: 10, acceptedAt: "2026-10-30T09:00:00.000Z" }).error, TYPED_ACCEPTANCE_REQUIRED);
  const longName = "A".repeat(101);
  assert.equal(
    buildTypedAcceptance({ typedName: longName, totalAccepted: 10, acceptedAt: "2026-10-30T09:00:00.000Z" }).error,
    TYPED_ACCEPTANCE_TOO_LONG
  );
  assert.equal(
    buildTypedAcceptance({ typedName: "Sarah Jenkins", totalAccepted: -1, acceptedAt: "2026-10-30T09:00:00.000Z" }).ok,
    false
  );
  const noChoice = buildTypedAcceptance({
    typedName: "Sarah Jenkins",
    totalAccepted: "80.00",
    acceptedAt: "2026-10-30T09:00:00.000Z",
    clientIp: "not-an-ip",
  });
  assert.equal(noChoice.ok, true);
  assert.equal(noChoice.record.totalAccepted, 80);
  assert.equal(noChoice.record.clientIp, null);
  assert.equal(noChoice.record.selectedOptionId, null);
});

test("the database keeps one acceptance row and blocks later changes", () => {
  for (const sql of [migration, schema]) {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.quote_acceptances/);
    assert.match(sql, /typed_name TEXT NOT NULL/);
    assert.match(sql, /accepted_at TIMESTAMP WITH TIME ZONE NOT NULL/);
    assert.match(sql, /client_ip TEXT/);
    assert.match(sql, /total_accepted NUMERIC NOT NULL/);
    assert.match(sql, /selected_option_id TEXT/);
    assert.match(sql, /quote_token TEXT NOT NULL UNIQUE/);
    assert.match(sql, /BEFORE UPDATE OR DELETE ON public\.quote_acceptances/);
    assert.match(sql, /BEFORE TRUNCATE ON public\.quote_acceptances/);
    assert.match(sql, /A typed acceptance cannot be changed/);
    assert.match(sql, /INSERT INTO public\.quote_acceptances/);
    assert.match(sql, /total = v_total/);
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.quote_acceptances FROM anon/);
    assert.equal(/CREATE POLICY[^;]*quote_acceptances/i.test(sql), false);
    assert.equal(/GRANT (UPDATE|DELETE|INSERT) ON TABLE public\.quote_acceptances/i.test(sql), false);
    assert.match(sql, /A typed acceptance name is required to accept/);
    assert.equal(sql.includes("Signature name is required"), false);
  }

  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.submit_public_quote_decision\(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT\) TO anon, authenticated, service_role/
  );
  assert.match(schema, /accepted_signature_name = v_name/);
});

test("the app calls it a typed acceptance, not a legal signature", () => {
  const files = [
    "../app/api/quote/[id]/route.ts",
    "../app/q/[id]/CustomerQuoteClient.tsx",
    "../app/customers/[id]/CustomerProfileClient.tsx",
    "../app/privacy/page.tsx",
    "../app/terms/page.tsx",
    "../app/flyer/page.tsx",
    "../lib/stripe-rules.mjs",
  ];
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(/legal signature/i.test(source), false, file);
    assert.equal(source.includes("Full Legal Name"), false, file);
    assert.equal(source.includes("typed legal"), false, file);
  }
  const route = readFileSync(new URL("../app/api/quote/[id]/route.ts", import.meta.url), "utf8");
  assert.match(route, /TYPED_ACCEPTANCE_REQUIRED/);
  const page = readFileSync(new URL("../app/q/[id]/CustomerQuoteClient.tsx", import.meta.url), "utf8");
  assert.match(page, /Typed acceptance/);
  assert.match(page, /Confirm acceptance/);
  assert.equal(page.includes("Accept & Sign"), false);
});
