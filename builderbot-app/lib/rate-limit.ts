import { getServiceRoleSupabase } from "@/lib/supabase-server";
import { reportServerFault } from "@/lib/server-fault";
import {
  bucketFromIdentifier,
  checkMemoryRateLimit,
  decideRateLimit,
  getClientIp,
  hashRateSubject,
  isMissingRateLimitFunction,
  isServiceRoleKey,
} from "./rate-limit.mjs";

export { getClientIp };

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
  source: "database" | "memory" | "blocked";
};

function memoryLimit(identifier: string, maxRequests: number, windowMs: number): RateLimitResult {
  return { ...checkMemoryRateLimit(identifier, maxRequests, windowMs), source: "memory" };
}

/**
 * One request against a named limit. The database counter survives a new
 * server and is called with the service-role client. If that check cannot be
 * completed, this server's memory applies the same limit for this address or
 * account. That still lets the first requests through, and it stops the next
 * one once the limit is used. A stored "not allowed" answer still stops the
 * request. Memory is also used when the service role key is not set, or the
 * SQL function is not installed yet.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 15,
  windowMs = 60000
): Promise<RateLimitResult> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const serviceRoleConfigured = Boolean(serviceKey);

  if (!serviceRoleConfigured) {
    return memoryLimit(identifier, maxRequests, windowMs);
  }

  if (!isServiceRoleKey(serviceKey)) {
    reportServerFault(
      "Rate limit check could not use the database. This server's own limit is being used instead."
    );
    return memoryLimit(identifier, maxRequests, windowMs);
  }

  const sb = getServiceRoleSupabase();
  if (!sb) {
    reportServerFault(
      "Rate limit check could not use the database. The service-role client was not available, so this server's own limit is being used instead."
    );
    return memoryLimit(identifier, maxRequests, windowMs);
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
    return memoryLimit(identifier, maxRequests, windowMs);
  }

  if (result.error) {
    reportServerFault(
      `Rate limit check failed. ${result.error.message || "The database check did not finish."} This server's own limit is being used instead.`
    );
    return memoryLimit(identifier, maxRequests, windowMs);
  }

  const decided = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: false,
    data: result.data,
  });
  return {
    allowed: decided.allowed,
    remaining: decided.remaining,
    retryAfterSec: decided.retryAfterSec,
    source: decided.source,
  };
}
