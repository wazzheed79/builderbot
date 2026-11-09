/**
 * Optional call-out fee from Settings.
 * It is stored with the day rate in this browser. It is not added to a quote
 * until the tradesperson taps Add call-out fee.
 */

import { roundMoney } from "./quote-rules.mjs";

export const CALL_OUT_DESCRIPTION = "Call-out fee";

/**
 * @param {unknown} memory
 */
export function callOutFeeAmount(memory) {
  const source = memory && typeof memory === "object" ? /** @type {Record<string, unknown>} */ (memory) : {};
  const raw = source.callOutFee;
  const value = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isFinite(value) || value <= 0) return 0;
  return roundMoney(value);
}

/**
 * One labour line for the saved fee. Null when no fee is set.
 * @param {unknown} memory
 * @returns {{ type: "labor", description: string, quantity: number, unit: string, rate: number, rateSource: "settings" } | null}
 */
export function callOutLine(memory) {
  const rate = callOutFeeAmount(memory);
  if (rate <= 0) return null;
  return {
    type: "labor",
    description: CALL_OUT_DESCRIPTION,
    quantity: 1,
    unit: "visit",
    rate,
    rateSource: "settings",
  };
}

/**
 * The Settings call-out line. Other labour, including a repair described as a call-out, is left alone.
 * @param {unknown} item
 */
export function isSettingsCallOutLine(item) {
  const row = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
  const description = String(row.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return description === "call-out fee" || description === "call out fee";
}
