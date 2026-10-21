import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { roundMoney } from "@/lib/storage";
import { estimateTradeJob } from "@/lib/trade-estimator.mjs";
import { applyRememberedPrices } from "@/lib/price-memory.mjs";
import { buildChoiceOptions } from "@/lib/quote-options.mjs";
import { getSignedInUserId } from "@/lib/ai-access";
import { quotaMessage, takeAiTurn } from "@/lib/ai-quota";
import { brand } from "@/lib/brand.mjs";
import { generateGeminiText, parseGeminiJson, shouldUseRoughEstimate } from "@/lib/gemini";

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
  photos: z.array(z.string()).max(6).optional(),
  pricingMemory: z
    .object({
      laborHourlyRate: z.number().positive().optional(),
      laborDayRate: z.number().positive().optional(),
      preferredMarkupPercent: z.number().min(0).max(100).optional(),
      remembered: z
        .array(
          z.object({
            key: z.string().max(160),
            description: z.string().max(200).optional(),
            unit: z.string().max(30),
            rate: z.number().min(0).max(50000),
            itemType: z.enum(["labor", "material", "service"]).optional(),
          })
        )
        .max(80)
        .optional(),
    })
    .optional(),
  tiers: z.boolean().optional(),
});

interface LineItemResponse {
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  usualPrice?: boolean;
}

interface GenerateResponse {
  title: string;
  scopeOfWork: string;
  suggestedDepositPercent: number;
  items: LineItemResponse[];
  aiPowered: boolean;
  notice?: string;
  usualPrice?: boolean;
  options?: ReturnType<typeof buildChoiceOptions>;
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

    const { notes, trade, photos, pricingMemory, tiers } = parseResult.data;
    const remembered = pricingMemory?.remembered || [];
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const userId = await getSignedInUserId(request);

    if (apiKey && userId) {
      const userLimit = await takeAiTurn(userId, "generate");
      if (!userLimit.allowed) {
        return NextResponse.json(
          { error: quotaMessage(userLimit, "generate") },
          { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec || 3600) } }
        );
      }

      let systemInstruction =
        `You are the quoting assistant for ${brand.name}, helping UK builders, electricians, plumbers, roofers, landscapers, and carpenters. ` +
        "Given tradesperson notes, return realistic UK trade itemised breakdowns in JSON format. " +
        "Write descriptions in British spelling (labour, colour, metre). " +
        "Use realistic UK market rates in GBP (£): skilled labour should be £40-£65/hr or £220-£350/day. " +
        "Materials at realistic trade supplier prices. " +
        "Recommend a deposit % between 10 and 30 (default 20). " +
        "CRITICAL: NEVER hallucinate or claim legal trade accreditations (such as Gas Safe or NICEIC) unless explicitly mentioned in the notes.";

      const customLabor = pricingMemory?.laborHourlyRate
        ? `£${pricingMemory.laborHourlyRate}/hr`
        : pricingMemory?.laborDayRate
          ? `£${pricingMemory.laborDayRate}/day`
          : "standard UK rates";
      const rememberedPrices =
        remembered.length > 0
          ? remembered
              .slice(0, 12)
              .map((row) => `${row.description || row.key} £${row.rate} per ${row.unit}`)
              .join("; ")
          : "";

      // Extract up to 3 site photos for multimodal AI visual assessment
      const imageParts = (photos || [])
        .slice(0, 3)
        .map((photoUrl) => {
          const match = photoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
          if (match) {
            return {
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            };
          }
          return null;
        })
        .filter((p): p is { inlineData: { mimeType: string; data: string } } => Boolean(p));

      if (imageParts.length > 0) {
        systemInstruction += ` MULTIMODAL SITE INSPECTION: ${imageParts.length} site photo(s) have been provided. Inspect visible site conditions, materials, dimensions, damages, and required prep/demolition work. Include any visually detected requirements as explicit line items.`;
      }

      // Separate system instruction from user content to resist prompt injection.
      // A failed Gemini call falls through to the rough estimate below.
      try {
        const responseText = await generateGeminiText({
          apiKey,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    `Target Trade Category: ${trade || "General Building & Renovation"}\n` +
                    `Contractor labour rate: ${customLabor}. Material markup about ${pricingMemory?.preferredMarkupPercent || 20}%.\n` +
                    (rememberedPrices
                      ? `Use these remembered prices when the line is the same sort of work: ${rememberedPrices}\n`
                      : "") +
                    "Itemize the following job notes into UK trade line items:",
                },
                { text: notes },
                ...imageParts,
              ],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Concise professional title for the quote",
                },
                scopeOfWork: {
                  type: "string",
                  description: "Detailed professional scope of works",
                },
                suggestedDepositPercent: {
                  type: "integer",
                  description: "Suggested deposit percentage (typically 15-25)",
                },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        description: "One of: 'labor', 'material', 'service'",
                      },
                      description: {
                        type: "string",
                        description: "Clear description of material, labor task, or service",
                      },
                      quantity: {
                        type: "number",
                        description: "Numeric quantity",
                      },
                      unit: {
                        type: "string",
                        description: "Unit of measure (e.g. hrs, days, m², m, bags, unit, lot)",
                      },
                      rate: {
                        type: "number",
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

        const parsed = parseGeminiJson(responseText);

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
        const rememberedItems = applyRememberedPrices(cleanedItems, remembered) as LineItemResponse[];

        const depositPercent = Math.max(
          0,
          Math.min(100, Number(parsed.suggestedDepositPercent) || 20)
        );

        const result: GenerateResponse = {
          title: String(parsed.title || "Trade Works Specification").trim().slice(0, 150),
          scopeOfWork: String(parsed.scopeOfWork || notes).trim().slice(0, 2500),
          suggestedDepositPercent: depositPercent,
          items: rememberedItems,
          aiPowered: true,
          ...(tiers ? { options: buildChoiceOptions(rememberedItems, true, depositPercent) } : {}),
        };

        return NextResponse.json(result);
      } catch (error) {
        if (!shouldUseRoughEstimate(error)) throw error;
        console.error("Gemini quote generation failed. Using the rough estimate.", error);
      }
    }

    // Smart Trade Heuristic Engine (Covers all major UK trades offline or when GEMINI_API_KEY is pending)
    const estimate = estimateTradeJob(notes, trade || "", pricingMemory, photos);
    const rememberedItems = applyRememberedPrices(estimate.items, remembered);

    return NextResponse.json({
      title: estimate.title,
      scopeOfWork: estimate.scopeOfWork,
      suggestedDepositPercent: estimate.suggestedDepositPercent,
      items: rememberedItems,
      ...(tiers
        ? { options: buildChoiceOptions(rememberedItems, true, estimate.suggestedDepositPercent) }
        : {}),
      aiPowered: false,
      estimateOnly: true,
      notice:
        !userId && apiKey
          ? "Rough estimate. Sign in for AI prices, and change every price before you send it."
          : "Rough estimate. Change every price before you send it.",
    });
  } catch (error) {
    console.error("Error generating quote:", error);
    return NextResponse.json(
      { error: "Failed to generate quote. Please verify input and try again." },
      { status: 500 }
    );
  }
}
