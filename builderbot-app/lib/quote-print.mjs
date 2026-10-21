import { recalculateQuoteTotals, roundMoney } from "./quote-rules.mjs";

/** Printable body height on A4 after the page margins in globals.css. */
export const PRINT_PAGE_BODY_MM = 250;
const LINE_BASE_MM = 14;
const WRAP_EXTRA_MM = 5;
const WRAP_WIDTH = 72;

/**
 * British pounds, always two pence digits, with thousands separators.
 * Amounts that are not a real number print as £0.00 so a blank total cannot show £NaN.
 * @param {unknown} amount
 */
export function formatGbp(amount) {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = roundMoney(safe);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(rounded)
    .replace(/\u00a0/g, " ");
}

/**
 * Word-wrap a description. A single long word is split so it cannot run off the page.
 * @param {unknown} text
 * @param {number} [width]
 */
export function descriptionLines(text, width = WRAP_WIDTH) {
  const raw = String(text || "").replace(/\s+/g, " ").trim() || "Item";
  const limit = Math.max(8, width);
  const words = raw.split(" ");
  /** @type {string[]} */
  const lines = [];
  let current = "";
  for (const word of words) {
    if (word.length > limit) {
      if (current) lines.push(current);
      for (let index = 0; index < word.length; index += limit) {
        lines.push(word.slice(index, index + limit));
      }
      current = "";
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length > limit) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : ["Item"];
}

/**
 * @param {string[]} wrapped
 */
export function isLongPrintLine(wrapped) {
  return wrapped.length > 6;
}

/**
 * @param {string[]} wrapped
 */
function lineHeightMm(wrapped) {
  return LINE_BASE_MM + Math.max(0, wrapped.length - 1) * WRAP_EXTRA_MM;
}

/**
 * Only the details the tradesperson actually saved. Never invent a bank or a sort code.
 * @param {{ bankName?: unknown, bankSortCode?: unknown, bankAccountNumber?: unknown } | null | undefined} profile
 */
export function bankInstruction(profile) {
  const accountNumber = String(profile?.bankAccountNumber || "").trim();
  if (!accountNumber) return null;
  const bankName = String(profile?.bankName || "").trim();
  const sortCode = String(profile?.bankSortCode || "").trim();
  return {
    accountNumber,
    bankName: bankName || null,
    sortCode: sortCode || null,
  };
}

/**
 * @param {unknown} item
 * @param {number} index
 */
function printableLine(item, index) {
  const row = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
  const quantity = Number(row.quantity);
  const rate = Number(row.rate);
  const safeQty = Number.isFinite(quantity) ? quantity : 0;
  const safeRate = Number.isFinite(rate) ? rate : 0;
  const description = String(row.description || `Item ${index + 1}`);
  const wrapped = descriptionLines(description);
  const type = String(row.type || "material");
  const label = type === "labor" ? "Labour" : type === "service" ? "Service" : "Material";
  const unit = String(row.unit || "unit").trim() || "unit";
  return {
    key: String(row.id || `line-${index + 1}`),
    description,
    wrapped,
    long: isLongPrintLine(wrapped),
    meta: `${label} · ${safeQty} ${unit} × ${formatGbp(safeRate)}`,
    qtyLabel: String(safeQty),
    unit,
    rateLabel: formatGbp(safeRate),
    lineTotal: formatGbp(roundMoney(safeQty * safeRate)),
    heightMm: lineHeightMm(wrapped),
  };
}

/**
 * @param {ReturnType<typeof printableLine>[]} lines
 */
export function paginatePrintLines(lines) {
  /** @type {typeof lines[]} */
  const pages = [];
  /** @type {typeof lines} */
  let page = [];
  let used = 0;
  for (const line of lines) {
    if (line.long && line.heightMm > PRINT_PAGE_BODY_MM) {
      if (page.length > 0) pages.push(page);
      pages.push([line]);
      page = [];
      used = 0;
      continue;
    }
    if (page.length > 0 && used + line.heightMm > PRINT_PAGE_BODY_MM) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(line);
    used += line.heightMm;
  }
  if (page.length > 0) pages.push(page);
  if (pages.length === 0) pages.push([]);
  return pages;
}

/**
 * @param {{
 *   items?: unknown[],
 *   logoUrl?: unknown,
 *   vatEnabled?: boolean,
 *   depositPercent?: number,
 *   totals?: { subtotal?: unknown, vat?: unknown, total?: unknown, deposit?: unknown }
 * }} input
 */
export function preparePrintableQuote(input) {
  const source = Array.isArray(input?.items) ? input.items : [];
  const lines = source.map((item, index) => printableLine(item, index));
  const pages = paginatePrintLines(lines);
  const calculated = recalculateQuoteTotals(
    source.map((item) => {
      const row = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
      return { quantity: Number(row.quantity) || 0, rate: Number(row.rate) || 0 };
    }),
    Boolean(input?.vatEnabled),
    Number(input?.depositPercent) || 0
  );
  const totals = input?.totals || calculated;
  const logo = String(input?.logoUrl || "").trim();
  return {
    hasLogo: logo.length > 0,
    lines,
    pages,
    pageCount: pages.length,
    subtotal: formatGbp(totals.subtotal ?? calculated.subtotal),
    vat: formatGbp(totals.vat ?? calculated.vat),
    total: formatGbp(totals.total ?? calculated.total),
    deposit: formatGbp(totals.deposit ?? calculated.deposit),
  };
}
