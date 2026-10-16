import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface ExpandResponse {
  title: string;
  scopeOfWork: string;
  aiPowered: boolean;
  notice?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notes, title: initialTitle, trade } = body;

    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json(
        { error: "Scope notes or bullet points are required." },
        { status: 400 }
      );
    }

    const trimmedNotes = notes.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Expand the following tradesperson job notes into a formal, professional scope of works suitable for a customer contract.
Trade Category: ${trade || "General Building & Renovation"}
Existing Title (if any): "${initialTitle || ""}"
Raw Notes:
"${trimmedNotes}"

Instructions:
1. Provide a professional, refined title for the project if not already provided.
2. Expand the notes into professional, polished contractor language detailing:
   - Preparation and safety steps
   - Materials specification and installation methodology
   - Execution and quality checks
   - Removal of debris and site sweep upon completion
3. NEVER fabricate regulatory registrations (e.g. Gas Safe, NICEIC, Part P) unless explicitly mentioned in the notes.
4. Keep the wording clear, trustworthy, and free of unnecessary fluff.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are BuilderBot AI, an expert trade specification writer for UK tradespeople. You write professional, concise, contract-ready trade scopes of work in JSON format.",
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

      const result: ExpandResponse = {
        title: parsed.title || initialTitle || "Trade Works Specification",
        scopeOfWork: parsed.scopeOfWork || trimmedNotes,
        aiPowered: true,
      };

      return NextResponse.json(result);
    }

    // Heuristic fallback if GEMINI_API_KEY is not configured
    const lower = trimmedNotes.toLowerCase();
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
      scopeOfWork = `Scope of works: ${trimmedNotes}. Includes delivery and handling of required trade materials, surface and site preparation, skilled trade execution, and complete site cleanup upon completion.`;
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
