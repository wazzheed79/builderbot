// Shared rate-limit rules. The database counter is applied in rate-limit.ts.
// If that check fails, memory applies the same limit. It is also used for a
// local try-out with no service role key.
import { createHash } from "node:crypto";

const rateLimitMap = new Map();

/**
 * Drop timestamps that have left their own window. A daily guest limit must
 * survive longer than a minute, so this uses the window stored with the key.
 * @param {number} [now]
 */
export function pruneMemoryRateLimits(now = Date.now()) {
  for (const [key, record] of rateLimitMap.entries()) {
    const keepFor = Math.max(1000, Number(record.windowMs) || 60000);
    record.timestamps = record.timestamps.filter((stamp) => now - stamp < keepFor);
    if (record.timestamps.length === 0) rateLimitMap.delete(key);
  }
}

if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => pruneMemoryRateLimits(), 300000);
  if (typeof timer.unref === "function") timer.unref();
}

/**
 * @param {string} identifier
 * @param {number} [maxRequests]
 * @param {number} [windowMs]
 */
export function checkMemoryRateLimit(identifier, maxRequests = 15, windowMs = 60000) {
  const now = Date.now();
  const window = Math.max(1000, Number(windowMs) || 60000);
  const record = rateLimitMap.get(identifier) || { timestamps: [], windowMs: window };
  record.windowMs = Math.max(Number(record.windowMs) || 0, window);
  record.timestamps = record.timestamps.filter((stamp) => now - stamp < window);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterSec = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  record.timestamps.push(now);
  rateLimitMap.set(identifier, record);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
  };
}

/**
 * @param {string} identifier
 */
export function bucketFromIdentifier(identifier) {
  const bucket = String(identifier || "").split(":")[0].toLowerCase();
  if (/^[a-z0-9-]{1,40}$/.test(bucket)) return bucket;
  return "api";
}

/**
 * A hash, not the IP address or user id, is what gets stored.
 * @param {string} identifier
 */
export function hashRateSubject(identifier) {
  return createHash("sha256").update(String(identifier)).digest("hex");
}

/**
 * @param {unknown} error
 */
export function isMissingRateLimitFunction(error) {
  if (!error || typeof error !== "object") return false;
  const record = /** @type {{ code?: unknown, message?: unknown }} */ (error);
  const code = String(record.code || "");
  const message = String(record.message || "");
  if (code === "PGRST202" || code === "42883") return true;
  return /consume_rate_limit/i.test(message) && /does not exist|could not find|schema cache/i.test(message);
}

/**
 * @param {unknown} data
 */
function readPayload(data) {
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
 * True when this key is allowed to call service-role-only SQL.
 * A publishable or anon key is rejected here so it is never sent to those functions.
 * The key itself is not returned or logged.
 * @param {unknown} key
 */
export function isServiceRoleKey(key) {
  const value = String(key || "").trim();
  if (!value) return false;
  if (value.startsWith("sb_secret_")) return true;
  if (value.startsWith("sb_publishable_")) return false;
  const parts = value.split(".");
  if (parts.length !== 3 || !parts[1]) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

/**
 * A failed database check uses the in-memory counter for the same limit.
 * It does not allow the request through, and it does not refuse everyone:
 * the caller must pass the memory result. A real "not allowed" answer from
 * the database still blocks the request. Memory is also used when this
 * server has no service role key, or when the SQL function is not installed.
 * @param {{
 *   serviceRoleConfigured: boolean,
 *   missingFunction?: boolean,
 *   rpcError: boolean,
 *   data: unknown,
 *   memoryAllowed?: boolean,
 *   memoryRemaining?: number,
 *   memoryRetryAfterSec?: number,
 *   openRemaining?: number
 * }} input
 */
export function decideRateLimit(input) {
  if (!input.serviceRoleConfigured || input.missingFunction || input.rpcError) {
    const allowed = Boolean(input.memoryAllowed);
    return {
      allowed,
      remaining: allowed ? Math.max(0, Number(input.memoryRemaining) || 0) : 0,
      retryAfterSec: allowed ? 0 : Math.max(1, Number(input.memoryRetryAfterSec) || 60),
      source: /** @type {"memory"} */ ("memory"),
    };
  }

  const payload = readPayload(input.data);
  if (!payload || typeof payload.allowed !== "boolean") {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: 60,
      source: /** @type {"blocked"} */ ("blocked"),
    };
  }

  const allowed = payload.allowed === true;
  return {
    allowed,
    remaining: allowed ? Math.max(0, Number(payload.remaining) || 0) : 0,
    retryAfterSec: allowed ? 0 : Math.max(1, Number(payload.retry_after_sec) || 60),
    source: /** @type {"database"} */ ("database"),
  };
}

/**
 * Prefer the header Vercel sets itself. A caller can send their own
 * x-forwarded-for, and Vercel overwrites that on a direct deployment, but
 * x-vercel-forwarded-for stays the platform value if a proxy is added later.
 * @param {Request} req
 */
export function getClientIp(req) {
  const headers = req?.headers;
  const read = (name) => {
    if (!headers || typeof headers.get !== "function") return "";
    return String(headers.get(name) || "");
  };
  return (
    firstAddress(read("x-vercel-forwarded-for")) ||
    firstAddress(read("x-real-ip")) ||
    firstAddress(read("x-forwarded-for")) ||
    "unknown"
  );
}

/**
 * @param {string} value
 */
function firstAddress(value) {
  const first = String(value || "").split(",")[0].trim();
  if (!first || first.length > 64) return "";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(first)) return first;
  if (/^[0-9a-f:]+$/i.test(first) && first.includes(":")) return first;
  return "";
}
