import { createClient } from "@supabase/supabase-js";

/**
 * Confirms the caller is a signed-in Supabase user.
 * Gemini is only used for these users, so an open internet request cannot
 * spend the AI key. Returns null when Supabase is not configured, the
 * token is missing, or the token is not valid.
 */
export async function getSignedInUserId(request: Request): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !url.startsWith("http")) return null;

  const header = request.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
