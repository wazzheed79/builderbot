import { getServerSupabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

const AI_LIMIT = 30;
const AI_WINDOW_MS = 60 * 60 * 1000;
const AI_WINDOW_SECONDS = 60 * 60;

export type AiTurn = { allowed: boolean; retryAfterSec: number };

/**
 * One AI request for a signed-in user. Prefer the Supabase counter so the
 * limit survives a new server. Fall back to memory when the service role
 * key is not set.
 */
export async function takeAiTurn(userId: string, kind: "generate" | "expand"): Promise<AiTurn> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const sb = getServerSupabase();
    if (sb) {
      const { data, error } = await sb.rpc("consume_ai_quota", {
        p_owner: userId,
        p_kind: kind,
        p_limit: AI_LIMIT,
        p_window_seconds: AI_WINDOW_SECONDS,
      });
      if (!error && data && typeof data === "object") {
        const row = data as { allowed?: boolean; retry_after_sec?: number };
        return {
          allowed: Boolean(row.allowed),
          retryAfterSec: Math.max(1, Number(row.retry_after_sec) || AI_WINDOW_SECONDS),
        };
      }
    }
  }

  const memory = checkRateLimit(`ai-${kind}:user:${userId}`, AI_LIMIT, AI_WINDOW_MS);
  return {
    allowed: memory.allowed,
    retryAfterSec: memory.retryAfterSec || AI_WINDOW_SECONDS,
  };
}
