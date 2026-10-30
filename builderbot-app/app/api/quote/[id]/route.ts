import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchPublicQuoteByToken, submitPublicDecision } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  TYPED_ACCEPTANCE_REQUIRED,
  TYPED_ACCEPTANCE_TOO_LONG,
} from "@/lib/acceptance-record.mjs";

// Validation schema for digital acceptance/decline
const DecisionPayloadSchema = z.object({
  status: z.enum(["Accepted", "Rejected"], {
    message: "Status must be either 'Accepted' or 'Rejected'.",
  }),
  signatureName: z
    .string()
    .trim()
    .max(100, TYPED_ACCEPTANCE_TOO_LONG)
    .optional(),
  selectedOptionId: z.string().trim().max(80).optional(),
  reason: z
    .string()
    .trim()
    .max(1000, "Reason cannot exceed 1000 characters.")
    .optional(),
});

// GET: Token-only quote lookup with automatic expiry check & bank details protection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Security: Only accept unguessable public tokens (reject sequential IDs like BB-1042)
    if (!id || typeof id !== "string" || !id.startsWith("q_") || id.length < 16) {
      return NextResponse.json(
        { error: "Invalid quotation token format. Public access requires a secure link." },
        { status: 400 }
      );
    }

    const result = await fetchPublicQuoteByToken(id);
    if (!result) {
      return NextResponse.json({ error: "Quotation not found or expired." }, { status: 404 });
    }

    return NextResponse.json({
      quote: result.quote,
      contractor: result.contractor,
      isExpired: result.isExpired,
    });
  } catch (error) {
    console.error("API error in GET /api/quote/[token]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Secure digital sign / decline with state transition & IP audit logging
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || !id.startsWith("q_") || id.length < 16) {
      return NextResponse.json(
        { error: "Invalid quotation token format. Public decisions require a secure link." },
        { status: 400 }
      );
    }

    // Rate Limiting Check (10 decision attempts per minute per IP)
    const clientIp = getClientIp(request);
    const rateCheck = await checkRateLimit(`quote-decision:${clientIp}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfterSec || 60) } }
      );
    }

    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const parseResult = DecisionPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input." },
        { status: 422 }
      );
    }

    const { status, signatureName, reason, selectedOptionId } = parseResult.data;

    // A typed name is required. The acceptance row itself is written in the database.
    if (status === "Accepted" && (!signatureName || signatureName.length === 0)) {
      return NextResponse.json({ error: TYPED_ACCEPTANCE_REQUIRED }, { status: 422 });
    }

    const decisionResult = await submitPublicDecision(id, status, {
      signatureName,
      reason,
      clientIp,
      selectedOptionId,
    });

    if (!decisionResult.success) {
      return NextResponse.json(
        { error: decisionResult.error || "Failed to update quotation." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("API error in POST /api/quote/[token]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
