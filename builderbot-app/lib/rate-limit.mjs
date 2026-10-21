// Shared rate-limit rules. The database counter is applied in rate-limit.ts.
// Memory is only the fallback for a local try-out with no service role key.
import { createHash } from "node:crypto";

const rateLimitMap = new Map();

if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((stamp) => now - stamp < 60000);
      if (record.timestamps.length === 0) rateLimitMap.delete(key);
    }
  }, 300000);
  if (typeof timer.unref === "function") timer.unref();
}

/**
 * @param {string} identifier
 * @param {number} [maxRequests]
 * @param {number} [windowMs]
 */
export function checkMemoryRateLimit(identifier, maxRequests = 15, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier) || { timestamps: [] };
  record.timestamps = record.timestamps.filter((stamp) => now - stamp < windowMs);

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
 * A failed database check blocks the request. Memory is used when this server
 * has no service role key, or when the SQL function has not been installed yet.
 * @param {{
 *   serviceRoleConfigured: boolean,
 *   missingFunction?: boolean,
 *   rpcError: boolean,
 *   data: unknown,
 *   memoryAllowed?: boolean,
 *   memoryRemaining?: number,
 *   memoryRetryAfterSec?: number
 * }} input
 */
export function decideRateLimit(input) {
  if (!input.serviceRoleConfigured || input.missingFunction) {
    const allowed = Boolean(input.memoryAllowed);
    return {
      allowed,
      remaining: allowed ? Math.max(0, Number(input.memoryRemaining) || 0) : 0,
      retryAfterSec: allowed ? 0 : Math.max(1, Number(input.memoryRetryAfterSec) || 60),
      source: /** @type {"memory"} */ ("memory"),
    };
  }

  const payload = input.rpcError ? null : readPayload(input.data);
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
