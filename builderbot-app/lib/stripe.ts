import Stripe from "stripe";
import {
  SUBSCRIPTION_PLANS,
  canCreateQuote,
  validateCheckoutParams,
  formatPlanPrice,
} from "./stripe-rules.mjs";

export { SUBSCRIPTION_PLANS, canCreateQuote, validateCheckoutParams, formatPlanPrice };

export type PlanId = "free" | "pro" | "business";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  badge: string;
  monthlyPriceGbp: number;
  yearlyPriceGbp: number;
  quoteLimitPerMonth: number;
  features: string[];
  highlight: boolean;
  ctaText: string;
}

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Creates a Stripe Checkout Session for a TradeMate SaaS subscription.
 */
export async function createSubscriptionCheckoutSession({
  planId,
  interval = "month",
  successUrl,
  cancelUrl,
  customerEmail,
  metadata = {},
}: {
  planId: "pro" | "business";
  interval?: "month" | "year";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const priceAmount = interval === "year" ? plan.yearlyPriceGbp : plan.monthlyPriceGbp;
  const unitAmountInPence = Math.round(priceAmount * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `TradeMate ${plan.name}`,
            description: `${plan.badge} - Unlimited AI quoting, custom branding, and WhatsApp dispatch`,
          },
          unit_amount: unitAmountInPence,
          recurring: {
            interval: interval === "year" ? "year" : "month",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      planId,
      interval,
      ...metadata,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Creates a Stripe Checkout Session for a customer quote deposit (e.g. 20% upfront deposit).
 */
export async function createDepositCheckoutSession({
  quoteId,
  quoteTitle,
  depositAmount,
  contractorName,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  quoteId: string;
  quoteTitle: string;
  depositAmount: number;
  contractorName: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }

  const unitAmountInPence = Math.round(depositAmount * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Deposit: ${quoteTitle}`,
            description: `Upfront booking deposit for ${contractorName} (Quote #${quoteId.slice(0, 8)})`,
          },
          unit_amount: unitAmountInPence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "quote_deposit",
      quoteId,
      contractorName,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}
