import {
  GoogleGenAI,
  type ThinkingLevel,
  type ContentListUnion,
  type GenerateContentConfig,
} from "@google/genai";
import {
  GEMINI_QUOTE_THINKING_LEVEL,
  GEMINI_REQUEST_TIMEOUT_MS,
  modelUsesThinkingLevel,
  resolveGeminiModel,
} from "./gemini.mjs";

export {
  DEFAULT_GEMINI_MODEL,
  GEMINI_QUOTE_THINKING_LEVEL,
  GEMINI_REQUEST_TIMEOUT_MS,
  GEMINI_ROUTE_MAX_DURATION_SECONDS,
  geminiFailureCode,
  modelUsesThinkingLevel,
  parseGeminiJson,
  resolveGeminiModel,
  shouldUseRoughEstimate,
} from "./gemini.mjs";

/**
 * One Gemini JSON call for the quote routes.
 *
 * Gemini 3 still accepts responseMimeType application/json with a JSON Schema
 * in responseJsonSchema (lowercase types such as "object", not the older
 * OpenAPI "OBJECT"). Temperature is left at the model default: Gemini 3 is
 * tuned for 1.0, and a lower value can loop. thinkingBudget is the Gemini 2.5
 * control and must not be sent with thinkingLevel.
 *
 * Gemini 3.6 Flash thinks at medium unless told otherwise. A quote is one
 * turn, so these calls send thinkingConfig.thinkingLevel MINIMAL, the lowest
 * level that model accepts in @google/genai. The request timeout is also sent
 * to Google as X-Server-Timeout. A deadline that is too short comes back as
 * http_504 and the route uses the rough estimate.
 */
export async function generateGeminiText(options: {
  apiKey: string;
  contents: ContentListUnion;
  config: GenerateContentConfig;
}): Promise<string> {
  const model = resolveGeminiModel();
  const ai = new GoogleGenAI({
    apiKey: options.apiKey,
    httpOptions: {
      timeout: GEMINI_REQUEST_TIMEOUT_MS,
      // One attempt. A 429, 503, or 504 should fall back to the rough estimate
      // instead of waiting through the SDK's default retry delays.
      retryOptions: { attempts: 1 },
    },
  });

  const response = await ai.models.generateContent({
    model,
    contents: options.contents,
    config: {
      ...options.config,
      ...(modelUsesThinkingLevel(model)
        ? { thinkingConfig: { thinkingLevel: GEMINI_QUOTE_THINKING_LEVEL as ThinkingLevel } }
        : {}),
    },
  });

  return response.text ?? "";
}
