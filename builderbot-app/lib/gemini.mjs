// Shared Gemini settings for the quote routes.
// The model id is read once here so generate and expand cannot drift apart.

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

// gemini-3.5-flash usually answers in about a second. Twenty seconds covers a
// quote with site photos, then the route falls back to the rough estimate.
export const GEMINI_REQUEST_TIMEOUT_MS = 20_000;

const MODEL_ID = /^[A-Za-z0-9._-]{1,80}$/;

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveGeminiModel(env = process.env) {
  let configured = String(env?.GEMINI_MODEL ?? "").trim();
  if (configured.toLowerCase().startsWith("models/")) {
    configured = configured.slice("models/".length).trim();
  }
  if (configured && MODEL_ID.test(configured)) return configured;
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Gemini 3 and later use thinkingLevel. Gemini 2.5 rejects that field and
 * uses thinkingBudget instead, so an older override must not send it.
 * @param {string} model
 */
export function modelUsesThinkingLevel(model) {
  return /^gemini-[3-9](?:[.-]|$)/i.test(model);
}

const ROUGH_ESTIMATE_MIN_STATUS = 400;
const ROUGH_ESTIMATE_MAX_STATUS = 599;

/**
 * @param {unknown} error
 * @returns {number | undefined}
 */
function readStatus(error) {
  if (!error || typeof error !== "object") return undefined;
  const record = /** @type {{ status?: unknown, cause?: unknown }} */ (error);
  if (typeof record.status === "number" && Number.isFinite(record.status)) {
    return record.status;
  }
  if (typeof record.status === "string" && /^\d{3}$/.test(record.status)) {
    return Number(record.status);
  }
  if (record.cause) return readStatus(record.cause);
  return undefined;
}

/**
 * @param {unknown} error
 */
function readName(error) {
  if (!error || typeof error !== "object") return "";
  return String(/** @type {{ name?: unknown }} */ (error).name || "");
}

/**
 * @param {unknown} error
 */
function readMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error !== "object") return String(error);
  const record = /** @type {{ message?: unknown, cause?: unknown }} */ (error);
  const message = typeof record.message === "string" ? record.message : "";
  const cause = record.cause ? readMessage(record.cause) : "";
  return `${message} ${cause}`.trim();
}

/**
 * True when the quote routes should keep going with the rough estimate
 * instead of showing an error. Covers Google 404, 429, and 503, plus
 * timeouts, other HTTP failures, empty replies, and unreadable JSON.
 * @param {unknown} error
 */
export function shouldUseRoughEstimate(error) {
  const status = readStatus(error);
  if (
    status !== undefined &&
    status >= ROUGH_ESTIMATE_MIN_STATUS &&
    status <= ROUGH_ESTIMATE_MAX_STATUS
  ) {
    return true;
  }

  const name = readName(error);
  const causeName =
    error && typeof error === "object" && "cause" in error
      ? readName(/** @type {{ cause?: unknown }} */ (error).cause)
      : "";
  if (
    name === "AbortError" ||
    name === "TimeoutError" ||
    name === "GeminiEmptyResponseError" ||
    name === "SyntaxError" ||
    causeName === "AbortError" ||
    causeName === "TimeoutError"
  ) {
    return true;
  }

  const message = readMessage(error).toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("aborted") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("enotfound") ||
    message.includes("eai_again") ||
    message.includes("socket hang up") ||
    message.includes("network")
  );
}

/**
 * @param {string} text
 */
export function parseGeminiJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    const error = new Error("Gemini returned an empty response.");
    error.name = "GeminiEmptyResponseError";
    // Treated like a failed upstream call so the quote still gets a rough estimate.
    Object.assign(error, { status: 502 });
    throw error;
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(body);
}
