import test from "node:test";
import assert from "node:assert/strict";

import { saveOnlineWithRetry } from "../lib/cloud-retry.mjs";
import { newRecordId } from "../lib/record-id.mjs";
import {
  checkMemoryRateLimit,
  ipv6Block64,
  rateLimitKey,
  refundMemoryRateLimit,
} from "../lib/rate-limit.mjs";
import { geminiFailureCode } from "../lib/gemini.mjs";
import { londonDateOf, todayInLondon } from "../lib/london-date.mjs";
import { calculateQuoteExpiry } from "../lib/quote-rules.mjs";
import { todayIso } from "../lib/invoice-rules.mjs";
import { GUEST_DAILY_LIMIT, GUEST_GLOBAL_DAILY_LIMIT } from "../lib/guest-demo.mjs";

const noWait = async () => {};

test("an online save that works first time is tried once", async () => {
  let calls = 0;
  const result = await saveOnlineWithRetry(async () => {
    calls += 1;
    return { status: "saved" };
  }, { wait: noWait });
  assert.equal(result.status, "saved");
  assert.equal(calls, 1);
});

test("an online save is retried and can succeed on a later try", async () => {
  let calls = 0;
  let failed = 0;
  const result = await saveOnlineWithRetry(
    async () => {
      calls += 1;
      return calls < 3 ? { status: "failed", code: "08006" } : { status: "saved" };
    },
    { wait: noWait, onFailed: () => (failed += 1) }
  );
  assert.equal(result.status, "saved");
  assert.equal(calls, 3);
  assert.equal(failed, 0);
});

test("a save with nobody signed in is not retried or reported", async () => {
  let calls = 0;
  let failed = 0;
  const result = await saveOnlineWithRetry(
    async () => {
      calls += 1;
      return { status: "skipped" };
    },
    { wait: noWait, onFailed: () => (failed += 1) }
  );
  assert.equal(result.status, "skipped");
  assert.equal(calls, 1);
  assert.equal(failed, 0);
});

test("a save that keeps failing is reported once with its code", async () => {
  const reports = [];
  const result = await saveOnlineWithRetry(
    async () => {
      throw Object.assign(new Error("offline"), { code: "network_down" });
    },
    { wait: noWait, onFailed: (info) => reports.push(info) }
  );
  assert.equal(result.status, "failed");
  assert.deepEqual(reports, [{ code: "network_down", attempts: 3 }]);
});

test("record ids keep their prefix and do not repeat", () => {
  const ids = new Set();
  for (let i = 0; i < 2000; i += 1) ids.add(newRecordId("cust-"));
  assert.equal(ids.size, 2000);
  for (const id of ids) assert.match(id, /^cust-[0-9a-f-]{32,36}$/);
  assert.match(newRecordId("tpl_"), /^tpl_/);
});

test("IPv6 addresses are limited per /64 block", () => {
  assert.equal(ipv6Block64("2001:db8:1:2:aaaa:bbbb:cccc:dddd"), "2001:db8:1:2::/64");
  assert.equal(ipv6Block64("2001:0DB8:0001:0002::1"), "2001:db8:1:2::/64");
  assert.equal(ipv6Block64("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(ipv6Block64("1.2.3.4"), "");
  assert.equal(ipv6Block64("not-an-ip"), "");
  assert.equal(
    rateLimitKey("guest-demo:2001:db8:1:2:aaaa::1"),
    rateLimitKey("guest-demo:2001:db8:1:2:ffff::9")
  );
  assert.equal(rateLimitKey("ai-generate:1.2.3.4"), "ai-generate:1.2.3.4");
  assert.equal(
    rateLimitKey("ai-generate:user:7b1c2d3e-0000-4000-8000-000000000000"),
    "ai-generate:user:7b1c2d3e-0000-4000-8000-000000000000"
  );
});

test("a memory AI turn can be given back", () => {
  const id = `ai-generate:user:refund-test-${Date.now()}`;
  assert.equal(checkMemoryRateLimit(id, 1, 60_000).allowed, true);
  assert.equal(checkMemoryRateLimit(id, 1, 60_000).allowed, false);
  assert.equal(refundMemoryRateLimit(id), true);
  assert.equal(checkMemoryRateLimit(id, 1, 60_000).allowed, true);
  assert.equal(refundMemoryRateLimit("never-used"), false);
});

test("Gemini failures get a short code for Sentry", () => {
  assert.equal(geminiFailureCode(Object.assign(new Error("quota"), { status: 429 })), "http_429");
  assert.equal(geminiFailureCode(Object.assign(new Error("x"), { name: "AbortError" })), "timeout");
  assert.equal(geminiFailureCode(new SyntaxError("bad")), "bad_json");
  assert.equal(geminiFailureCode("bad_shape"), "bad_shape");
});

test("business dates follow the London calendar in summer time", () => {
  // 00:30 in London on 15 July is still 14 July in UTC.
  assert.equal(todayInLondon(new Date("2026-07-14T23:30:00Z")), "2026-07-15");
  assert.equal(todayInLondon(new Date("2026-12-14T23:30:00Z")), "2026-12-14");
  assert.equal(todayIso(new Date("2026-07-14T23:30:00Z")), "2026-07-15");
  assert.equal(londonDateOf("2026-07-01"), "2026-07-01");
  assert.equal(londonDateOf("2026-07-01T23:30:00+00:00"), "2026-07-02");
  assert.equal(londonDateOf("nonsense"), "");
});

test("quote expiry is shown in London dates", () => {
  const expiry = calculateQuoteExpiry("2026-07-01T23:30:00Z", 30, Date.parse("2026-07-02T09:00:00Z"));
  assert.equal(expiry.expiryDateIso, "2026-08-01");
  assert.equal(expiry.expiryFormatted, "1 Aug 2026");
  assert.equal(expiry.isExpired, false);
});

test("the try-it page has a shared daily AI cap above the per-phone cap", () => {
  assert.equal(typeof GUEST_GLOBAL_DAILY_LIMIT, "number");
  assert.ok(GUEST_GLOBAL_DAILY_LIMIT > GUEST_DAILY_LIMIT);
});
