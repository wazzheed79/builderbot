/** Email link types Supabase puts on token_hash sign-in links. */
export const OTP_LINK_TYPES = [
  "magiclink",
  "email",
  "signup",
  "recovery",
  "invite",
  "email_change",
];

/**
 * Turn a Supabase error query value into a sentence a person can read.
 * @param {string} message
 */
export function plainAuthError(message) {
  const text = String(message || "").replace(/\+/g, " ").trim();
  if (!text) return "The sign-in link could not be used.";
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * @param {string} value
 */
function readParams(value) {
  const raw = String(value || "").replace(/^[?#]/, "");
  return new URLSearchParams(raw);
}

/**
 * Read the sign-in details Supabase appends when someone opens an email link.
 * Handles PKCE `?code=`, `token_hash` with type `magiclink` or `email`, and
 * the implicit-flow hash (`#access_token` and `#refresh_token`) that the
 * default Magic Link template produces.
 * @param {string} [search]
 * @param {string} [hash]
 */
export function readAuthCallback(search = "", hash = "") {
  const query = readParams(search);
  const fragment = readParams(hash);

  const errorText =
    query.get("error_description") ||
    fragment.get("error_description") ||
    query.get("error_code") ||
    fragment.get("error_code") ||
    query.get("error") ||
    fragment.get("error");
  if (errorText) {
    return { kind: "error", message: plainAuthError(errorText) };
  }

  const code = (query.get("code") || "").trim();
  if (code) return { kind: "code", code };

  const tokenHash = (query.get("token_hash") || fragment.get("token_hash") || "").trim();
  if (tokenHash) {
    const type = (query.get("type") || fragment.get("type") || "").trim().toLowerCase();
    if (!OTP_LINK_TYPES.includes(type)) {
      return { kind: "error", message: "This sign-in link is missing a usable type." };
    }
    return { kind: "otp", tokenHash, type };
  }

  const accessToken = (fragment.get("access_token") || query.get("access_token") || "").trim();
  const refreshToken = (fragment.get("refresh_token") || query.get("refresh_token") || "").trim();
  if (accessToken && refreshToken) {
    return { kind: "session", accessToken, refreshToken };
  }

  return { kind: "none" };
}

/**
 * A same-site path from an email link. Anything else opens the dashboard.
 * @param {string | null | undefined} value
 */
export function safeNextPath(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  if (/[\u0000-\u001f\u007f\\]/.test(raw) || raw.includes("://")) return "/dashboard";
  let url;
  try {
    url = new URL(raw, "https://chuffed.local");
  } catch {
    return "/dashboard";
  }
  if (url.origin !== "https://chuffed.local") return "/dashboard";
  if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return "/dashboard";
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * A short message for an expired, used, or broken email link.
 * @param {string} [message]
 * @param {string} [code]
 */
export function friendlyLinkError(message, code) {
  const text = `${code || ""} ${message || ""}`.toLowerCase();
  if (text.includes("already") || (text.includes("used") && !text.includes("expired"))) {
    return "This sign-in link has already been used.";
  }
  if (text.includes("expired") || text.includes("otp_expired")) {
    return "This sign-in link has expired.";
  }
  if (text.includes("missing")) {
    return "This sign-in link is missing its details.";
  }
  return "This sign-in link has expired or has already been used.";
}

/**
 * Read the email-link details for the tap-to-sign-in page. Does not use the link.
 * @param {string} [search]
 */
export function readConfirmRequest(search = "") {
  const query = readParams(search);
  const next = safeNextPath(query.get("next"));
  const errorText = query.get("error_description") || query.get("error_code") || query.get("error");
  if (errorText) {
    return {
      ok: false,
      next,
      message: friendlyLinkError(plainAuthError(errorText), query.get("error_code") || ""),
    };
  }
  const tokenHash = (query.get("token_hash") || "").trim();
  const type = (query.get("type") || "").trim().toLowerCase();
  if (!tokenHash || !OTP_LINK_TYPES.includes(type)) {
    return { ok: false, next, message: "This sign-in link is missing its details." };
  }
  return { ok: true, tokenHash, type, next };
}

/**
 * Where to send the browser when an email link lands on the wrong page.
 * Returns null when this page should finish the sign-in itself.
 * @param {string} pathname
 * @param {string} [search]
 * @param {string} [hash]
 */
export function authCallbackTarget(pathname, search = "", hash = "") {
  // /auth/confirm must not bounce to the callback. The callback uses the link
  // as soon as the page opens, which is what email scanners do.
  if (pathname === "/auth/callback" || pathname === "/auth/confirm") return null;
  const parsed = readAuthCallback(search, hash);
  if (parsed.kind === "none") return null;
  if (parsed.kind === "error") {
    const query = readParams(search);
    const fragment = readParams(hash);
    const fromSupabase = Boolean(
      query.get("error_description") ||
        fragment.get("error_description") ||
        query.get("error_code") ||
        fragment.get("error_code")
    );
    if (!fromSupabase) return null;
  }
  return `/auth/callback${search || ""}${hash || ""}`;
}
