import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeGeneratedQuote } from "@/lib/quote-ai.mjs";
import { estimateTradeJob } from "@/lib/trade-estimator.mjs";
import { brand } from "@/lib/brand.mjs";
import { generateGeminiText, parseGeminiJson, shouldUseRoughEstimate } from "@/lib/gemini";
import {
  GUEST_DAILY_LIMIT,
  GUEST_NOTES_MAX,
  GUEST_PLACEHOLDER_BUSINESS,
  GUEST_WINDOW_MS,
  guestDemoRateId,
  guestQuotePayload,
  validateGuestNotes,
} from "@/lib/guest-demo.mjs";
import { MAX_TEXT_BODY_CHARS, NOTES_TOO_LONG, checkBodySize } from "@/lib/image-payload.mjs";

const LIMIT_MESSAGE =
  "That's all the free tries from this phone today. Create a free account to keep going.";

/**
 * One AI quote for a visitor with no account.
 * This route does not save a quote, create a public link, or send email.
 * The signed-in route at /api/quote/generate is unchanged.
 */
export async function POST(request: NextRequest) {
  try {
    const declaredLength = request.headers.get("content-length");
    const declaredSize = checkBodySize(declaredLength, "", MAX_TEXT_BODY_CHARS, NOTES_TOO_LONG);
    if (!declaredSize.ok) {
      return NextResponse.json({ error: declaredSize.error }, { status: declaredSize.status });
    }
    const rawText = await request.text();
    const sized = checkBodySize(declaredLength, rawText, MAX_TEXT_BODY_CHARS, NOTES_TOO_LONG);
    if (!sized.ok) {
      return NextResponse.json({ error: sized.error }, { status: sized.status });
    }

    let rawBody: unknown = null;
    try {
      rawBody = rawText ? JSON.parse(rawText) : null;
    } catch {
      rawBody = null;
    }
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const notesCheck = validateGuestNotes(
      (rawBody as { notes?: unknown }).notes
    );
    if (!notesCheck.ok) {
      return NextResponse.json({ error: notesCheck.error }, { status: 422 });
    }
    if (notesCheck.notes.length > GUEST_NOTES_MAX) {
      return NextResponse.json(
        { error: `Keep the notes under ${GUEST_NOTES_MAX} characters.` },
        { status: 422 }
      );
    }

    const clientIp = getClientIp(request);
    const rateCheck = await checkRateLimit(
      guestDemoRateId(clientIp),
      GUEST_DAILY_LIMIT,
      GUEST_WINDOW_MS
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: LIMIT_MESSAGE, previewOnly: true },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSec || 3600) },
        }
      );
    }

    const notes = notesCheck.notes;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const systemInstruction =
        `You are the quoting assistant for ${brand.name}, helping UK builders, electricians, plumbers, roofers, landscapers, painters, and carpenters. ` +
        "Given tradesperson notes, return realistic UK trade itemised breakdowns in JSON format. " +
        "Write descriptions in British spelling (labour, colour, metre). " +
        "Use realistic UK market rates in GBP (£): skilled labour should be £40-£65/hr or £220-£350/day. " +
        "Materials at realistic trade supplier prices. " +
        "Recommend a deposit % between 10 and 30 (default 20). " +
        "CRITICAL: NEVER hallucinate or claim legal trade accreditations (such as Gas Safe or NICEIC) unless explicitly mentioned in the notes. " +
        "Do not invent a business name, bank, customer name, address, phone, or email.";

      try {
        const responseText = await generateGeminiText({
          apiKey,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Itemize the following job notes into UK trade line items. " +
                    "This is a preview for a tradesperson who has not signed in. " +
                    `The business name on the paperwork is the placeholder "${GUEST_PLACEHOLDER_BUSINESS}".`,
                },
                { text: notes },
              ],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Concise professional title for the quote" },
                scopeOfWork: { type: "string", description: "Detailed professional scope of works" },
                suggestedDepositPercent: {
                  type: "integer",
                  description: "Suggested deposit percentage (typically 15-25)",
                },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "One of: 'labor', 'material', 'service'" },
                      description: { type: "string", description: "Clear description of the line" },
                      quantity: { type: "number", description: "Numeric quantity" },
                      unit: { type: "string", description: "Unit of measure" },
                      rate: { type: "number", description: "Unit price in GBP" },
                    },
                    required: ["type", "description", "quantity", "unit", "rate"],
                  },
                },
              },
              required: ["title", "scopeOfWork", "suggestedDepositPercent", "items"],
            },
          },
        });

        const parsed = parseGeminiJson(responseText);
        const cleaned = sanitizeGeneratedQuote(parsed, { notes });
        if (!cleaned.ok) {
          console.error(
            "Guest Gemini quote did not match the expected shape. Using the rough estimate.",
            cleaned.reason
          );
        } else {
          return NextResponse.json(
            guestQuotePayload({
              ...cleaned,
              aiPowered: true,
              notice:
                "Suggested prices. Nothing is saved or sent. Create a free account to put your own business name on it.",
            })
          );
        }
      } catch (error) {
        if (!shouldUseRoughEstimate(error)) throw error;
        console.error("Guest Gemini quote failed. Using the rough estimate.", error);
      }
    }

    const estimate = estimateTradeJob(notes, "", null, []);
    const cleaned = sanitizeGeneratedQuote(estimate, { notes });
    if (!cleaned.ok) {
      return NextResponse.json(
        { error: "Could not build a quote from those notes. Try a little more detail." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      guestQuotePayload({
        ...cleaned,
        aiPowered: false,
        notice: apiKey
          ? "Rough estimate. The helper was busy, so check every price. Nothing is saved or sent."
          : "Rough estimate. Nothing is saved or sent. Create a free account for an AI draft on your own quotes.",
      })
    );
  } catch (error) {
    console.error("Error generating a guest quote:", error);
    return NextResponse.json(
      { error: "Could not build that quote. Please try again." },
      { status: 500 }
    );
  }
}
