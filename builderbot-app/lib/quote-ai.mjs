// Checks a Gemini quote or scope before it is shown. Bad fields are repaired
// where that is safe. A response that is not a usable quote is rejected so the
// route can keep the rough estimate instead of saving a broken quote.
import { z } from "zod";
import { roundMoney } from "./quote-rules.mjs";

export const MAX_LINE_ITEMS = 50;
export const MAX_DESCRIPTION = 200;
export const MAX_UNIT = 30;
export const MAX_TITLE = 150;
export const MAX_SCOPE = 2500;
export const MAX_EXPAND_SCOPE = 3000;
export const MIN_QUANTITY = 0.01;
export const MAX_QUANTITY = 10000;
export const MIN_RATE = 0;
export const MAX_RATE = 50000;

const GeneratedQuoteSchema = z.object({
  title: z.unknown().optional(),
  scopeOfWork: z.unknown().optional(),
  suggestedDepositPercent: z.unknown().optional(),
  items: z.array(z.unknown()).max(MAX_LINE_ITEMS),
});

const ExpandedScopeSchema = z.object({
  title: z.unknown().optional(),
  scopeOfWork: z.unknown().optional(),
});

/**
 * @param {unknown} value
 * @param {number} max
 */
function clipText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

/**
 * @param {unknown} value
 */
function itemType(value) {
  const raw = String(value || "material").toLowerCase();
  if (raw === "labor" || raw === "labour") return "labor";
  if (raw === "service") return "service";
  return "material";
}

/**
 * Same clamps the quote route already used: quantity 0.01–10,000, rate £0–£50,000.
 * A missing or zero quantity becomes 1. A missing rate becomes £0.
 * @param {unknown} raw
 * @param {number} index
 */
export function repairLineItem(raw, index) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = /** @type {Record<string, unknown>} */ (raw);
  const parsedQty = Number(row.quantity);
  const rawQty = parsedQty || 1;
  const quantity = Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, roundMoney(rawQty)));
  const parsedRate = Number(row.rate);
  const rawRate = parsedRate || 0;
  const rate = Math.max(MIN_RATE, Math.min(MAX_RATE, roundMoney(rawRate)));
  const description =
    clipText(row.description, MAX_DESCRIPTION) || `Trade item #${index + 1}`;
  const unit = clipText(row.unit, MAX_UNIT) || "unit";
  return {
    type: itemType(row.type),
    description,
    quantity,
    unit,
    rate,
  };
}

/**
 * @param {unknown} value
 */
export function clampDepositPercent(value) {
  const parsed = Number(value);
  const deposit = parsed || 20;
  return Math.max(0, Math.min(100, deposit));
}

/**
 * @param {unknown} parsed
 * @param {{ notes?: string, title?: string }} [fallback]
 * @returns {{ ok: true, title: string, scopeOfWork: string, suggestedDepositPercent: number, items: Array<{ type: "labor" | "material" | "service", description: string, quantity: number, unit: string, rate: number }> } | { ok: false, reason: string }}
 */
export function sanitizeGeneratedQuote(parsed, fallback = {}) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "malformed" };
  }
  const record = /** @type {Record<string, unknown>} */ (parsed);
  if (!Array.isArray(record.items)) {
    return { ok: false, reason: "missing-items" };
  }

  const checked = GeneratedQuoteSchema.safeParse({
    title: record.title,
    scopeOfWork: record.scopeOfWork,
    suggestedDepositPercent: record.suggestedDepositPercent,
    items: record.items.slice(0, MAX_LINE_ITEMS),
  });
  if (!checked.success) return { ok: false, reason: "malformed" };

  const items = [];
  for (const raw of checked.data.items) {
    const item = repairLineItem(raw, items.length);
    if (item) items.push(item);
  }
  if (items.length === 0) return { ok: false, reason: "no-items" };

  const fallbackTitle = clipText(fallback.title, MAX_TITLE);
  const fallbackScope = clipText(fallback.notes, MAX_SCOPE);
  const title = clipText(checked.data.title, MAX_TITLE) || fallbackTitle || "Trade Works Specification";
  const scopeOfWork = clipText(checked.data.scopeOfWork, MAX_SCOPE) || fallbackScope || title;

  return {
    ok: true,
    title,
    scopeOfWork,
    suggestedDepositPercent: clampDepositPercent(checked.data.suggestedDepositPercent),
    items,
  };
}

/**
 * @param {unknown} parsed
 * @param {{ notes?: string, title?: string }} [fallback]
 * @returns {{ ok: true, title: string, scopeOfWork: string } | { ok: false, reason: string }}
 */
export function sanitizeExpandedScope(parsed, fallback = {}) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "malformed" };
  }
  const record = /** @type {Record<string, unknown>} */ (parsed);
  const checked = ExpandedScopeSchema.safeParse({
    title: record.title,
    scopeOfWork: record.scopeOfWork,
  });
  if (!checked.success) return { ok: false, reason: "malformed" };

  const scopeOfWork = clipText(checked.data.scopeOfWork, MAX_EXPAND_SCOPE);
  if (!scopeOfWork) return { ok: false, reason: "missing-scope" };

  const title =
    clipText(checked.data.title, MAX_TITLE) ||
    clipText(fallback.title, MAX_TITLE) ||
    "Trade Works Specification";
  return { ok: true, title, scopeOfWork };
}
