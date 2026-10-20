/** View labels and reminder timing. Shared by the app and the tests. */

export const DEFAULT_REMINDER_DAYS = 3;

/**
 * @param {{ viewCount?: number, status?: string }} quote
 */
export function viewLabel(quote) {
  const count = Number(quote?.viewCount) || 0;
  if (count > 1) return `Viewed ${count} times`;
  if (count === 1 || quote?.status === "Viewed") return "Viewed";
  return "Not opened yet";
}

/**
 * A sent quote that is still waiting after the reminder window.
 * @param {{ status?: string, sentAt?: string, createdAt?: string, reminderAfterDays?: number }} quote
 * @param {Date} [now]
 */
export function reminderDue(quote, now = new Date()) {
  if (!quote || (quote.status !== "Sent" && quote.status !== "Viewed")) return false;
  const days = Number(quote.reminderAfterDays) > 0 ? Number(quote.reminderAfterDays) : DEFAULT_REMINDER_DAYS;
  const start = new Date(quote.sentAt || quote.createdAt || "").getTime();
  if (Number.isNaN(start)) return false;
  return now.getTime() - start >= days * 24 * 60 * 60 * 1000;
}
