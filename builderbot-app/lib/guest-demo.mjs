// A try-it quote for someone who has not created an account.
// It is kept in this browser only. Nothing here writes a quote, a public
// link, or an email. The daily cap is applied by the existing rate-limit
// helper, which stores a hash of the address, not the address itself.
// If that database check fails, the same daily cap is applied in this
// server's memory instead of allowing the request through.
import { safeNextPath } from "./auth-callback.mjs";
import {
  MAX_LINE_ITEMS,
  MAX_SCOPE,
  MAX_TITLE,
  clampDepositPercent,
  repairLineItem,
} from "./quote-ai.mjs";
import { buildChoiceOptions } from "./quote-options.mjs";

export const GUEST_DEMO_STORAGE_KEY = "chuffed_guest_demo_v1";
export const GUEST_PLACEHOLDER_BUSINESS = "Your Business Name";
export const GUEST_DAILY_LIMIT = 5;
export const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;
export const GUEST_NOTES_MIN = 3;
export const GUEST_NOTES_MAX = 800;
export const GUEST_DEMO_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_STORED_CHARS = 100_000;
const MAX_NOTICE = 280;

export const GUEST_EXAMPLES = [
  {
    id: "decorating",
    label: "Decorating",
    notes:
      "Two bedrooms need painting. Walls and ceilings in white emulsion, woodwork in white satin. About two days on site. The customer is supplying the paint.",
  },
  {
    id: "plumbing",
    label: "Plumbing",
    notes:
      "Kitchen mixer tap is leaking and the sink waste is slow. Replace the tap, renew the trap, and check the isolation valves. About half a day.",
  },
  {
    id: "electrics",
    label: "Electrics",
    notes:
      "Replace six ceiling lights with LED downlights and add one double socket in the living room. About a day. The consumer unit stays as it is.",
  },
];

/**
 * @param {unknown} value
 * @param {number} max
 */
function clipText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

/**
 * The rate-limit name for one phone or network. The address is hashed before
 * it is stored, by the shared rate-limit helper.
 * @param {unknown} ip
 */
export function guestDemoRateId(ip) {
  const address = clipText(ip, 64) || "unknown";
  return `guest-demo:${address}`;
}

/**
 * @param {unknown} notes
 * @returns {{ ok: true, notes: string } | { ok: false, error: string }}
 */
export function validateGuestNotes(notes) {
  const text = clipText(notes, GUEST_NOTES_MAX + 1);
  if (text.length < GUEST_NOTES_MIN) {
    return { ok: false, error: "Type a few words about the job." };
  }
  if (text.length > GUEST_NOTES_MAX) {
    return {
      ok: false,
      error: `Keep the notes under ${GUEST_NOTES_MAX} characters.`,
    };
  }
  return { ok: true, notes: text };
}

/**
 * The only fields a guest is allowed to see. No bank details, no customer
 * link, and no account id.
 * @param {{
 *   title?: unknown,
 *   scopeOfWork?: unknown,
 *   suggestedDepositPercent?: unknown,
 *   items?: unknown,
 *   aiPowered?: unknown,
 *   notice?: unknown
 * }} input
 */
export function guestQuotePayload(input) {
  const rawItems = Array.isArray(input?.items) ? input.items.slice(0, MAX_LINE_ITEMS) : [];
  const items = [];
  for (const raw of rawItems) {
    const item = repairLineItem(raw, items.length);
    if (item) items.push(item);
  }
  const suggestedDepositPercent = clampDepositPercent(input?.suggestedDepositPercent);
  const options = items.length > 0 ? buildChoiceOptions(items, true, suggestedDepositPercent) : [];
  const title = clipText(input?.title, MAX_TITLE) || "Trade works";
  const scopeOfWork = clipText(input?.scopeOfWork, MAX_SCOPE) || title;
  const aiPowered = input?.aiPowered === true;
  return {
    title,
    scopeOfWork,
    suggestedDepositPercent,
    items: options[0]?.items || items,
    options,
    aiPowered,
    estimateOnly: !aiPowered,
    notice: clipText(input?.notice, MAX_NOTICE),
    businessName: GUEST_PLACEHOLDER_BUSINESS,
    previewOnly: true,
  };
}

/**
 * @param {unknown} parsed
 * @param {number} nowMs
 */
function normalizeGuestDemo(parsed, nowMs) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const row = /** @type {Record<string, unknown>} */ (parsed);
  if (row.v !== 1) return null;
  const savedAt = Date.parse(String(row.savedAt || ""));
  if (!Number.isFinite(savedAt) || savedAt > nowMs + 60_000) return null;
  if (nowMs - savedAt > GUEST_DEMO_MAX_AGE_MS) return null;
  const payload = guestQuotePayload({
    title: row.title,
    scopeOfWork: row.scopeOfWork,
    suggestedDepositPercent: row.suggestedDepositPercent,
    items: row.items,
    aiPowered: row.aiPowered === true,
    notice: row.notice,
  });
  if (!Array.isArray(payload.items) || payload.items.length === 0) return null;
  if (!Array.isArray(payload.options) || payload.options.length < 2) return null;
  return {
    ...payload,
    savedAt: new Date(savedAt).toISOString(),
    estimateOnly: row.estimateOnly === true || payload.estimateOnly,
    aiPowered: row.aiPowered === true && row.estimateOnly !== true,
  };
}

/**
 * @param {{ getItem: (key: string) => string | null, removeItem?: (key: string) => void }} storage
 * @param {number} [nowMs]
 */
export function readGuestDemoQuote(storage, nowMs = Date.now()) {
  if (!storage || typeof storage.getItem !== "function") return null;
  let parsed = null;
  try {
    const raw = storage.getItem(GUEST_DEMO_STORAGE_KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const record = normalizeGuestDemo(parsed, nowMs);
  if (!record && typeof storage.removeItem === "function") {
    try {
      storage.removeItem(GUEST_DEMO_STORAGE_KEY);
    } catch {
      // A private browser can refuse storage. The quote is simply not restored.
    }
  }
  return record;
}

/**
 * @param {{ setItem: (key: string, value: string) => void }} storage
 * @param {Parameters<typeof guestQuotePayload>[0]} payload
 * @param {string} nowIso
 */
export function writeGuestDemoQuote(storage, payload, nowIso) {
  if (!storage || typeof storage.setItem !== "function") return false;
  const safe = guestQuotePayload(payload);
  if (!safe.items.length) return false;
  const record = {
    v: 1,
    savedAt: nowIso,
    title: safe.title,
    scopeOfWork: safe.scopeOfWork,
    suggestedDepositPercent: safe.suggestedDepositPercent,
    items: safe.items,
    aiPowered: safe.aiPowered,
    estimateOnly: safe.estimateOnly,
    notice: safe.notice,
  };
  const text = JSON.stringify(record);
  if (text.length > MAX_STORED_CHARS) return false;
  storage.setItem(GUEST_DEMO_STORAGE_KEY, text);
  return true;
}

/**
 * @param {{ removeItem: (key: string) => void } | null | undefined} storage
 */
export function clearGuestDemoQuote(storage) {
  if (!storage || typeof storage.removeItem !== "function") return;
  storage.removeItem(GUEST_DEMO_STORAGE_KEY);
}

/**
 * Fields the quote builder already understands. No customer, no public id.
 * @param {NonNullable<ReturnType<typeof readGuestDemoQuote>>} record
 */
export function guestDemoToBuilderFields(record) {
  const options = Array.isArray(record?.options) ? record.options : [];
  return {
    quoteTitle: String(record?.title || ""),
    notesInput: String(record?.scopeOfWork || ""),
    items: options[0]?.items || record?.items || [],
    choiceOptions: options.length > 1 ? options : null,
    choiceIndex: 0,
    vatEnabled: true,
    depositPercent: clampDepositPercent(record?.suggestedDepositPercent),
    aiPowered: record?.aiPowered === true,
    estimateOnly: record?.estimateOnly === true || record?.aiPowered !== true,
  };
}

/**
 * A blank builder can take the try-it quote. A quote already on screen,
 * or a named customer, is left alone.
 * @param {{ items?: unknown, activeQuoteId?: unknown, clientName?: unknown } | null | undefined} state
 */
export function builderCanTakeGuestDemo(state) {
  const items = Array.isArray(state?.items) ? state.items : [];
  if (items.length > 0) return false;
  if (String(state?.activeQuoteId || "").trim()) return false;
  if (String(state?.clientName || "").trim()) return false;
  return true;
}

/**
 * After sign-in, open the quote builder when a try-it quote is waiting.
 * An explicit destination other than the dashboard is kept.
 * @param {string | null | undefined} requested
 * @param {{ getItem: (key: string) => string | null, removeItem?: (key: string) => void } | null | undefined} storage
 */
export function pathAfterAuth(requested, storage) {
  const next = safeNextPath(requested);
  const explicit = String(requested || "").trim();
  if (explicit && next !== "/dashboard") return next;
  if (readGuestDemoQuote(storage)) return "/quotes";
  return next;
}
