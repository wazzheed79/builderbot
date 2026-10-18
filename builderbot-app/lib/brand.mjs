/**
 * The only place the product name and tagline are defined.
 * To rename the product, change `name`, `shortName`, and `tagline` here.
 * Screens, page titles, the PWA manifest, and AI prompts read these fields.
 *
 * Do not put a website domain in this file. The live address can change.
 * Use relative links such as /quotes. When an absolute link is required
 * (a printed flyer or a share message), use the address of the site that
 * is actually open, or NEXT_PUBLIC_APP_URL if the owner has set it.
 */
export const brand = {
  name: "Chuffed Quotes",
  shortName: "Chuffed",
  tagline: "Quotes in under 2 minutes",
  description:
    "Create and send a professional quote in under two minutes. Free while in testing.",
  foundingTitle: "Founding member",
  foundingDetail:
    "The first 100 tradespeople who sign up get it free for 12 months.",
};

/**
 * Optional absolute site address from the host environment.
 * Empty when it has not been set. Callers should fall back to a relative link
 * or the browser's current address.
 * @returns {string}
 */
export function configuredSiteUrl() {
  const raw =
    typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : "";
  return String(raw).trim().replace(/\/$/, "");
}
