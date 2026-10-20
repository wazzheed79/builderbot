/**
 * A customer link token. Sequential ids such as BB-1042 are not public links.
 * @param {string} token
 */
export function isPublicQuoteToken(token) {
  return typeof token === "string" && token.startsWith("q_") && token.length >= 16;
}

/**
 * Path of the picture WhatsApp should use for this quote.
 * @param {string} token
 */
export function quoteCardImagePath(token) {
  return `/q/${encodeURIComponent(token)}/opengraph-image`;
}
