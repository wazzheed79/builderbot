/**
 * Pages a signed-out visitor can use without the logged-in tab bar.
 * Customer quote and invoice links are handled separately: the whole header
 * is omitted there.
 */
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
  if (typeof pathname !== "string" || !pathname) return false;
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return GUEST_PUBLIC_PATHS.has(path);
}
