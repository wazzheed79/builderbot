/**
 * Match a remembered price to a similar line.
 * Labour by the hour also picks up the latest hourly rate the tradesperson used.
 */

export function priceKey(description = "", unit = "") {
  const words = String(description)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 8)
    .join(" ");
  return `${words}|${String(unit || "").toLowerCase()}`;
}

function sameFamily(left, right) {
  if (!left || !right || left.length < 6 || right.length < 6) return false;
  return left.includes(right) || right.includes(left);
}

/**
 * @param {Array<{ id?: string, type?: string, description: string, quantity: number, unit: string, rate: number }>} items
 * @param {Array<{ key: string, unit?: string, rate: number, itemType?: string }>} memories
 * @returns {Array<{ id?: string, type?: string, description: string, quantity: number, unit: string, rate: number, usualPrice: boolean }>}
 */
export function applyRememberedPrices(items = [], memories = []) {
  const rows = Array.isArray(memories) ? memories : [];
  const hourly = rows.find((row) => row.itemType === "labor" && /hr/i.test(row.unit || ""));

  return items.map((item) => {
    const key = priceKey(item.description, item.unit);
    const words = key.split("|")[0];
    const exact = rows.find((row) => row.key === key);
    const similar =
      exact ||
      rows.find((row) => {
        const other = String(row.key || "").split("|")[0];
        return String(row.unit || "").toLowerCase() === String(item.unit || "").toLowerCase() && sameFamily(words, other);
      });
    const labourHour =
      !similar && (item.type === "labor" || item.type === "labour") && /hr/i.test(item.unit || "")
        ? hourly
        : null;
    const match = similar || labourHour;
    if (!match || !(Number(match.rate) >= 0)) return { ...item, usualPrice: false };
    return { ...item, rate: Number(match.rate), usualPrice: true };
  });
}
