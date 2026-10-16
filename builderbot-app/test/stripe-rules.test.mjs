import test from "node:test";
import assert from "node:assert/strict";
import {
  SUBSCRIPTION_PLANS,
  canCreateQuote,
  validateCheckoutParams,
  formatPlanPrice,
} from "../lib/stripe-rules.mjs";

test("Subscription plans: contains free, pro, and business with valid structures", () => {
  assert.ok(SUBSCRIPTION_PLANS.free);
  assert.ok(SUBSCRIPTION_PLANS.pro);
  assert.ok(SUBSCRIPTION_PLANS.business);

  assert.equal(SUBSCRIPTION_PLANS.free.monthlyPriceGbp, 0);
  assert.equal(SUBSCRIPTION_PLANS.free.quoteLimitPerMonth, 5);

  assert.equal(SUBSCRIPTION_PLANS.pro.monthlyPriceGbp, 9.99);
  assert.equal(SUBSCRIPTION_PLANS.pro.quoteLimitPerMonth, Infinity);

  assert.equal(SUBSCRIPTION_PLANS.business.monthlyPriceGbp, 24.99);
  assert.equal(SUBSCRIPTION_PLANS.business.quoteLimitPerMonth, Infinity);
});

test("canCreateQuote: enforces limits on free tier and allows infinite on pro", () => {
  // Free tier with 3 quotes: 2 remaining
  const freeMid = canCreateQuote("free", 3);
  assert.equal(freeMid.allowed, true);
  assert.equal(freeMid.remaining, 2);

  // Free tier with 5 quotes: 0 remaining, disallowed
  const freeLimit = canCreateQuote("free", 5);
  assert.equal(freeLimit.allowed, false);
  assert.equal(freeLimit.remaining, 0);

  // Pro tier with 100 quotes: unlimited
  const proTest = canCreateQuote("pro", 100);
  assert.equal(proTest.allowed, true);
  assert.equal(proTest.remaining, Infinity);
});

test("validateCheckoutParams: validates planId and interval", () => {
  assert.equal(validateCheckoutParams(null).valid, false);
  assert.equal(validateCheckoutParams({ planId: "fake" }).valid, false);

  const proMonth = validateCheckoutParams({ planId: "pro", interval: "month" });
  assert.equal(proMonth.valid, true);
  assert.equal(proMonth.planId, "pro");
  assert.equal(proMonth.interval, "month");

  const businessYear = validateCheckoutParams({ planId: "business", interval: "year" });
  assert.equal(businessYear.valid, true);
  assert.equal(businessYear.planId, "business");
  assert.equal(businessYear.interval, "year");
});

test("formatPlanPrice: formats GBP values cleanly", () => {
  assert.equal(formatPlanPrice(0), "Free");
  assert.equal(formatPlanPrice(9.99), "£9.99");
  assert.equal(formatPlanPrice(99), "£99");
  assert.equal(formatPlanPrice(24.99), "£24.99");
  assert.equal(formatPlanPrice(249), "£249");
});
