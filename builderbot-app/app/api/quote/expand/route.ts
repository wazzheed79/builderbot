import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

    if (apiKey) {
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
            "You are BuilderBot AI, an expert trade specification writer for UK tradespeople. " +
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

    // Heuristic fallback if GEMINI_API_KEY is not configured
    const lower = notes.toLowerCase();
    let title = initialTitle || "Trade Works Specification";
    let scopeOfWork = "";

    if (lower.includes("garden wall") || lower.includes("wall") || lower.includes("brick")) {
      title = initialTitle || "Brick Garden Wall Construction";
      scopeOfWork =
        "Excavate trench to firm ground. Pour C20/25 concrete strip foundation to building standards. Supply and construct double-skin brick wall with Class M4 mortar bedding, weep holes, and decorative coping crest. Remove all spoil and debris upon completion.";
    } else if (lower.includes("fence") || lower.includes("panel")) {
      title = initialTitle || "Timber Fencing & Post Installation";
      scopeOfWork =
        "Supply and erect pressure-treated lap fence panels. Excavate post holes to 600mm minimum depth, set posts in rapid-setting Postcrete, secure gravel boards, and clear all dismantled old fencing from site.";
    } else if (lower.includes("boiler") || lower.includes("heating")) {
      title = initialTitle || "High-Efficiency Boiler Installation";
      scopeOfWork =
        "Drain system and remove existing boiler. Supply and install high-efficiency condensing boiler, connect flue, powerflush heating loop, fit magnetic system filter, and install wireless programmable thermostat. Commission system and issue benchmark documentation.";
    } else {
      scopeOfWork = `Scope of works: ${notes}. Includes delivery and handling of required trade materials, surface and site preparation, skilled trade execution, and complete site cleanup upon completion.`;
    }

    return NextResponse.json({
      title,
      scopeOfWork,
      aiPowered: false,
      notice: "Add GEMINI_API_KEY in .env.local to activate real-time Gemini 2.5 Flash intelligence.",
    });
  } catch (error) {
    console.error("Error expanding scope:", error);
    return NextResponse.json(
      { error: "Failed to expand scope. Please try again." },
      { status: 500 }
    );
  }
}
