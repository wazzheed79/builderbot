import { getServiceRoleSupabase } from "@/lib/supabase-server";
import { checkMemoryRateLimit, isServiceRoleKey, refundMemoryRateLimit } from "@/lib/rate-limit.mjs";
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

/**
 * Gives back one AI request that was taken with takeAiTurn but did not get a
 * usable AI answer, so a Gemini outage does not use up the hourly allowance.
 * The database copy is lowered by one only if nobody changed it meanwhile;
 * if it did change, the refund is skipped rather than risk a wrong count.
 * Never throws.
 */
export async function refundAiTurn(userId: string, kind: "generate" | "expand", turn: AiTurn): Promise<void> {
  try {
    if (!turn.allowed) return;
    if (turn.source === "memory") {
      refundMemoryRateLimit(`ai-${kind}:user:${userId}`);
      return;
    }
    if (turn.source !== "database") return;
    const sb = getServiceRoleSupabase();
    if (!sb) return;
    const current = await sb
      .from("ai_usage")
      .select("request_count")
      .eq("owner_id", userId)
      .eq("kind", kind)
      .maybeSingle();
    const count = Number((current.data as { request_count?: unknown } | null)?.request_count);
    if (current.error || !Number.isFinite(count) || count <= 0) return;
    await sb
      .from("ai_usage")
      .update({ request_count: count - 1 })
      .eq("owner_id", userId)
      .eq("kind", kind)
      .eq("request_count", count);
  } catch {
    // A refund that fails just leaves the request counted.
  }
}
