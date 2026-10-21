const LIST_KEYS = ["customers", "quotes", "jobs", "invoices", "templates"];

/**
 * A failed cloud read is null and must not replace the phone's copy.
 * An empty list is a real empty account and may replace it.
 * @param {Record<string, unknown> | null | undefined} data
 */
export function cloudListsToStore(data) {
  /** @type {Record<string, unknown[]>} */
  const stored = {};
  if (!data || typeof data !== "object") return stored;
  for (const key of LIST_KEYS) {
    if (Array.isArray(data[key])) stored[key] = data[key];
  }
  return stored;
}
