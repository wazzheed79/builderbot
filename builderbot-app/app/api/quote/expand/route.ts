import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSignedInUserId } from "@/lib/ai-access";
import { brand } from "@/lib/brand.mjs";

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
    // 1. Rate Limiting Check (15 requests/min per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`ai-expand:${clientIp}`, 15, 60000);
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
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
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

    if (apiKey) {
      if (userId) {
        const userLimit = checkRateLimit(`ai-expand:user:${userId}`, 30, 60 * 60 * 1000);
        if (!userLimit.allowed) {
          return NextResponse.json(
            { error: "AI limit reached for this hour. You can keep your own notes." },
            { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec || 3600) } }
          );
        }
      } else {
        const guestLimit = checkRateLimit(`ai-expand:guest:${clientIp}`, 15, 60 * 60 * 1000);
        if (!guestLimit.allowed) {
          return NextResponse.json({
            title: initialTitle || "Trade Works Specification",
            scopeOfWork: notes,
            aiPowered: false,
            notice: "Guest preview limit reached. Sign in for full AI scope expansion.",
          });
        }
      }

      const ai = new GoogleGenAI({ apiKey });

      // Pass user notes securely as content parts, not prompt interpolation
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Polished trade title",
              },
              scopeOfWork: {
                type: Type.STRING,
                description: "Expanded professional scope of works",
              },
            },
            required: ["title", "scopeOfWork"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      const cleanTitle = String(parsed.title || initialTitle || "Trade Works Specification")
        .trim()
        .slice(0, 150);
      const cleanScope = String(parsed.scopeOfWork || notes)
        .trim()
        .slice(0, 3000);

      const result: ExpandResponse = {
        title: cleanTitle,
        scopeOfWork: cleanScope,
        aiPowered: true,
      };

      return NextResponse.json(result);
    }

    return NextResponse.json({
      title: initialTitle || "Trade works",
      scopeOfWork: notes,
      aiPowered: false,
      notice: "Kept your own words. Edit them before you send the quote.",
    });
  } catch (error) {
    console.error("Error expanding scope:", error);
    return NextResponse.json(
      { error: "Failed to expand scope. Please try again." },
      { status: 500 }
    );
  }
}
