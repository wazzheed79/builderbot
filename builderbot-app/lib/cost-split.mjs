/**
 * Materials, labour, and services totals for a quote or invoice.
 * Line prices are excluding VAT. These rows sit above the existing VAT block.
 * A £0 row is left off. Services/Other appears only when that kind of line has a price.
 * The rows are adjusted by at most a penny so they still add up to the net subtotal.
 */

import { roundMoney } from "./quote-rules.mjs";

/**
 * @param {unknown} type
 * @returns {"material" | "labor" | "other"}
 */
export function lineCostKind(type) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "labor" || value === "labour") return "labor";
  if (value === "service" || value === "other") return "other";
  return "material";
}

/**
 * @param {unknown} item
 */
function lineNet(item) {
  const row = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
  const quantity = Number(row.quantity);
  const rate = Number(row.rate);
  const safeQty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  const safeRate = Number.isFinite(rate) ? Math.max(0, rate) : 0;
  return safeQty * safeRate;
}

/**
 * @param {unknown} items
 * @param {unknown} [expectedSubtotal] The net already shown on the paperwork. Used when it is the same figure, so a penny of rounding does not break the sum.
 */
export function splitCostTotals(items, expectedSubtotal) {
  const list = Array.isArray(items) ? items : [];
  const raw = { material: 0, labor: 0, other: 0 };
  for (const item of list) {
    const row = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
    raw[lineCostKind(row.type)] += lineNet(item);
  }

  const computed = roundMoney(raw.material + raw.labor + raw.other);
  const expected = Number(expectedSubtotal);
  const target =
    Number.isFinite(expected) && Math.abs(roundMoney(expected) - computed) <= 0.02
      ? roundMoney(expected)
      : computed;

  const amounts = {
    material: roundMoney(raw.material),
    labor: roundMoney(raw.labor),
    other: roundMoney(raw.other),
  };
  let drift = roundMoney(target - (amounts.material + amounts.labor + amounts.other));
  if (drift !== 0 && computed !== 0) {
    const ranked = [
      { key: "labor", amount: raw.labor },
      { key: "material", amount: raw.material },
      { key: "other", amount: raw.other },
    ].sort((a, b) => b.amount - a.amount);
    for (const entry of ranked) {
      const next = roundMoney(amounts[entry.key] + drift);
      if (next < 0) continue;
      amounts[entry.key] = next;
      break;
    }
  }

  const rows = [
    { key: "material", label: "Materials", amount: amounts.material },
    { key: "labor", label: "Labour", amount: amounts.labor },
    { key: "other", label: "Services/Other", amount: amounts.other },
  ].filter((row) => row.amount !== 0);

  return {
    material: amounts.material,
    labor: amounts.labor,
    other: amounts.other,
    subtotal: roundMoney(amounts.material + amounts.labor + amounts.other),
    rows,
  };
}

/**
 * Lines that belong to the total already stored on the quote.
 * A chosen Standard, Better, or Premium price is used when it is the total on the quote.
 * @param {unknown} quote
 */
export function linesForQuoteTotal(quote) {
  const row = quote && typeof quote === "object" ? /** @type {Record<string, unknown>} */ (quote) : {};
  const items = Array.isArray(row.items) ? row.items : [];
  const options = Array.isArray(row.options) ? row.options : [];
  const selected = options.find((option) => {
    if (!option || typeof option !== "object") return false;
    return /** @type {Record<string, unknown>} */ (option).id === row.selectedOptionId;
  });
  if (!selected || typeof selected !== "object") return items;
  const chosen = /** @type {Record<string, unknown>} */ (selected);
  const chosenItems = Array.isArray(chosen.items) ? chosen.items : [];
  if (chosenItems.length === 0) return items;
  const chosenTotal = Number(chosen.total);
  const quoteTotal = Number(row.total);
  if (!Number.isFinite(quoteTotal) || !Number.isFinite(chosenTotal) || chosenTotal === quoteTotal) {
    return chosenItems;
  }
  return items;
}
