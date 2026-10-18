import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { roundMoney } from "@/lib/storage";
import { estimateTradeJob } from "@/lib/trade-estimator.mjs";

const GenerateRequestSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(3, "Please provide at least 3 characters of job notes.")
    .max(2000, "Notes cannot exceed 2000 characters."),
  trade: z
    .string()
    .trim()
    .max(100)
    .optional(),
  pricingMemory: z
    .object({
      laborHourlyRate: z.number().positive().optional(),
      laborDayRate: z.number().positive().optional(),
      preferredMarkupPercent: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

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
    // 1. Rate Limiting Check (15 requests/min per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`ai-generate:${clientIp}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many AI generation requests. Please wait a moment before trying again." },
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

    const parseResult = GenerateRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input data." },
        { status: 422 }
      );
    }

    const { notes, trade, pricingMemory } = parseResult.data;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      let systemInstruction =
        "You are TradeMate AI, an expert trade quantity surveyor for UK builders, electricians, plumbers, roofers, landscapers, and carpenters. " +
        "Given tradesperson notes, return realistic UK trade itemized breakdowns in JSON format. " +
        "Use realistic UK market rates in GBP (£): skilled labor should be £40-£65/hr or £220-£350/day. " +
        "Materials at realistic trade supplier prices. " +
        "Recommend a deposit % between 10 and 30 (default 20). " +
        "CRITICAL: NEVER hallucinate or claim legal trade accreditations (such as Gas Safe or NICEIC) unless explicitly mentioned in the notes.";

      if (pricingMemory) {
        const customLabor = pricingMemory.laborHourlyRate
          ? `£${pricingMemory.laborHourlyRate}/hr`
          : pricingMemory.laborDayRate
          ? `£${pricingMemory.laborDayRate}/day`
          : "standard UK rates";
        systemInstruction += ` CONTRACTOR PRICING DNA: The contractor typically charges ${customLabor} for labour and expects approximately ${pricingMemory.preferredMarkupPercent || 20}% material markup. Calibrate your line item rates to this contractor's personal pricing profile.`;
      }

      // Separate system instruction from user content to resist prompt injection
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Target Trade Category: ${trade || "General Building & Renovation"}\nItemize the following job notes into UK trade line items:`,
              },
              { text: notes },
            ],
          },
        ],
        config: {
          systemInstruction,
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

      // Clamping & Sanity Validation on AI output
      const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
      const cleanedItems: LineItemResponse[] = rawItems
        .slice(0, 50) // Cap to max 50 items
        .map((it: Partial<LineItemResponse>, idx: number) => {
          const rawType = String(it.type || "material").toLowerCase();
          const validTypes: LineItemResponse["type"][] = ["labor", "material", "service"];
          const itemType = validTypes.includes(rawType as LineItemResponse["type"])
            ? (rawType as LineItemResponse["type"])
            : "material";

          // Clamp quantities between 0.01 and 10,000
          const rawQty = Number(it.quantity) || 1;
          const clampedQty = Math.max(0.01, Math.min(10000, roundMoney(rawQty)));

          // Clamp unit rates between £0 and £50,000
          const rawRate = Number(it.rate) || 0;
          const clampedRate = Math.max(0, Math.min(50000, roundMoney(rawRate)));

          const cleanDesc = String(it.description || `Trade item #${idx + 1}`)
            .trim()
            .slice(0, 200);

          const cleanUnit = String(it.unit || "unit")
            .trim()
            .slice(0, 30);

          return {
            type: itemType,
            description: cleanDesc,
            quantity: clampedQty,
            unit: cleanUnit,
            rate: clampedRate,
          };
        });

      const depositPercent = Math.max(
        0,
        Math.min(100, Number(parsed.suggestedDepositPercent) || 20)
      );

      const result: GenerateResponse = {
        title: String(parsed.title || "Trade Works Specification").trim().slice(0, 150),
        scopeOfWork: String(parsed.scopeOfWork || notes).trim().slice(0, 2500),
        suggestedDepositPercent: depositPercent,
        items: cleanedItems,
        aiPowered: true,
      };

      return NextResponse.json(result);
    }

    // Smart Trade Heuristic Engine (Covers all major UK trades offline or when GEMINI_API_KEY is pending)
    const estimate = estimateTradeJob(notes, trade, pricingMemory as any);

    return NextResponse.json({
      title: estimate.title,
      scopeOfWork: estimate.scopeOfWork,
      suggestedDepositPercent: estimate.suggestedDepositPercent,
      items: estimate.items,
      aiPowered: false,
      notice: "Add GEMINI_API_KEY in .env.local to activate bespoke Gemini 2.5 Flash intelligence.",
    });
  } catch (error) {
    console.error("Error generating quote:", error);
    return NextResponse.json(
      { error: "Failed to generate quote. Please verify input and try again." },
      { status: 500 }
    );
  }
}
