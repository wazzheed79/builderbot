/**
 * UK VAT for quotes and invoices.
 * Line prices are excluding VAT. 20% is added only when the quote charges VAT.
 * A missing flag means the tradesperson is not VAT registered.
 */

import { roundMoney } from "./quote-rules.mjs";

export const VAT_RATE = 0.2;

export const NOT_VAT_REGISTERED_LINE = "Not VAT registered - no VAT charged";

export const VAT_NUMBER_ERROR =
  "Enter a UK VAT number, like GB123456789, or leave it blank.";

/**
 * True only for an explicit yes. Missing, null, and false mean no VAT.
 * @param {unknown} value
 */
export function chargesVat(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

/**
 * A stored quote or invoice. Either camelCase or the database column counts.
 * @param {object | null | undefined} record
 */
export function quoteChargesVat(record) {
  if (!record || typeof record !== "object") return false;
  const row = /** @type {Record<string, unknown>} */ (record);
  return chargesVat(row.vatEnabled) || chargesVat(row.vat_enabled);
}

/**
 * Loose UK VAT number. Blank is allowed.
 * Accepts GB and 9 digits, or the 9 digits alone. Spaces and hyphens are ignored.
 * A valid number is stored as GB followed by those digits.
 * @param {unknown} input
 * @returns {{ ok: true, vatNumber: string } | { ok: false, error: string }}
 */
export function parseUkVatNumber(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: true, vatNumber: "" };
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const digits = compact.startsWith("GB") ? compact.slice(2) : compact;
  if (/^\d{9}$/.test(digits)) return { ok: true, vatNumber: `GB${digits}` };
  return { ok: false, error: VAT_NUMBER_ERROR };
}

/**
 * @param {unknown} input
 * @returns {string}
 */
export function vatRegLine(input) {
  const parsed = parseUkVatNumber(input);
  if (!parsed.ok || !parsed.vatNumber) return "";
  return `VAT reg no: ${parsed.vatNumber}`;
}

/**
 * Words for the totals box. Prices stay excluding VAT; this only labels them.
 * When the business is registered but this document does not charge VAT, the
 * line does not claim they are unregistered.
 * @param {{ vatEnabled?: unknown, vatNumber?: unknown, businessRegistered?: unknown }} [input]
 */
export function vatPresentation(input = {}) {
  const charges = chargesVat(input.vatEnabled);
  if (charges) {
    return {
      charges: true,
      subtotalLabel: "Subtotal (ex VAT)",
      vatLabel: "VAT (20%)",
      totalLabel: "Total inc VAT",
      notice: "",
      regLine: vatRegLine(input.vatNumber),
      pricesNote: "Prices are excluding VAT.",
    };
  }
  return {
    charges: false,
    subtotalLabel: "Total",
    vatLabel: "",
    totalLabel: "Total",
    notice: chargesVat(input.businessRegistered) ? "No VAT charged." : NOT_VAT_REGISTERED_LINE,
    regLine: "",
    pricesNote: "",
  };
}

/**
 * Short label under a Standard, Better, or Premium price.
 * @param {unknown} vatEnabled
 */
export function tierPriceCaption(vatEnabled) {
  return chargesVat(vatEnabled) ? "inc VAT" : "";
}

/**
 * 20% of a net amount, rounded to pennies. The net itself should already be in pennies.
 * @param {number} net
 */
export function vatOnNet(net) {
  return roundMoney(roundMoney(net) * VAT_RATE);
}
