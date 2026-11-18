/**
 * UK business dates. Quotes, invoices, and customers are dated by the
 * calendar in London, not by UTC. Between midnight and 1am in British Summer
 * Time, the UTC date is still yesterday.
 */

const LONDON = "Europe/London";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The London calendar date of a moment, as YYYY-MM-DD.
 * A plain YYYY-MM-DD string is already a calendar date and is returned as it is.
 * @param {Date | string | number} value
 * @returns {string} Empty when the value is not a usable date.
 */
export function londonDateOf(value) {
  if (typeof value === "string" && DATE_ONLY.test(value.trim())) return value.trim();
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "1970";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

/**
 * Today's date in London, as YYYY-MM-DD.
 * @param {Date} [now]
 * @returns {string}
 */
export function todayInLondon(now = new Date()) {
  return londonDateOf(now);
}

/**
 * A date written for people, like "1 Jul 2026", using the London calendar.
 * @param {Date} date
 */
export function formatLondonDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: LONDON,
  });
}
