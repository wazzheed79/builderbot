import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { sanitizeEventProperties } from "../lib/analytics-rules.mjs";
import {
  GUEST_DAILY_LIMIT,
  GUEST_DEMO_STORAGE_KEY,
  GUEST_EXAMPLES,
  GUEST_NOTES_MAX,
  GUEST_PLACEHOLDER_BUSINESS,
  GUEST_WINDOW_MS,
  builderCanTakeGuestDemo,
  clearGuestDemoQuote,
  guestDemoRateId,
  guestDemoToBuilderFields,
  guestQuotePayload,
  pathAfterAuth,
  readGuestDemoQuote,
  validateGuestNotes,
  writeGuestDemoQuote,
} from "../lib/guest-demo.mjs";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

const sampleItems = [
  { type: "labor", description: "Painting two bedrooms", quantity: 16, unit: "hrs", rate: 45 },
  { type: "material", description: "Masking and dust sheets", quantity: 1, unit: "lot", rate: 25 },
];

test("guest notes are short, and the daily cap is five tries", () => {
  assert.equal(GUEST_DAILY_LIMIT, 5);
  assert.equal(GUEST_WINDOW_MS, 24 * 60 * 60 * 1000);
  assert.equal(GUEST_NOTES_MAX, 800);
  assert.equal(validateGuestNotes("  paint the hall  ").ok, true);
  assert.equal(validateGuestNotes("no").ok, false);
  assert.equal(validateGuestNotes("a".repeat(801)).ok, false);
  assert.equal(guestDemoRateId("203.0.113.8"), "guest-demo:203.0.113.8");
  assert.equal(guestDemoRateId(""), "guest-demo:unknown");
});

test("the try-it examples are real jobs and fit the note limit", () => {
  assert.ok(GUEST_EXAMPLES.length >= 2);
  const ids = GUEST_EXAMPLES.map((example) => example.id);
  assert.ok(ids.includes("decorating"));
  assert.ok(ids.includes("plumbing"));
  for (const example of GUEST_EXAMPLES) {
    assert.equal(validateGuestNotes(example.notes).ok, true);
    assert.ok(example.notes.length <= GUEST_NOTES_MAX);
  }
});

test("a guest quote has three prices, a placeholder name, and no bank or link", () => {
  const payload = guestQuotePayload({
    title: "Bedroom decoration",
    scopeOfWork: "Paint two bedrooms.",
    suggestedDepositPercent: 20,
    items: sampleItems,
    aiPowered: true,
    notice: "Suggested prices.",
    bankName: "Should not appear",
    bankSortCode: "00-00-00",
    bankAccountNumber: "12345678",
    token: "q_shouldnotappear",
    clientEmail: "person@example.com",
  });

  assert.equal(payload.businessName, GUEST_PLACEHOLDER_BUSINESS);
  assert.equal(payload.previewOnly, true);
  assert.equal(payload.aiPowered, true);
  assert.deepEqual(
    payload.options.map((option) => option.label),
    ["Standard", "Better", "Premium"]
  );
  assert.equal(payload.options[0].items.length, 2);
  assert.ok(payload.options[1].total > payload.options[0].total);
  assert.ok(payload.options[2].total > payload.options[1].total);
  const keys = Object.keys(payload);
  for (const blocked of ["bankName", "bankSortCode", "bankAccountNumber", "token", "clientEmail", "phone"]) {
    assert.equal(keys.includes(blocked), false);
  }
  assert.equal(JSON.stringify(payload).includes("12345678"), false);
  assert.equal(JSON.stringify(payload).includes("Should not appear"), false);
});

test("a wild rate is clamped before the guest sees it", () => {
  const payload = guestQuotePayload({
    title: "Call out",
    scopeOfWork: "Fix the leak.",
    items: [{ type: "labor", description: "Labour", quantity: 999999, unit: "hrs", rate: 999999 }],
    aiPowered: false,
  });
  assert.ok(payload.items[0].rate <= 50000);
  assert.ok(payload.items[0].quantity <= 10000);
  assert.equal(payload.estimateOnly, true);
});

test("the try-it quote survives in this browser and is ignored when it is too old", () => {
  const storage = memoryStorage();
  const payload = guestQuotePayload({
    title: "Kitchen tap",
    scopeOfWork: "Replace the mixer tap.",
    suggestedDepositPercent: 15,
    items: sampleItems,
    aiPowered: true,
    notice: "Suggested prices.",
  });
  assert.equal(writeGuestDemoQuote(storage, payload, "2026-10-22T12:00:00.000Z"), true);
  const saved = readGuestDemoQuote(storage, Date.parse("2026-10-22T13:00:00.000Z"));
  assert.equal(saved.title, "Kitchen tap");
  assert.equal(saved.aiPowered, true);
  assert.equal(saved.notice, "Suggested prices.");
  assert.equal(saved.businessName, GUEST_PLACEHOLDER_BUSINESS);

  const fields = guestDemoToBuilderFields(saved);
  assert.equal(fields.quoteTitle, "Kitchen tap");
  assert.equal(fields.vatEnabled, true);
  assert.equal(fields.depositPercent, 15);
  assert.equal(fields.choiceOptions.length, 3);
  assert.equal(fields.items.length, 2);

  const stale = readGuestDemoQuote(storage, Date.parse("2026-11-01T12:00:00.000Z"));
  assert.equal(stale, null);
  assert.equal(storage.getItem(GUEST_DEMO_STORAGE_KEY), null);
});

test("a blank builder can take the try-it quote, and a started quote cannot", () => {
  assert.equal(builderCanTakeGuestDemo({ items: [], activeQuoteId: "", clientName: "" }), true);
  assert.equal(builderCanTakeGuestDemo({ items: [{ id: "1" }], clientName: "" }), false);
  assert.equal(builderCanTakeGuestDemo({ items: [], activeQuoteId: "BB-1", clientName: "" }), false);
  assert.equal(builderCanTakeGuestDemo({ items: [], clientName: "Sarah" }), false);
});

test("sign-in opens the quote builder only when a try-it quote is waiting", () => {
  const storage = memoryStorage();
  assert.equal(pathAfterAuth("/dashboard", storage), "/dashboard");
  assert.equal(pathAfterAuth("https://evil.example/phish", storage), "/dashboard");
  assert.equal(pathAfterAuth("/customers", storage), "/customers");

  const payload = guestQuotePayload({
    title: "Hall paint",
    scopeOfWork: "Paint the hall.",
    items: sampleItems,
    aiPowered: false,
  });
  writeGuestDemoQuote(storage, payload, "2026-10-22T12:00:00.000Z");
  assert.equal(pathAfterAuth("/dashboard", storage), "/quotes");
  assert.equal(pathAfterAuth("", storage), "/quotes");
  assert.equal(pathAfterAuth("/customers", storage), "/customers");
  assert.equal(pathAfterAuth("https://evil.example", storage), "/quotes");
  clearGuestDemoQuote(storage);
  assert.equal(pathAfterAuth("/dashboard", storage), "/dashboard");
});

test("try-it analytics events are allowed and cannot carry the job notes", () => {
  assert.deepEqual(sanitizeEventProperties("demo_started", { notes: "Paint the hall" }), {});
  assert.deepEqual(sanitizeEventProperties("demo_build_clicked", { used_example: true, notes: "Paint the hall" }), {
    used_example: true,
  });
  assert.deepEqual(sanitizeEventProperties("demo_quote_generated", { ai_used: true, used_example: false, notes: "Paint the hall" }), {
    ai_used: true,
    used_example: false,
  });
  assert.deepEqual(sanitizeEventProperties("demo_build_failed", { reason: "empty_input", notes: "Paint the hall" }), {
    reason: "empty_input",
  });
  assert.deepEqual(sanitizeEventProperties("demo_build_failed", { reason: "the kitchen tap notes" }), {});
  assert.deepEqual(sanitizeEventProperties("demo_signup_clicked", { email: "a@b.co" }), {});
  assert.equal(sanitizeEventProperties("demo_quote_generated", { ai_used: "yes" }).ai_used, undefined);
});

test("the guest route is limited and does not save, and signed-in quoting still requires an account", () => {
  const demo = fs.readFileSync(new URL("../app/api/quote/demo/route.ts", import.meta.url), "utf8");
  assert.match(demo, /checkRateLimit/);
  assert.match(demo, /sanitizeGeneratedQuote/);
  assert.match(demo, /GUEST_DAILY_LIMIT/);
  assert.doesNotMatch(demo, /from\(["']quotes["']\)|saveQuote|syncQuoteToCloud|send\(|resend/i);

  const signedIn = fs.readFileSync(new URL("../app/api/quote/generate/route.ts", import.meta.url), "utf8");
  assert.match(signedIn, /getSignedInUserId/);
  assert.match(signedIn, /if \(apiKey && userId\)/);
  assert.doesNotMatch(signedIn, /guest-demo|\/api\/quote\/demo/);
});
