import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface LineItemResponse {
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

interface GenerateResponse {
  title: string;
  scopeOfWork: string;
  suggestedDepositPercent: number;
  items: LineItemResponse[];
  aiPowered: boolean;
  notice?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notes, trade } = body;

    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json(
        { error: "Trade notes or voice transcription is required." },
        { status: 400 }
      );
    }

    const trimmedNotes = notes.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Convert the following tradesperson job notes/voice dictation into an itemized trade quote breakdown.
Trade Context: ${trade || "General Building & Renovation"}
Job Notes:
"${trimmedNotes}"

Requirements:
1. Provide a professional, concise project title.
2. Provide a clear, professional scope of work detailing site preparation, materials installation, execution, and cleanup. Do NOT fabricate legal accreditations (like Gas Safe or NICEIC) unless explicitly mentioned in notes.
3. Provide realistic UK trade market rates in GBP (£). Skilled labor should be £40-£65/hr or £220-£350/day. Materials at realistic merchant prices.
4. Recommend a reasonable deposit % (usually 20%).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are BuilderBot AI, an expert trade quantity surveyor and estimator for UK builders, electricians, plumbers, roofers, landscapers, and carpenters. You generate realistic, accurate UK trade itemized breakdowns in JSON format. You NEVER hallucinate legal licenses.",
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Concise professional title for the quote",
              },
              scopeOfWork: {
                type: Type.STRING,
                description: "Detailed professional scope of works",
              },
              suggestedDepositPercent: {
                type: Type.INTEGER,
                description: "Suggested deposit percentage (typically 15-25)",
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: "One of: 'labor', 'material', 'service'",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Clear description of material, labor task, or service",
                    },
                    quantity: {
                      type: Type.NUMBER,
                      description: "Numeric quantity",
                    },
                    unit: {
                      type: Type.STRING,
                      description: "Unit of measure (e.g. hrs, days, m², m, bags, unit, lot)",
                    },
                    rate: {
                      type: Type.NUMBER,
                      description: "Unit price or hourly/daily rate in GBP (£)",
                    },
                  },
                  required: ["type", "description", "quantity", "unit", "rate"],
                },
                description: "Itemized materials, labor tasks, and waste disposal services",
              },
            },
            required: ["title", "scopeOfWork", "suggestedDepositPercent", "items"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      // Validate & clean items
      const cleanedItems: LineItemResponse[] = (parsed.items || []).map(
        (it: Partial<LineItemResponse>, idx: number) => ({
          type: it.type === "labor" || it.type === "service" ? it.type : "material",
          description: it.description || `Trade item #${idx + 1}`,
          quantity: Math.max(1, Number(it.quantity) || 1),
          unit: it.unit || "unit",
          rate: Math.max(0, Math.round(((Number(it.rate) || 0) + Number.EPSILON) * 100) / 100),
        })
      );

      const result: GenerateResponse = {
        title: parsed.title || "Trade Works Specification",
        scopeOfWork: parsed.scopeOfWork || trimmedNotes,
        suggestedDepositPercent: Number(parsed.suggestedDepositPercent) || 20,
        items: cleanedItems,
        aiPowered: true,
      };

      return NextResponse.json(result);
    }

    // Heuristic Fallback when GEMINI_API_KEY is not configured
    const lower = trimmedNotes.toLowerCase();
    const fallbackItems: LineItemResponse[] = [];
    let title = "Trade Works Specification";

    if (lower.includes("fence") || lower.includes("panel") || lower.includes("post")) {
      title = "Timber Fencing & Post Installation";
      fallbackItems.push(
        {
          type: "material",
          description: "Heavy Duty Pressure-Treated Fence Panels (6ft x 5ft)",
          quantity: 6,
          unit: "panels",
          rate: 38.5,
        },
        {
          type: "material",
          description: "Slotted Concrete Posts & Postcrete Rapid Setting Concrete",
          quantity: 7,
          unit: "sets",
          rate: 26.0,
        },
        {
          type: "labor",
          description: "Post hole excavation, concrete setting, and panel assembly",
          quantity: 12,
          unit: "hrs",
          rate: 45.0,
        },
        {
          type: "service",
          description: "Dismantle and licensed disposal of old damaged fencing",
          quantity: 1,
          unit: "service",
          rate: 120.0,
        }
      );
    } else if (lower.includes("wall") || lower.includes("brick") || lower.includes("mortar")) {
      title = "Garden Brick Wall Construction";
      fallbackItems.push(
        {
          type: "material",
          description: "Facing Bricks, Class M4 Building Mortar & Concrete Footing Mix",
          quantity: 1,
          unit: "lot",
          rate: 480.0,
        },
        {
          type: "labor",
          description: "Trench excavation, strip foundation concrete pour & bricklaying",
          quantity: 16,
          unit: "hrs",
          rate: 48.0,
        },
        {
          type: "service",
          description: "Excavated earth and rubble removal from site",
          quantity: 1,
          unit: "service",
          rate: 140.0,
        }
      );
    } else {
      title = "Specified Trade Installation & Labor";
      fallbackItems.push(
        {
          type: "material",
          description: `Primary materials & fixings for: ${trimmedNotes.slice(0, 40)}...`,
          quantity: 1,
          unit: "lot",
          rate: 350.0,
        },
        {
          type: "labor",
          description: "Trade site preparation, skilled installation, and finishing",
          quantity: 8,
          unit: "hrs",
          rate: 50.0,
        },
        {
          type: "service",
          description: "Site clearance and clean-down upon completion",
          quantity: 1,
          unit: "service",
          rate: 80.0,
        }
      );
    }

    return NextResponse.json({
      title,
      scopeOfWork: `Scope of works: ${trimmedNotes}. Includes delivery of trade materials, skilled labor execution, and waste clearance upon completion.`,
      suggestedDepositPercent: 20,
      items: fallbackItems,
      aiPowered: false,
      notice: "Add GEMINI_API_KEY in .env.local to activate real-time Gemini 2.5 Flash intelligence.",
    });
  } catch (error) {
    console.error("Error generating quote:", error);
    return NextResponse.json(
      { error: "Failed to generate quote. Please verify input and try again." },
      { status: 500 }
    );
  }
}
