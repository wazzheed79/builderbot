import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSignedInUserId } from "@/lib/ai-access";
import { quotaMessage, takeAiTurn } from "@/lib/ai-quota";
import { brand } from "@/lib/brand.mjs";
import { generateGeminiText, parseGeminiJson, shouldUseRoughEstimate } from "@/lib/gemini";
import { sanitizeExpandedScope } from "@/lib/quote-ai.mjs";
import { MAX_TEXT_BODY_CHARS, NOTES_TOO_LONG, checkBodySize } from "@/lib/image-payload.mjs";

const ExpandRequestSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(3, "Please provide at least 3 characters of job notes.")
    .max(2000, "Notes cannot exceed 2000 characters."),
  title: z
    .string()
    .trim()
    .max(150)
    .optional(),
  trade: z
    .string()
    .trim()
    .max(100)
    .optional(),
});

interface ExpandResponse {
  title: string;
  scopeOfWork: string;
  aiPowered: boolean;
  notice?: string;
}

export async function POST(request: NextRequest) {
  try {
    const declaredLength = request.headers.get("content-length");
    const declaredSize = checkBodySize(declaredLength, "", MAX_TEXT_BODY_CHARS, NOTES_TOO_LONG);
    if (!declaredSize.ok) {
      return NextResponse.json({ error: declaredSize.error }, { status: declaredSize.status });
    }

    // 1. Rate Limiting Check (15 requests/min per IP)
    const clientIp = getClientIp(request);
    const rateCheck = await checkRateLimit(`ai-expand:${clientIp}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many AI requests. Please wait a moment before trying again." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSec || 60) },
        }
      );
    }

    // 2. Request Body & Schema Validation
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

    const parseResult = ExpandRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input data." },
        { status: 422 }
      );
    }

    const { notes, title: initialTitle, trade } = parseResult.data;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const userId = await getSignedInUserId(request);

    if (apiKey && userId) {
      const userLimit = await takeAiTurn(userId, "expand");
      if (!userLimit.allowed) {
        return NextResponse.json(
          { error: quotaMessage(userLimit, "expand") },
          { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec || 3600) } }
        );
      }

      // Pass user notes securely as content parts, not prompt interpolation.
      // A failed Gemini call falls through to the kept-notes response below.
      try {
        const responseText = await generateGeminiText({
          apiKey,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Target Trade Category: ${trade || "General Building & Renovation"}\nExisting Title: ${initialTitle || "None"}\nRaw Job Notes to expand into professional scope of works:`,
                },
                { text: notes },
              ],
            },
          ],
          config: {
            systemInstruction:
              `You write scopes of work for ${brand.name}, for UK tradespeople. ` +
              "Expand the user's raw notes into a formal, professional scope of works suitable for a customer contract. " +
              "Detail preparation, safety, materials installation methodology, quality checks, and site clearance. " +
              "CRITICAL: NEVER hallucinate or claim regulatory registrations (e.g. Gas Safe, NICEIC, Part P) unless explicitly mentioned in the notes. " +
              "Keep the language clear, trustworthy, and free of unnecessary fluff.",
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Polished trade title",
                },
                scopeOfWork: {
                  type: "string",
                  description: "Expanded professional scope of works",
                },
              },
              required: ["title", "scopeOfWork"],
            },
          },
        });

        const parsed = parseGeminiJson(responseText);
        const cleaned = sanitizeExpandedScope(parsed, { notes, title: initialTitle });
        // A reply with no usable scope keeps the tradesperson's own notes.
        if (!cleaned.ok) {
          console.error("Gemini scope did not match the expected shape. Keeping the original notes.", cleaned.reason);
        } else {
          const result: ExpandResponse = {
            title: cleaned.title,
            scopeOfWork: cleaned.scopeOfWork,
            aiPowered: true,
          };
          return NextResponse.json(result);
        }
      } catch (error) {
        if (!shouldUseRoughEstimate(error)) throw error;
        console.error("Gemini scope expansion failed. Keeping the original notes.", error);
      }
    }

    return NextResponse.json({
      title: initialTitle || "Trade works",
      scopeOfWork: notes,
      aiPowered: false,
      notice: userId
        ? "Kept your own words. Edit them before you send the quote."
        : "Sign in for an AI rewrite. Your own words are still here.",
    });
  } catch (error) {
    console.error("Error expanding scope:", error);
    return NextResponse.json(
      { error: "Failed to expand scope. Please try again." },
      { status: 500 }
    );
  }
}
