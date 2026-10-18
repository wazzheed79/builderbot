// Subscription numbers kept for tests. The free beta does not sell these plans.
import { brand } from "./brand.mjs";

export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free Starter",
    badge: "Forever Free",
    monthlyPriceGbp: 0,
    yearlyPriceGbp: 0,
    quoteLimitPerMonth: 5,
    features: [
      "Up to 5 professional quotes per month",
      "Standard PDF quote downloads",
      "Basic customer contact book",
      "Accept & digital signature links",
      `${brand.name} name shown on shared pages`,
    ],
    highlight: false,
    ctaText: "Current Plan",
  },
  pro: {
    id: "pro",
    name: "Pro Sole Trader",
    badge: "Not on sale",
    monthlyPriceGbp: 9.99,
    yearlyPriceGbp: 99.0, // Save ~£20/year
    quoteLimitPerMonth: Infinity,
    features: [
      "Unlimited quotes & invoices",
      "Upload your company logo & trade badges",
      `Option to hide the ${brand.name} name`,
      "1-tap WhatsApp quote dispatch",
      "Online customer deposit card collection",
      "Full customer & job history archive",
      "Priority email & WhatsApp support",
    ],
    highlight: true,
    ctaText: "Upgrade to Pro (£9.99/mo)",
  },
  business: {
    id: "business",
    name: "Business & Teams",
    badge: "Multi-Van",
    monthlyPriceGbp: 24.99,
    yearlyPriceGbp: 249.0, // Save ~£50/year
    quoteLimitPerMonth: Infinity,
    features: [
      "Everything in Pro, plus:",
      "Up to 5 team / van accounts",
      "Job assignment & progress tracking",
      "Company-wide materials pricing library",
      "Dedicated account onboarding with Michael",
      "Same-day VIP phone support",
    ],
    highlight: false,
    ctaText: "Get Business Plan (£24.99/mo)",
  },
};

/**
 * Checks whether a user on a given plan can create another quote this month.
 */
export function canCreateQuote(planId = "free", quoteCountThisMonth = 0) {
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
  if (plan.quoteLimitPerMonth === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  const remaining = Math.max(0, plan.quoteLimitPerMonth - quoteCountThisMonth);
  return {
    allowed: quoteCountThisMonth < plan.quoteLimitPerMonth,
    remaining,
    limit: plan.quoteLimitPerMonth,
  };
}

/**
 * Validates checkout request parameters.
 */
export function validateCheckoutParams(params) {
  if (!params || typeof params !== "object") {
    return { valid: false, error: "Missing request parameters." };
  }

  const { planId, interval } = params;
  if (!planId || !["pro", "business"].includes(planId)) {
    return { valid: false, error: "Invalid plan selected. Choose 'pro' or 'business'." };
  }

  const validInterval = interval === "year" ? "year" : "month";
  return {
    valid: true,
    planId,
    interval: validInterval,
  };
}

/**
 * Formats a GBP number to clean display string (e.g. £9.99, £99).
 */
export function formatPlanPrice(amount) {
  if (amount === 0) return "Free";
  return Number.isInteger(amount) ? `£${amount}` : `£${amount.toFixed(2)}`;
}
