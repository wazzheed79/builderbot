import { getServiceRoleSupabase } from "@/lib/supabase-server";
import {
  bucketFromIdentifier,
  checkMemoryRateLimit,
  decideRateLimit,
  getClientIp,
  hashRateSubject,
  isMissingRateLimitFunction,
} from "./rate-limit.mjs";

export { getClientIp };

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
  source: "database" | "memory" | "blocked";
};

/**
 * One request against a named limit. The database counter survives a new
 * server. If that check cannot be completed, the request is refused. Memory
 * is only used when the service role key is not set, or the SQL function is
 * not installed yet.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 15,
  windowMs = 60000
): Promise<RateLimitResult> {
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!serviceRoleConfigured) {
    return { ...checkMemoryRateLimit(identifier, maxRequests, windowMs), source: "memory" };
  }

  const sb = getServiceRoleSupabase();
  if (!sb) {
    const blocked = decideRateLimit({ serviceRoleConfigured: true, rpcError: true, data: null });
    return {
      allowed: blocked.allowed,
      remaining: blocked.remaining,
      retryAfterSec: blocked.retryAfterSec,
      source: blocked.source,
    };
  }

  const result = await sb.rpc("consume_rate_limit", {
    p_bucket: bucketFromIdentifier(identifier),
    p_subject: hashRateSubject(identifier),
    p_limit: maxRequests,
    p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
  });

  if (result.error && isMissingRateLimitFunction(result.error)) {
    console.error(
      "Rate limit storage is not installed yet. Using this server's memory until the migration is applied."
    );
    return { ...checkMemoryRateLimit(identifier, maxRequests, windowMs), source: "memory" };
  }

  if (result.error) {
    console.error("Rate limit check failed", result.error.message);
  }

  const decided = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: Boolean(result.error),
    data: result.data,
  });
  return {
    allowed: decided.allowed,
    remaining: decided.remaining,
    retryAfterSec: decided.retryAfterSec,
    source: decided.source,
  };
}
