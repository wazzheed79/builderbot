/** 30 quote builds and 30 scope rewrites, each in a rolling hour. The database stores the count. */
export const AI_LIMIT = 30;
export const AI_WINDOW_SECONDS = 60 * 60;
export const AI_WINDOW_MS = AI_WINDOW_SECONDS * 1000;

/**
 * @param {unknown} data
 */
export function readQuotaPayload(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (data && typeof data === "object") return /** @type {Record<string, unknown>} */ (data);
  return null;
}

/**
 * The browser cannot decide this. A failed database check allows the AI call
 * so a broken limit does not stop every quote. A stored "not allowed" answer
 * still blocks it. Memory is only used when this server has no service-role key.
 * @param {{
 *   serviceRoleConfigured: boolean,
 *   rpcError: boolean,
 *   data: unknown,
 *   memoryAllowed?: boolean,
 *   memoryRetryAfterSec?: number
 * }} input
 */
export function decideAiTurn(input) {
  if (!input.serviceRoleConfigured) {
    return {
      allowed: Boolean(input.memoryAllowed),
      retryAfterSec: Math.max(1, Number(input.memoryRetryAfterSec) || AI_WINDOW_SECONDS),
      source: /** @type {"memory"} */ ("memory"),
    };
  }

  if (input.rpcError) {
    return {
      allowed: true,
      retryAfterSec: 0,
      source: /** @type {"open"} */ ("open"),
    };
  }

  const payload = readQuotaPayload(input.data);
  if (!payload || typeof payload.allowed !== "boolean") {
    return {
      allowed: false,
      retryAfterSec: 60,
      source: /** @type {"blocked"} */ ("blocked"),
    };
  }

  const allowed = payload.allowed === true;
  return {
    allowed,
    retryAfterSec: allowed
      ? 0
      : Math.max(1, Number(payload.retry_after_sec) || AI_WINDOW_SECONDS),
    source: /** @type {"database"} */ ("database"),
  };
}

/**
 * @param {{ source?: string }} turn
 * @param {"generate" | "expand"} kind
 */
export function quotaMessage(turn, kind) {
  if (turn?.source === "blocked") {
    return kind === "expand"
      ? "AI help is paused for a moment. Your notes are still here. Try again shortly."
      : "AI quoting is paused for a moment. Your notes are still here. Try again shortly, or type the prices yourself.";
  }
  if (kind === "expand") {
    return "AI limit reached for this hour. Your notes are still here.";
  }
  return "AI quote limit reached for this hour. Your notes are still here. Edit prices yourself, or try again later.";
}
