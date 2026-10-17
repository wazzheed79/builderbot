import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDepositCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const DepositRequestSchema = z.object({
  quoteId: z.string().min(1),
  quoteTitle: z.string().min(1),
  depositAmount: z.number().positive(),
  contractorName: z.string().min(1),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`stripe-deposit:${clientIp}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many deposit requests. Please wait." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = DepositRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid deposit parameters." },
        { status: 422 }
      );
    }

    const { quoteId, quoteTitle, depositAmount, contractorName, customerEmail } = parsed.data;

    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.tradematequotes.co.uk";
    const cleanOrigin = origin.replace(/\/$/, "");

    if (!isStripeConfigured) {
      return NextResponse.json({
        demo: true,
        message: "Stripe Deposit is in Preview Mode. Add STRIPE_SECRET_KEY to accept live bank cards.",
        depositAmount,
        quoteId,
      });
    }

    const session = await createDepositCheckoutSession({
      quoteId,
      quoteTitle,
      depositAmount,
      contractorName,
      customerEmail,
      successUrl: `${cleanOrigin}/q/${quoteId}?payment=success`,
      cancelUrl: `${cleanOrigin}/q/${quoteId}?payment=cancelled`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe Deposit Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate deposit checkout." },
      { status: 500 }
    );
  }
}
