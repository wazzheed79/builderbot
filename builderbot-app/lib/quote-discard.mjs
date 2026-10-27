import { clearWorkingDraft, readWorkingDraft } from "./quote-autosave.mjs";

/**
 * Which saved rows a discard may delete.
 * A quote the customer can already open is left in the list.
 * A draft- autosave row, and a quote still marked Draft, are deleted.
 * @param {{ activeQuoteId?: unknown, activeStatus?: unknown, cloudDraftId?: unknown }} input
 */
export function discardQuotePlan(input = {}) {
  const active = String(input.activeQuoteId || "");
  const status = String(input.activeStatus || "");
  const cloud = String(input.cloudDraftId || "");
  /** @type {string[]} */
  const deleteIds = [];
  if (cloud.startsWith("draft-")) deleteIds.push(cloud);
  if (active && status === "Draft" && !deleteIds.includes(active)) deleteIds.push(active);
  return {
    deleteIds,
    keepsSentQuote: Boolean(active) && status !== "" && status !== "Draft",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} draft
 * @param {unknown} quoteId
 */
export function workingDraftMatchesQuote(draft, quoteId) {
  if (!draft || typeof draft !== "object") return false;
  const id = String(quoteId || "");
  if (!id) return false;
  return String(draft.activeQuoteId || "") === id || String(draft.cloudDraftId || "") === id;
}

/**
 * Deleting a draft from the list must also forget the copy that would be offered back on sign-in.
 * @param {{ getItem: (key: string) => string | null, removeItem: (key: string) => void }} storage
 * @param {unknown} quoteId
 */
export function forgetWorkingDraftIfQuote(storage, quoteId) {
  const draft = readWorkingDraft(storage);
  if (!workingDraftMatchesQuote(draft, quoteId)) return false;
  clearWorkingDraft(storage);
  return true;
}
