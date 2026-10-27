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

function sameWords(left, right) {
  const a = wordsOf(left);
  const b = wordsOf(right);
  if (!a.length || a.length !== b.length) return false;
  return [...a].sort().join(" ") === [...b].sort().join(" ");
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

/** Words that describe the job but are not the thing being priced. */
const PRICE_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "with",
  "of",
  "to",
  "on",
  "in",
  "new",
  "old",
  "supply",
  "supplied",
  "install",
  "installation",
  "installed",
  "installing",
  "fitting",
  "fitted",
  "fit",
  "replacement",
  "replace",
  "replacing",
  "including",
  "includes",
  "included",
  "high",
  "higher",
  "efficiency",
  "efficient",
  "horizontal",
  "vertical",
  "complete",
  "full",
]);

function coreWords(description) {
  return wordsOf(description).filter((word) => !PRICE_STOP_WORDS.has(word));
}

function itemKind(item) {
  const type = String(item?.type || item?.itemType || "").toLowerCase();
  if (type === "labor" || type === "labour") return "labor";
  if (type === "service") return "service";
  if (type === "material") return "material";
  return "";
}

function kindsCompatible(line, row) {
  const left = itemKind(line);
  const right = itemKind(row);
  if (!left || !right) return true;
  if (left === right) return true;
  return (left === "material" || left === "service") && (right === "material" || right === "service");
}

function wholeItemUnit(unit) {
  if (unitsMatch(unit, "each") || unitsMatch(unit, "lot")) return true;
  const flat = squashUnit(unit);
  return flat === "pack" || flat === "item" || flat === "service" || flat === "kit" || flat === "set";
}

/** Same unit, or both are a whole item (each, unit, lot, job) so a boiler price can replace a guessed one. */
function unitsCompatible(left, right) {
  if (unitsMatch(left, right)) return true;
  if (!squashUnit(left) || !squashUnit(right)) return true;
  return wholeItemUnit(left) && wholeItemUnit(right);
}

/**
 * A saved price fits a line when its own words appear near the start of that line.
 * "New boiler" fits "Combi boiler". "Flue kit" does not replace the whole boiler line.
 * A material price does not replace a labour line that only mentions the material.
 * @returns {{ shared: number, earliest: number } | null}
 */
function looseOverlap(item, row) {
  if (!kindsCompatible(item, row)) return null;
  if (!unitsCompatible(item.unit, rowUnit(row))) return null;
  const lineWords = coreWords(item.description);
  const savedWords = coreWords(rowName(row));
  if (!lineWords.length || !savedWords.length || lineWords.length > 12) return null;
  const lineSet = new Set(lineWords);
  if (!savedWords.every((word) => lineSet.has(word))) return null;
  const earliest = Math.min(...savedWords.map((word) => lineWords.indexOf(word)));
  if (savedWords.length === 1) {
    if (savedWords[0].length < 5 || earliest > 2) return null;
  } else if (earliest > 2) {
    return null;
  }
  return { shared: savedWords.length, earliest };
}

function exactPriceMatch(item, rows) {
  const canon = canonicalUnit(item.unit);
  const wanted = new Set([
    priceKey(item.description, item.unit),
    canon ? priceKey(item.description, canon) : "",
  ]);
  const named = rows.filter((row) => sameWords(item.description, rowName(row)));
  const byName = named.find((row) => unitsMatch(rowUnit(row), item.unit)) || (named.length === 1 ? named[0] : undefined);
  if (byName) return byName;
  return rows.find((row) => wanted.has(row.key)) || null;
}

function bestLooseMatch(item, rows) {
  let best = null;
  let bestScore = 0;
  for (const row of rows) {
    const overlap = looseOverlap(item, row);
    if (!overlap) continue;
    const score = overlap.shared * 100 - overlap.earliest;
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return best;
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
    const matched = exactPriceMatch(item, rows) || bestLooseMatch(item, rows);
    const match = matched || (isHourlyLabour(item) ? genericHourly : null);
    if (!match || !(Number(match.rate) >= 0)) return { ...item, usualPrice: false };
    const unit = rowUnit(match) || item.unit;
    return {
      ...item,
      rate: Number(match.rate),
      unit: canonicalUnit(unit) || unit,
      usualPrice: true,
      rateSource: "list",
    };
  });
}

/**
 * Labour lines that did not come from the price list use the day rate or hourly rate from Settings.
 * A price-list match already on the line is left as it is.
 * @param {Array<{ type?: string, description?: string, quantity?: number, unit?: string, rate?: number, usualPrice?: boolean, rateSource?: string }>} items
 * @param {{ laborHourlyRate?: number, laborDayRate?: number } | null | undefined} pricingMemory
 */
export function applySettingsLabourRates(items = [], pricingMemory) {
  const memory = pricingMemory && typeof pricingMemory === "object" ? pricingMemory : null;
  const hourly = Number(memory?.laborHourlyRate);
  const daily = Number(memory?.laborDayRate);
  return items.map((item) => {
    if (item.usualPrice) return { ...item, rateSource: item.rateSource || "list" };
    const type = String(item.type || "");
    if (type !== "labor" && type !== "labour") return { ...item, usualPrice: false };
    if (unitsMatch(item.unit, "hr") && hourly > 0) {
      return { ...item, rate: hourly, usualPrice: false, rateSource: "settings" };
    }
    if (unitsMatch(item.unit, "day") && daily > 0) {
      return { ...item, rate: daily, usualPrice: false, rateSource: "settings" };
    }
    return { ...item, usualPrice: false };
  });
}

/** Price-list matches first, then the Settings labour rate on any labour line still using a guess. */
export function applyQuotePrices(items = [], memories = [], pricingMemory) {
  return applySettingsLabourRates(applyRememberedPrices(items, memories), pricingMemory);
}

/**
 * One quote line from a saved price. Quantity starts at 1 so the tradesperson can change it.
 * @param {unknown} row
 */
export function lineFromPriceList(row) {
  const source = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
  const normalized = normalizePriceListItem({
    description: source.description,
    unit: source.unit,
    rate: source.rate,
    itemType: source.itemType,
  });
  if (!normalized.ok) return null;
  return {
    type: normalized.item.itemType,
    description: normalized.item.description,
    quantity: 1,
    unit: normalized.item.unit,
    rate: normalized.item.rate,
    usualPrice: true,
    rateSource: "list",
  };
}

/**
 * The prices sent with a quote build. Long names are shortened so one price cannot reject the whole request.
 * @param {{ laborHourlyRate?: number, laborDayRate?: number, preferredMarkupPercent?: number } | null | undefined} memory
 * @param {unknown} remembered
 */
export function pricingMemoryForQuote(memory, remembered) {
  const source = memory && typeof memory === "object" ? memory : {};
  const hourly = Number(source.laborHourlyRate);
  const daily = Number(source.laborDayRate);
  const markup = Number(source.preferredMarkupPercent);
  const rows = (Array.isArray(remembered) ? remembered : []).slice(0, PRICE_LIST_LIMIT).map((row) => {
    const record = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
    const itemType = record.itemType === "labor" || record.itemType === "service" ? record.itemType : "material";
    const rate = Number(record.rate);
    return {
      key: String(record.key || "").slice(0, 160),
      description: String(record.description || "").slice(0, 200),
      unit: String(record.unit || "each").slice(0, 30),
      rate: Number.isFinite(rate) ? Math.min(PRICE_LIST_MAX_RATE, Math.max(0, rate)) : 0,
      itemType,
    };
  });
  return {
    ...(hourly > 0 ? { laborHourlyRate: hourly } : {}),
    ...(daily > 0 ? { laborDayRate: daily } : {}),
    ...(Number.isFinite(markup) ? { preferredMarkupPercent: Math.min(100, Math.max(0, markup)) } : {}),
    remembered: rows,
  };
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
