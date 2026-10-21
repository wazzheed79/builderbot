import { generateToken, recalculateQuoteTotals } from "./quote-rules.mjs";

/** Separate from the saved-quote list, so a refresh cannot wipe a half-written quote. */
export const WORKING_DRAFT_KEY = "chuffed_quote_working_draft_v1";

const MAX_CHARS = 3_500_000;
const MAX_PHOTO_CHARS = 180_000;
const MAX_PHOTOS = 4;
const MAX_ITEMS = 120;

/**
 * @param {unknown} draft
 */
export function snapshotHasWork(draft) {
  if (!draft || typeof draft !== "object") return false;
  const row = /** @type {Record<string, unknown>} */ (draft);
  const notes = String(row.notesInput || "").trim();
  const title = String(row.quoteTitle || "").trim();
  const client = String(row.clientName || "").trim();
  const items = Array.isArray(row.items) ? row.items : [];
  const photos = Array.isArray(row.photos) ? row.photos : [];
  return Boolean(notes || title || client || items.length || photos.length);
}

/**
 * @param {Record<string, unknown>} draft
 * @param {string} nowIso
 */
export function trimWorkingDraft(draft, nowIso) {
  const rawPhotos = Array.isArray(draft.photos) ? draft.photos : [];
  const photos = rawPhotos
    .filter((photo) => typeof photo === "string" && photo.length > 0 && photo.length <= MAX_PHOTO_CHARS)
    .slice(0, MAX_PHOTOS);
  const next = {
    savedAt: nowIso,
    clientName: String(draft.clientName || "").slice(0, 200),
    clientCompany: String(draft.clientCompany || "").slice(0, 200),
    clientAddress: String(draft.clientAddress || "").slice(0, 400),
    clientPhone: String(draft.clientPhone || "").slice(0, 40),
    clientEmail: String(draft.clientEmail || "").slice(0, 200),
    quoteTitle: String(draft.quoteTitle || "").slice(0, 180),
    notesInput: String(draft.notesInput || "").slice(0, 8000),
    items: Array.isArray(draft.items) ? draft.items.slice(0, MAX_ITEMS) : [],
    photos,
    photosOmitted: rawPhotos.length > photos.length,
    choiceOptions: Array.isArray(draft.choiceOptions) ? draft.choiceOptions : null,
    choiceIndex: Number(draft.choiceIndex) || 0,
    vatEnabled: Boolean(draft.vatEnabled),
    depositPercent: Number(draft.depositPercent) || 0,
    selectedCustomerId: String(draft.selectedCustomerId || ""),
    activeQuoteId: draft.activeQuoteId ? String(draft.activeQuoteId) : null,
    activeToken: draft.activeToken ? String(draft.activeToken) : null,
    cloudDraftId: draft.cloudDraftId ? String(draft.cloudDraftId) : null,
    cloudDraftToken: draft.cloudDraftToken ? String(draft.cloudDraftToken) : null,
  };
  if (JSON.stringify(next).length > MAX_CHARS) {
    next.photos = [];
    next.photosOmitted = true;
  }
  return next;
}

/**
 * @param {{ getItem: (key: string) => string | null }} storage
 */
export function readWorkingDraft(storage) {
  try {
    const raw = storage.getItem(WORKING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!snapshotHasWork(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * An empty form must not erase a draft that is waiting to be recovered.
 * @param {{ getItem: (key: string) => string | null, setItem: (key: string, value: string) => void }} storage
 * @param {Record<string, unknown>} draft
 * @param {string} nowIso
 */
export function writeWorkingDraft(storage, draft, nowIso) {
  if (!snapshotHasWork(draft)) return readWorkingDraft(storage);
  const next = trimWorkingDraft(draft, nowIso);
  storage.setItem(WORKING_DRAFT_KEY, JSON.stringify(next));
  return next;
}

/**
 * @param {{ removeItem: (key: string) => void }} storage
 */
export function clearWorkingDraft(storage) {
  storage.removeItem(WORKING_DRAFT_KEY);
}

/**
 * Offer recovery on a blank builder, or when reopening the same quote.
 * A different saved quote in the address bar is left alone.
 * @param {Record<string, unknown> | null} draft
 * @param {string | null | undefined} quoteParam
 */
export function shouldOfferRecovery(draft, quoteParam) {
  if (!snapshotHasWork(draft)) return false;
  const param = String(quoteParam || "").trim();
  if (!param) return true;
  return param === draft.activeQuoteId || param === draft.cloudDraftId;
}

/**
 * @param {string | null | undefined} savedAt
 * @param {number} [nowMs]
 */
export function recoveryWhenLabel(savedAt, nowMs = Date.now()) {
  const then = Date.parse(String(savedAt || ""));
  if (!Number.isFinite(then)) return "earlier";
  const mins = Math.max(0, Math.round((nowMs - then) / 60000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  return "earlier";
}

/**
 * A working copy must not reuse BB-1043. That number may already belong to a saved quote
 * that has not been copied onto this phone yet.
 */
export function newCloudDraftId() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return `draft-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return `draft-${Date.now().toString(36)}`;
}

/**
 * Cloud sync updates a draft only. A quote the customer can already open is left unchanged
 * until the tradesperson presses save.
 * @param {Record<string, unknown>} snapshot
 * @param {string | undefined} existingStatus
 */
export function canCloudSync(snapshot, existingStatus) {
  if (!snapshotHasWork(snapshot)) return false;
  // A quote already open might be one the customer can see. Only a known draft is updated.
  if (snapshot.activeQuoteId) return existingStatus === "Draft";
  return !existingStatus || existingStatus === "Draft";
}

/**
 * Keep updating the quote already open. Otherwise mint a draft- id that cannot clash
 * with a saved BB number.
 * @param {Record<string, unknown>} snapshot
 * @param {() => string} [createToken]
 */
export function ensureCloudIdentity(snapshot, createToken = generateToken) {
  if (snapshot.activeQuoteId && snapshot.activeToken) {
    return {
      ...snapshot,
      cloudDraftId: String(snapshot.activeQuoteId),
      cloudDraftToken: String(snapshot.activeToken),
    };
  }
  if (snapshot.cloudDraftId && snapshot.cloudDraftToken) return snapshot;
  return {
    ...snapshot,
    cloudDraftId: newCloudDraftId(),
    cloudDraftToken: createToken(),
  };
}

/**
 * The saved quote keeps its own BB number. A draft- row is only the working copy.
 * @param {unknown} cloudDraftId
 * @param {unknown} activeQuoteId
 */
export function autosaveRowToRetire(cloudDraftId, activeQuoteId) {
  const id = String(cloudDraftId || "");
  if (!id.startsWith("draft-")) return "";
  if (activeQuoteId && String(activeQuoteId) === id) return "";
  return id;
}

/**
 * @param {{ online: boolean, signedIn: boolean, snapshot: Record<string, unknown>, existingStatus?: string }} input
 * @returns {"sync" | "wait" | "skip"}
 */
export function cloudSyncPlan(input) {
  if (!input.signedIn || !canCloudSync(input.snapshot, input.existingStatus)) return "skip";
  return input.online ? "sync" : "wait";
}

/**
 * @param {Record<string, unknown>} snapshot
 * @param {string} createdAt
 */
export function toCloudDraftQuote(snapshot, createdAt) {
  const items = Array.isArray(snapshot.items) ? snapshot.items : [];
  const vatEnabled = Boolean(snapshot.vatEnabled);
  const depositPercent = Number(snapshot.depositPercent) || 0;
  const totals = recalculateQuoteTotals(items, vatEnabled, depositPercent);
  const choices = Array.isArray(snapshot.choiceOptions) ? snapshot.choiceOptions : [];
  return {
    id: String(snapshot.cloudDraftId || ""),
    token: String(snapshot.cloudDraftToken || ""),
    customerId: snapshot.selectedCustomerId ? String(snapshot.selectedCustomerId) : undefined,
    clientName: String(snapshot.clientName || "").trim() || "Private Client",
    clientCompany: String(snapshot.clientCompany || "").trim() || undefined,
    clientAddress: String(snapshot.clientAddress || "").trim() || "Address to be confirmed",
    clientPhone: String(snapshot.clientPhone || "").trim() || undefined,
    clientEmail: String(snapshot.clientEmail || "").trim() || undefined,
    title: String(snapshot.quoteTitle || "").trim() || "Trade works",
    notes: String(snapshot.notesInput || "").trim(),
    photos: Array.isArray(snapshot.photos) ? snapshot.photos : [],
    items,
    subtotal: totals.subtotal,
    vatEnabled,
    vat: totals.vat,
    total: totals.total,
    depositPercent,
    deposit: totals.deposit,
    status: "Draft",
    createdAt,
    options: choices.length > 1 ? choices : undefined,
  };
}
