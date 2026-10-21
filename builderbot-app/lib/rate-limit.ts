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
  source: "database" | "memory" | "blocked" | "open";
};

function allowedBecauseCheckFailed(maxRequests: number): RateLimitResult {
  return { allowed: true, remaining: maxRequests, source: "open" };
}

/**
 * One request against a named limit. The database counter survives a new
 * server and is called with the service-role client. If that check cannot be
 * completed, the request is allowed and the fault is logged. Memory is only
 * used when the service role key is not set, or the SQL function is not
 * installed yet.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 15,
  windowMs = 60000
): Promise<RateLimitResult> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const serviceRoleConfigured = Boolean(serviceKey);

  if (!serviceRoleConfigured) {
    return { ...checkMemoryRateLimit(identifier, maxRequests, windowMs), source: "memory" };
  }

  if (!isServiceRoleKey(serviceKey)) {
    reportServerFault(
      "Rate limit check skipped. The server key cannot call consume_rate_limit, so this request was allowed."
    );
    return allowedBecauseCheckFailed(maxRequests);
  }

  const sb = getServiceRoleSupabase();
  if (!sb) {
    reportServerFault(
      "Rate limit check skipped. The service-role client was not available, so this request was allowed."
    );
    return allowedBecauseCheckFailed(maxRequests);
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
    reportServerFault(
      `Rate limit check failed. ${result.error.message || "The database check did not finish."} This request was allowed.`
    );
  }

  const decided = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: Boolean(result.error),
    data: result.data,
    openRemaining: maxRequests,
  });
  return {
    allowed: decided.allowed,
    remaining: decided.remaining,
    retryAfterSec: decided.retryAfterSec,
    source: decided.source,
  };
}
