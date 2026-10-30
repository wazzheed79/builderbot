import { getServiceRoleSupabase } from "@/lib/supabase-server";
import { checkMemoryRateLimit, isServiceRoleKey } from "@/lib/rate-limit.mjs";
import { reportServerFault } from "@/lib/server-fault";
import {
  AI_LIMIT,
  AI_WINDOW_MS,
  AI_WINDOW_SECONDS,
  decideAiTurn,
} from "@/lib/ai-quota.mjs";

export { quotaMessage } from "@/lib/ai-quota.mjs";

export type AiTurn = {
  allowed: boolean;
  retryAfterSec: number;
  source: "database" | "memory" | "blocked";
};

function memoryTurn(userId: string, kind: "generate" | "expand") {
  return checkMemoryRateLimit(`ai-${kind}:user:${userId}`, AI_LIMIT, AI_WINDOW_MS);
}

/**
 * One AI request for a signed-in user. The database counter is the limit that
 * survives a new server, called with the service-role client. If that check
 * cannot be completed, this server's memory applies the same hourly limit for
 * that account. The first requests in the hour still go through. A stored
 * "limit reached" answer still stops the request. Memory is also used when
 * the service role key is not set.
 */
export async function takeAiTurn(userId: string, kind: "generate" | "expand"): Promise<AiTurn> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const serviceRoleConfigured = Boolean(serviceKey);
  let data: unknown = null;
  let useMemory = !serviceRoleConfigured;

  if (serviceRoleConfigured) {
    if (!isServiceRoleKey(serviceKey)) {
      useMemory = true;
      reportServerFault(
        "AI quota check could not use the database. This server's own hourly limit is being used instead."
      );
    } else {
      const sb = getServiceRoleSupabase();
      if (!sb) {
        useMemory = true;
        reportServerFault(
          "AI quota check could not use the database. The service-role client was not available, so this server's own hourly limit is being used instead."
        );
      } else {
        const result = await sb.rpc("consume_ai_quota", {
          p_owner: userId,
          p_kind: kind,
          p_limit: AI_LIMIT,
          p_window_seconds: AI_WINDOW_SECONDS,
        });
        data = result.data;
        if (result.error) {
          useMemory = true;
          reportServerFault(
            `AI quota check failed. ${result.error.message || "The database check did not finish."} This server's own hourly limit is being used instead.`
          );
        }
      }
    }
  }

  const memory = useMemory ? memoryTurn(userId, kind) : undefined;

  const turn = decideAiTurn({
    serviceRoleConfigured: serviceRoleConfigured && !useMemory,
    rpcError: false,
    data,
    memoryAllowed: memory ? memory.allowed : false,
    memoryRetryAfterSec: memory?.retryAfterSec,
  });
  const source = turn.source === "database" || turn.source === "blocked" ? turn.source : "memory";
  return { allowed: turn.allowed, retryAfterSec: turn.retryAfterSec, source };
}
