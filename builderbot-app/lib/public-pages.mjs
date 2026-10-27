/**
 * Pages a signed-out visitor can use without the logged-in tab bar.
 * Customer quote and invoice links are handled separately: the whole header
 * is omitted there.
 */
function barePath(pathname) {
  if (typeof pathname !== "string" || !pathname) return "";
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const GUEST_PUBLIC_PATHS = new Set([
  "/",
  "/try",
  "/login",
  "/privacy",
  "/terms",
  "/walkthrough",
  "/feedback",
  "/flyer",
  "/pricing",
  "/quote-missing",
  "/auth/callback",
  "/auth/confirm",
]);

export function isGuestPublicPath(pathname) {
  const path = barePath(pathname);
  if (!path) return false;
  return GUEST_PUBLIC_PATHS.has(path);
}

/**
 * Pages opened from the sign-in email. The guest banner and the cookie
 * banner stay off so they do not sit on top of the tap-to-sign-in screen.
 */
export function isSignInHandoffPath(pathname) {
  const path = barePath(pathname);
  return path === "/auth/confirm" || path === "/auth/callback";
}
