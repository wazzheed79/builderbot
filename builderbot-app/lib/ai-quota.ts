import { getServiceRoleSupabase } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { isServiceRoleKey } from "@/lib/rate-limit.mjs";
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
  source: "database" | "memory" | "blocked" | "open";
};

/**
 * One AI request for a signed-in user. The database counter is the limit that
 * survives a new server, called with the service-role client. If that check
 * cannot be completed, the request is allowed and the fault is logged. A
 * stored "limit reached" answer still stops the request. Memory is only used
 * when the service role key is not set.
 */
export async function takeAiTurn(userId: string, kind: "generate" | "expand"): Promise<AiTurn> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const serviceRoleConfigured = Boolean(serviceKey);
  let rpcError = false;
  let data: unknown = null;

  if (serviceRoleConfigured) {
    if (!isServiceRoleKey(serviceKey)) {
      rpcError = true;
      reportServerFault(
        "AI quota check skipped. The server key cannot call consume_ai_quota, so this request was allowed."
      );
    } else {
      const sb = getServiceRoleSupabase();
      if (!sb) {
        rpcError = true;
        reportServerFault(
          "AI quota check skipped. The service-role client was not available, so this request was allowed."
        );
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
          reportServerFault(
            `AI quota check failed. ${result.error.message || "The database check did not finish."} This request was allowed.`
          );
        }
      }
    }
  }

  const memory = serviceRoleConfigured
    ? undefined
    : await checkRateLimit(`ai-${kind}:user:${userId}`, AI_LIMIT, AI_WINDOW_MS);

  const turn = decideAiTurn({
    serviceRoleConfigured,
    rpcError,
    data,
    memoryAllowed: memory ? memory.allowed : false,
    memoryRetryAfterSec: memory?.retryAfterSec,
  });
  const source =
    turn.source === "database" || turn.source === "blocked" || turn.source === "open"
      ? turn.source
      : "memory";
  return { allowed: turn.allowed, retryAfterSec: turn.retryAfterSec, source };
}
