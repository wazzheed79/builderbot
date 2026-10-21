/**
 * Permanent move from the old TradeMate domain onto Chuffed Quotes.
 * The path and query string stay the same, so a quote link and a
 * Supabase sign-in callback still land on the matching page.
 */

export const CANONICAL_ORIGIN = "https://www.chuffedquotes.co.uk";

export const LEGACY_HOSTS = ["tradematequotes.co.uk", "www.tradematequotes.co.uk"];

/**
 * Hostname without a port, lower case.
 * @param {unknown} host
 */
export function bareHost(host) {
  return String(host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

/**
 * Absolute address on the new site, or null when this host should stay put.
 * @param {unknown} host
 * @param {unknown} pathname
 * @param {unknown} [search]
 * @returns {string | null}
 */
export function legacyDomainLocation(host, pathname, search = "") {
  if (!LEGACY_HOSTS.includes(bareHost(host))) return null;
  const path = String(pathname || "/");
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const rawSearch = String(search || "");
  const query = rawSearch ? (rawSearch.startsWith("?") ? rawSearch : `?${rawSearch}`) : "";
  return `${CANONICAL_ORIGIN}${safePath}${query}`;
}

/**
 * Next.js redirects. `permanent: true` is a 308, so browsers and link
 * previews keep the method and the query string.
 * @returns {Array<{ source: string, has: Array<{ type: "host", value: string }>, destination: string, permanent: true }>}
 */
export function legacyRedirects() {
  return LEGACY_HOSTS.flatMap((host) => {
    const has = [{ type: /** @type {"host"} */ ("host"), value: host }];
    return [
      {
        source: "/",
        has,
        destination: CANONICAL_ORIGIN,
        permanent: true,
      },
      {
        source: "/:path*",
        has,
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  });
}
