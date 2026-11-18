/**
 * Random id for a record that is saved online. The database key is shared by
 * every account, so a time-based id could clash between two tradespeople.
 * The prefix is kept so ids still read as cust-…, job-…, tpl_….
 * @param {string} prefix e.g. "cust-", "job-", "tpl_"
 * @returns {string}
 */
export function newRecordId(prefix) {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return `${prefix}${c.randomUUID()}`;
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    return `${prefix}${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }
  // Very old browsers only. Still far less likely to clash than the time alone.
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}
