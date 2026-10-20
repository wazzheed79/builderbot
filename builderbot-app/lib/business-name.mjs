/** Shown when a quote cannot be sent until Settings has a real business name. */
export const BUSINESS_NAME_PROMPT =
  "Add your business name in Settings before sending your first quote";

/** Neutral label when a quote must show a sender and none has been set. */
export const GENERIC_TRADESPERSON = "Your tradesperson";

const PLACEHOLDER_COMPANIES = ["trade contractor services"];

/**
 * @param {unknown} value
 */
export function cleanBusinessText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * True when Settings has a real business name, not a blank or a made-up placeholder.
 * @param {unknown} companyName
 */
export function hasBusinessName(companyName) {
  const company = cleanBusinessText(companyName).toLowerCase();
  if (!company) return false;
  return !PLACEHOLDER_COMPANIES.includes(company);
}

/**
 * Name to print on a quote. Prefers the business name, then the tradesperson's own name.
 * @param {unknown} companyName
 * @param {unknown} ownerName
 */
export function displayBusinessName(companyName, ownerName) {
  if (hasBusinessName(companyName)) return cleanBusinessText(companyName);
  const owner = cleanBusinessText(ownerName);
  if (owner) return owner;
  return GENERIC_TRADESPERSON;
}
