import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSubscriptionCheckoutSession,
  isStripeConfigured,
  SUBSCRIPTION_PLANS,
} from "@/lib/stripe";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const CheckoutRequestSchema = z.object({
  planId: z.enum(["pro", "business"]),
  interval: z.enum(["month", "year"]).default("month"),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`stripe-checkout:${clientIp}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many checkout requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // 2. Validate Request Body
    const body = await request.json().catch(() => null);
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid checkout parameters." },
        { status: 422 }
      );
    }

    const { planId, interval, customerEmail } = parsed.data;
    const plan = SUBSCRIPTION_PLANS[planId];

    // Determine host URL for redirects
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.tradematequotes.co.uk";

    const cleanOrigin = origin.replace(/\/$/, "");

    // 3. Graceful Mock / Demo Mode if Stripe Secret Key is not configured yet
    if (!isStripeConfigured) {
      return NextResponse.json({
        demo: true,
        message: "Stripe is currently in Preview Mode. Add STRIPE_SECRET_KEY to go live.",
        plan: {
          id: plan.id,
          name: plan.name,
          price: interval === "year" ? plan.yearlyPriceGbp : plan.monthlyPriceGbp,
          interval,
        },
      });
    }

    // 4. Create Real Stripe Checkout Session
    const session = await createSubscriptionCheckoutSession({
      planId,
      interval,
      customerEmail,
      successUrl: `${cleanOrigin}/settings?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
      cancelUrl: `${cleanOrigin}/pricing?canceled=true`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment session. Please try again." },
      { status: 500 }
    );
  }
}
