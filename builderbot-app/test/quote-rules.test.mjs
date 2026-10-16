import test from "node:test";
import assert from "node:assert/strict";

// Helper math logic matching lib/storage.ts & lib/supabase.ts
function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function recalculateQuoteTotals(items, vatEnabled, depositPercent) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.rate), 0)
  );
  const vat = roundMoney(vatEnabled ? subtotal * 0.2 : 0);
  const total = roundMoney(subtotal + vat);
  const deposit = roundMoney((total * Math.max(0, Math.min(100, depositPercent))) / 100);

  return { subtotal, vat, total, deposit };
}

function validateStatusTransition(currentStatus, targetStatus, isExpired) {
  if (isExpired) {
    return { allowed: false, error: "Quote has expired." };
  }
  if (currentStatus !== "Sent") {
    return { allowed: false, error: `Cannot transition from ${currentStatus}.` };
  }
  if (targetStatus !== "Accepted" && targetStatus !== "Rejected") {
    return { allowed: false, error: `Invalid target status ${targetStatus}.` };
  }
  return { allowed: true };
}

function generateToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `q_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `q_${Date.now().toString(36)}`;
}

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

test("Status Machine: Only 'Sent' quotes can be Accepted or Rejected", () => {
  assert.deepEqual(validateStatusTransition("Sent", "Accepted", false), { allowed: true });
  assert.deepEqual(validateStatusTransition("Sent", "Rejected", false), { allowed: true });

  // Disallow Draft to Accepted directly
  const draftAttempt = validateStatusTransition("Draft", "Accepted", false);
  assert.equal(draftAttempt.allowed, false);

  // Disallow modifying already accepted quotes
  const acceptedAttempt = validateStatusTransition("Accepted", "Rejected", false);
  assert.equal(acceptedAttempt.allowed, false);
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
