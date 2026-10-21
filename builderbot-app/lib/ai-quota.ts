import { getServiceRoleSupabase } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  AI_LIMIT,
  AI_WINDOW_MS,
  AI_WINDOW_SECONDS,
  decideAiTurn,
} from "@/lib/ai-quota.mjs";

export { quotaMessage } from "@/lib/ai-quota.mjs";

export type AiTurn = { allowed: boolean; retryAfterSec: number; source: "database" | "memory" | "blocked" };

/**
 * One AI request for a signed-in user. The database counter is the limit that
 * survives a new server. If that check cannot be completed, the request is
 * refused so a browser retry cannot skip the limit. Memory is only used when
 * the service role key is not set.
 */
export async function takeAiTurn(userId: string, kind: "generate" | "expand"): Promise<AiTurn> {
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  let rpcError = false;
  let data: unknown = null;

  if (serviceRoleConfigured) {
    const sb = getServiceRoleSupabase();
    if (!sb) {
      rpcError = true;
    } else {
      const result = await sb.rpc("consume_ai_quota", {
        p_owner: userId,
        p_kind: kind,
        p_limit: AI_LIMIT,
        p_window_seconds: AI_WINDOW_SECONDS,
      });
      rpcError = Boolean(result.error);
      data = result.data;
      if (result.error) {
        console.error("AI quota check failed", result.error.message);
      }
    }
  }

  const memory = serviceRoleConfigured
    ? undefined
    : checkRateLimit(`ai-${kind}:user:${userId}`, AI_LIMIT, AI_WINDOW_MS);

  const turn = decideAiTurn({
    serviceRoleConfigured,
    rpcError,
    data,
    memoryAllowed: memory ? memory.allowed : false,
    memoryRetryAfterSec: memory?.retryAfterSec,
  });
  const source = turn.source === "database" || turn.source === "blocked" ? turn.source : "memory";
  return { allowed: turn.allowed, retryAfterSec: turn.retryAfterSec, source };
}
