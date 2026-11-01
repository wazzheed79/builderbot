import { CANONICAL_ORIGIN } from "./domain-redirect.mjs";

/**
 * Pages listed in sitemap.xml. Every address uses the www host.
 * The bare domain redirects there, so a loc on the bare domain would
 * send crawlers through an extra 308.
 */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/try",
  "/walkthrough",
  "/pricing",
  "/login",
  "/feedback",
  "/privacy",
  "/terms",
];

/**
 * Absolute https://www.chuffedquotes.co.uk address for a site path.
 * @param {string} [path]
 */
export function absoluteCanonicalUrl(path = "/") {
  const raw = String(path || "/").trim();
  const suffix = raw.startsWith("/") ? raw : `/${raw}`;
  if (suffix === "/") return CANONICAL_ORIGIN;
  return `${CANONICAL_ORIGIN}${suffix}`;
}

/**
 * @returns {string[]}
 */
export function sitemapLocations() {
  return PUBLIC_SITEMAP_PATHS.map((path) => absoluteCanonicalUrl(path));
}
