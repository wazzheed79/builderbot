import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured on the server." },
      { status: 400 }
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Webhook signature was not valid." }, { status: 400 });
  }

  // Handle relevant events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription") {
        console.log(
          `[Stripe] Subscription activated for customer ${session.customer_email || session.id}. Plan: ${
            session.metadata?.planId
          }`
        );
      } else if (session.metadata?.type === "quote_deposit") {
        console.log(
          `[Stripe] Quote deposit received for Quote #${session.metadata.quoteId}. Amount: £${(
            (session.amount_total || 0) / 100
          ).toFixed(2)}`
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe] Subscription canceled: ${subscription.id}`);
      break;
    }

    default:
      // Log unhandled events quietly
      break;
  }

  return NextResponse.json({ received: true });
}
