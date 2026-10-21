// One counted open per phone, without asking the customer to sign in.
// The database enforces this. These helpers match that rule so the tests can
// check it: count again only when the last counted open is at least this old.
import { createHash, randomBytes } from "node:crypto";

/** 24 hours. A reload the same day is still one open. */
export const QUOTE_VIEW_WINDOW_SECONDS = 24 * 60 * 60;

export const VISITOR_COOKIE = "cq_visitor";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

/**
 * @param {unknown} value
 */
export function isVisitorId(value) {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

export function newVisitorId() {
  return randomBytes(16).toString("hex");
}

/**
 * Stored in Postgres instead of the cookie, so a database read is not the cookie.
 * @param {unknown} visitorId
 */
export function hashVisitorId(visitorId) {
  if (!isVisitorId(visitorId)) return "";
  return createHash("sha256").update(`cq-visitor:${visitorId}`).digest("hex");
}

/**
 * @param {string | number | Date | null | undefined} lastCountedAt
 * @param {number} nowMs
 * @param {number} [windowSeconds]
 */
export function shouldCountQuoteView(lastCountedAt, nowMs, windowSeconds = QUOTE_VIEW_WINDOW_SECONDS) {
  if (lastCountedAt == null || lastCountedAt === "") return true;
  const then = new Date(lastCountedAt).getTime();
  if (Number.isNaN(then)) return true;
  return nowMs - then >= windowSeconds * 1000;
}
