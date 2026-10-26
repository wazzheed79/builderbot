/**
 * Prices the tradesperson has saved, and prices typed on an earlier quote.
 * Both live in the same list. A later quote uses the rate and fills the quantity.
 */

export const PRICE_LIST_LIMIT = 80;
export const PROMPT_PRICE_LIMIT = 40;
export const PRICE_LIST_MAX_RATE = 50000;

export const OWN_PRICES_LINE =
  "Set your day rate and prices once, and every quote uses them. The AI just does the quantities and the paperwork.";

export const TRY_PRICES_NOTE =
  "This try-out does not save a price list, and it uses example prices until you sign in.";

/** Short units stored on a quote, with the words shown on the price list. */
export const PRICE_UNITS = [
  { id: "each", label: "each", aliases: ["each", "unit", "item", "no", "nr"] },
  { id: "m", label: "per metre", aliases: ["m", "metre", "metres", "meter", "meters", "lm", "per metre", "per meter", "per m"] },
  { id: "m2", label: "per m²", aliases: ["m2", "m²", "sqm", "sq m", "square metre", "square metres", "per m2", "per m²"] },
  { id: "hr", label: "per hour", aliases: ["hr", "hrs", "hour", "hours", "per hour", "per hr"] },
  { id: "day", label: "per day", aliases: ["day", "days", "per day"] },
  { id: "bag", label: "per bag", aliases: ["bag", "bags", "per bag"] },
  { id: "lot", label: "per job", aliases: ["lot", "job", "jobs", "per job"] },
];

function squashUnit(unit) {
  return String(unit || "")
    .toLowerCase()
    .replace(/²/g, "2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * @param {unknown} unit
 * @returns {string}
 */
export function canonicalUnit(unit) {
  const flat = squashUnit(unit);
  if (!flat) return "";
  for (const option of PRICE_UNITS) {
    if (option.aliases.some((alias) => squashUnit(alias) === flat)) return option.id;
  }
  return "";
}

/**
 * @param {unknown} unit
 */
export function unitLabel(unit) {
  const canon = canonicalUnit(unit);
  const known = PRICE_UNITS.find((option) => option.id === canon);
  if (known) return known.label;
  const raw = String(unit || "").trim();
  return raw || "each";
}

/**
 * @param {unknown} left
 * @param {unknown} right
 */
export function unitsMatch(left, right) {
  const a = canonicalUnit(left);
  const b = canonicalUnit(right);
  if (a && b) return a === b;
  const rawLeft = squashUnit(left);
  return rawLeft !== "" && rawLeft === squashUnit(right);
}

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

/**
 * @param {unknown} description
 * @returns {string[]}
 */
function wordsOf(description) {
  return String(description || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function sameFamily(left, right) {
  if (!left || !right || left.length < 6 || right.length < 6) return false;
  return left.includes(right) || right.includes(left);
}

function sameWords(left, right) {
  const a = wordsOf(left);
  const b = wordsOf(right);
  if (!a.length || a.length !== b.length) return false;
  return [...a].sort().join(" ") === [...b].sort().join(" ");
}

function descriptionsMatch(left, right) {
  const a = wordsOf(left);
  const b = wordsOf(right);
  if (a.length < 2 || b.length < 2) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const pool = new Set(longer);
  return shorter.every((word) => pool.has(word));
}

function rowName(row) {
  if (row && row.description) return String(row.description);
  return String(row?.key || "").split("|")[0];
}

function rowUnit(row) {
  if (row && row.unit) return String(row.unit);
  return String(row?.key || "").split("|")[1] || "";
}

function isGenericLabourName(description) {
  const words = wordsOf(description).join(" ");
  return (
    words === "labour" ||
    words === "labor" ||
    words === "hourly rate" ||
    words === "day rate" ||
    words === "trade labour" ||
    words === "trade labor" ||
    words === "skilled labour" ||
    words === "skilled labor"
  );
}

function isHourlyLabour(item) {
  const type = String(item?.type || "");
  return (type === "labor" || type === "labour") && unitsMatch(item?.unit, "hr");
}

/**
 * @param {Array<{ id?: string, type?: string, description: string, quantity: number, unit: string, rate: number }>} items
 * @param {Array<{ key: string, description?: string, unit?: string, rate: number, itemType?: string }>} memories
 * @returns {Array<{ id?: string, type?: string, description: string, quantity: number, unit: string, rate: number, usualPrice: boolean }>}
 */
export function applyRememberedPrices(items = [], memories = []) {
  const rows = Array.isArray(memories) ? memories : [];
  const genericHourly = rows.find((row) => unitsMatch(rowUnit(row), "hr") && isGenericLabourName(rowName(row)));

  return items.map((item) => {
    const canon = canonicalUnit(item.unit);
    const wanted = new Set([
      priceKey(item.description, item.unit),
      canon ? priceKey(item.description, canon) : "",
    ]);
    const named = rows.filter((row) => sameWords(item.description, rowName(row)));
    const byName = named.find((row) => unitsMatch(rowUnit(row), item.unit)) || (named.length === 1 ? named[0] : undefined);
    const exact = byName || rows.find((row) => wanted.has(row.key));
    const similar =
      exact ||
      rows.find((row) => {
        if (!unitsMatch(rowUnit(row), item.unit)) return false;
        const other = wordsOf(rowName(row)).join(" ");
        const words = wordsOf(item.description).join(" ");
        return descriptionsMatch(item.description, rowName(row)) || sameFamily(words, other);
      });
    const labourHour = !similar && isHourlyLabour(item) ? genericHourly : null;
    const match = similar || labourHour;
    if (!match || !(Number(match.rate) >= 0)) return { ...item, usualPrice: false };
    const unit = rowUnit(match) || item.unit;
    return { ...item, rate: Number(match.rate), unit: canonicalUnit(unit) || unit, usualPrice: true };
  });
}

/**
 * Text added to the AI quote request. Empty when the tradesperson has no saved prices.
 * The newest rows should come first. Only the first 40 are named. Matching still uses the full list.
 * @param {Array<{ key?: string, description?: string, unit?: string, rate?: number }> | null | undefined} rows
 */
export function rememberedPricesPrompt(rows) {
  const list = (Array.isArray(rows) ? rows : [])
    .filter((row) => row && String(row.description || row.key || "").trim() && Number(row.rate) >= 0)
    .slice(0, PROMPT_PRICE_LIMIT);
  if (!list.length) return "";
  const lines = list.map((row) => {
    const name = String(row.description || row.key || "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    const amount = Number(row.rate).toFixed(2);
    return `- ${name}: £${amount} ${unitLabel(row.unit)}`;
  });
  return [
    "The tradesperson's own prices. When a line is the same sort of work, use that price and unit.",
    "You choose the quantities. Do not replace these prices with a typical market rate.",
    "For work that is not in this list, use a realistic UK rate. The tradesperson checks every line.",
    ...lines,
  ].join("\n");
}

/**
 * @param {unknown} input
 * @returns {{ ok: true, item: { key: string, description: string, unit: string, rate: number, itemType: "labor" | "material" | "service" } } | { ok: false, error: string }}
 */
export function normalizePriceListItem(input) {
  const source = input && typeof input === "object" ? /** @type {Record<string, unknown>} */ (input) : {};
  const description = String(source.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  if (description.length < 2) return { ok: false, error: "Type the item name." };
  const rawUnit = String(source.unit || "").trim().slice(0, 30);
  const known = canonicalUnit(rawUnit);
  const unit = known || rawUnit;
  if (!unit || (!known && !/[a-z]/i.test(unit))) {
    return { ok: false, error: "Choose a unit, such as each, per metre, or per hour." };
  }
  const rateValue = typeof source.rate === "number" ? source.rate : Number(String(source.rate ?? "").trim());
  if (!Number.isFinite(rateValue) || rateValue < 0 || rateValue > PRICE_LIST_MAX_RATE) {
    return { ok: false, error: "Enter a price in pounds, from £0 up to £50,000." };
  }
  const key = priceKey(description, unit);
  if (!key.split("|")[0]) return { ok: false, error: "Use a name with letters, not only numbers." };
  const canon = canonicalUnit(unit);
  /** @type {"labor" | "material" | "service"} */
  let itemType = "material";
  if (canon === "hr" || canon === "day") itemType = "labor";
  else if (source.itemType === "service") itemType = "service";
  else if (source.itemType === "labor") itemType = "labor";
  return {
    ok: true,
    item: {
      key,
      description,
      unit: canon || unit,
      rate: Math.round(rateValue * 100) / 100,
      itemType,
    },
  };
}

/**
 * @param {unknown} rows
 * @returns {Array<{ key: string, description: string, unit: string, rate: number, itemType: "labor" | "material" | "service" }>}
 */
function cleanRows(rows) {
  if (!Array.isArray(rows)) return [];
  const cleaned = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const key = String(row.key || "");
    if (!key) continue;
    const itemType = row.itemType === "labor" || row.itemType === "service" ? row.itemType : "material";
    cleaned.push({
      key,
      description: String(row.description || ""),
      unit: String(row.unit || ""),
      rate: Number(row.rate) || 0,
      itemType,
    });
  }
  return cleaned;
}

/**
 * Add or update one price. Renaming removes the previous key.
 * @param {unknown} rows
 * @param {unknown} input
 * @param {string} [editingKey]
 */
export function planPriceListUpsert(rows, input, editingKey = "") {
  const list = cleanRows(rows);
  const normalized = normalizePriceListItem(input);
  if (!normalized.ok) return normalized;
  const item = normalized.item;
  const previousKey = editingKey && editingKey !== item.key ? String(editingKey) : "";
  const kept = list.filter((row) => row.key !== item.key && row.key !== previousKey);
  if (kept.length + 1 > PRICE_LIST_LIMIT) {
    return { ok: false, error: "You can save 80 prices. Delete one before adding another." };
  }
  return {
    ok: true,
    item,
    next: [item, ...kept],
    deleteKeys: previousKey ? [previousKey] : [],
  };
}

/**
 * @param {unknown} rows
 * @param {unknown} key
 */
export function planPriceListDelete(rows, key) {
  const list = cleanRows(rows);
  const id = String(key || "");
  if (!id || !list.some((row) => row.key === id)) {
    return { ok: false, error: "That price is not on your list." };
  }
  return { ok: true, next: list.filter((row) => row.key !== id), deleteKeys: [id] };
}
