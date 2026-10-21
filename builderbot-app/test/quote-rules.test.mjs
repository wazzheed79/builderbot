import test from "node:test";
import assert from "node:assert/strict";

import {
  roundMoney,
  recalculateQuoteTotals,
  validateStatusTransition,
  generateToken,
  calculateQuoteExpiry,
  newQuoteId,
  isSharedSequentialQuoteId,
  isQuoteIdConflict,
  reassignQuoteReferences,
} from "../lib/quote-rules.mjs";

test("Currency Rounding: roundMoney rounds to exactly two decimal places", () => {
  assert.equal(roundMoney(10.004), 10.00);
  assert.equal(roundMoney(10.005), 10.01);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(1250 * 0.2), 250);
  assert.equal(roundMoney(1161.6 * 0.2), 232.32);
});

test("Quote Calculations: recalculateQuoteTotals computes subtotal, VAT, total, and deposit accurately", () => {
  const items = [
    { type: "material", description: "Paving blocks", quantity: 45, rate: 22.5 },
    { type: "labor", description: "Installation", quantity: 16, rate: 55 },
  ];

  // 45 * 22.5 = 1012.50; 16 * 55 = 880.00; subtotal = 1892.50
  // VAT 20% = 378.50; Total = 2271.00; Deposit 25% = 567.75
  const result = recalculateQuoteTotals(items, true, 25);
  assert.equal(result.subtotal, 1892.50);
  assert.equal(result.vat, 378.50);
  assert.equal(result.total, 2271.00);
  assert.equal(result.deposit, 567.75);
});

test("Quote Calculations: handles 0% deposit and VAT disabled without NaN", () => {
  const items = [
    { type: "labor", description: "Plumbing repair", quantity: 2, rate: 60 },
  ];

  const result = recalculateQuoteTotals(items, false, 0);
  assert.equal(result.subtotal, 120.00);
  assert.equal(result.vat, 0.00);
  assert.equal(result.total, 120.00);
  assert.equal(result.deposit, 0.00);
});

test("Status Machine: Handles Sent -> Viewed -> Accepted/Rejected lifecycle", () => {
  // Sent -> Viewed when opened
  assert.deepEqual(validateStatusTransition("Sent", "Viewed", false), { allowed: true });

  // Viewed -> Accepted or Rejected
  assert.deepEqual(validateStatusTransition("Viewed", "Accepted", false), { allowed: true });
  assert.deepEqual(validateStatusTransition("Viewed", "Rejected", false), { allowed: true });

  // Sent can also directly transition if signed immediately
  assert.deepEqual(validateStatusTransition("Sent", "Accepted", false), { allowed: true });

  // Disallow Draft to Viewed or Accepted directly
  assert.equal(validateStatusTransition("Draft", "Viewed", false).allowed, false);
  assert.equal(validateStatusTransition("Draft", "Accepted", false).allowed, false);

  // Disallow modifying already accepted or rejected quotes
  assert.equal(validateStatusTransition("Accepted", "Rejected", false).allowed, false);
  assert.equal(validateStatusTransition("Rejected", "Accepted", false).allowed, false);
});

test("Status Machine: Rejects acceptance if quote is expired", () => {
  const expiredAttempt = validateStatusTransition("Sent", "Accepted", true);
  assert.equal(expiredAttempt.allowed, false);
  assert.match(expiredAttempt.error, /expired/i);
});

test("Token Security: Tokens must be prefixed with q_ and be cryptographically long", () => {
  const token = generateToken();
  assert.match(token, /^q_[a-zA-Z0-9]{16,}$/);
});

test("Quote Validity: calculateQuoteExpiry computes correct remaining days and expiry state", () => {
  const baseTime = new Date("2026-10-15T12:00:00Z").getTime();

  // 10 days in, 20 days left out of 30
  const activeCheck = calculateQuoteExpiry(
    "2026-10-05T12:00:00Z",
    30,
    baseTime
  );
  assert.equal(activeCheck.isExpired, false);
  assert.equal(activeCheck.daysLeft, 20);

  // 35 days in -> expired
  const expiredCheck = calculateQuoteExpiry(
    "2026-09-01T12:00:00Z",
    30,
    baseTime
  );
  assert.equal(expiredCheck.isExpired, true);
  assert.equal(expiredCheck.daysLeft, 0);
});

test("a new quote id cannot be the shared BB-1041 sequence", () => {
  const id = newQuoteId(Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]));
  assert.equal(id, "BB-ABCDEFGH");
  assert.equal(isSharedSequentialQuoteId(id), false);
  assert.equal(isSharedSequentialQuoteId("BB-1041"), true);
  assert.equal(isSharedSequentialQuoteId("bb-1041"), true);
  assert.equal(isSharedSequentialQuoteId("draft-abc"), false);
  const another = newQuoteId();
  assert.match(another, /^BB-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  assert.equal(isSharedSequentialQuoteId(another), false);
});

test("a clashing quote id is recognised, and a duplicate link token is not", () => {
  assert.equal(
    isQuoteIdConflict({ message: 'duplicate key value violates unique constraint "quotes_pkey"' }),
    true
  );
  assert.equal(
    isQuoteIdConflict('new row violates row-level security policy for table "quotes"'),
    true
  );
  assert.equal(
    isQuoteIdConflict({ message: 'duplicate key value violates unique constraint "quotes_token_key"' }),
    false
  );
});

test("renaming a clashing quote keeps its link and the invoice number", () => {
  const next = reassignQuoteReferences(
    {
      quotes: [{ id: "BB-1041", token: "q_keepthislink" }],
      jobs: [{ quoteId: "BB-1041" }, { quoteId: "BB-2000" }],
      invoices: [{ quoteId: "BB-1041", number: "INV-0004" }],
    },
    "BB-1041",
    "BB-ABCDEFGH"
  );
  assert.equal(next.quotes[0].id, "BB-ABCDEFGH");
  assert.equal(next.quotes[0].token, "q_keepthislink");
  assert.equal(next.jobs[0].quoteId, "BB-ABCDEFGH");
  assert.equal(next.jobs[1].quoteId, "BB-2000");
  assert.equal(next.invoices[0].quoteId, "BB-ABCDEFGH");
  assert.equal(next.invoices[0].number, "INV-0004");
});
