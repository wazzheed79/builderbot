import { isSensitiveKey, scrubText } from "./privacy-scrub.mjs";

export const CONSENT_STORAGE_KEY = "chuffed_analytics_consent";
export const SIGNUP_STORAGE_KEY = "chuffed_analytics_signups";
export const CONSENT_EVENT = "chuffed-analytics-consent";
const SIGNUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const EVENT_PROPERTIES = {
  signed_up: [],
  quote_created: ["ai_used"],
  quote_sent: [],
  quote_viewed: [],
  quote_accepted: ["had_options"],
  invoice_created: [],
  invoice_marked_paid: [],
  template_saved: [],
  demo_started: [],
  demo_quote_generated: ["ai_used"],
  demo_signup_clicked: [],
};

export function normalizeConsent(value) {
  return value === "accepted" || value === "declined" ? value : null;
}

export function isCustomerPublicPath(pathname) {
  if (typeof pathname !== "string" || !pathname) return false;
  return pathname === "/q" || pathname.startsWith("/q/") || pathname === "/i" || pathname.startsWith("/i/");
}

export function isFreshSignup(createdAt, lastSignInAt, nowMs = Date.now()) {
  const created = Date.parse(createdAt || "");
  const last = Date.parse(lastSignInAt || "");
  if (!Number.isFinite(created) || !Number.isFinite(last)) return false;
  return last >= created - 2 * 60 * 1000 && last - created <= SIGNUP_WINDOW_MS && nowMs >= created;
}

export function sanitizeEventProperties(eventName, properties) {
  const allowed = EVENT_PROPERTIES[eventName];
  if (!allowed) return null;
  const safe = {};
  if (!properties || typeof properties !== "object") return safe;
  for (const key of allowed) {
    const value = properties[key];
    if (typeof value === "boolean" || typeof value === "number") safe[key] = value;
  }
  return safe;
}

function isBlockedProperty(key) {
  const compact = String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (compact === "ip" || compact === "$ip") return true;
  if (compact.startsWith("$")) return false;
  return isSensitiveKey(compact) || /email|phone|address|postcode|signature|sortcode|accountnumber/.test(compact);
}

/** Strip personal details from anything PostHog would attach to an event. */
export function sanitizeCapturedProperties(properties) {
  if (!properties || typeof properties !== "object") return properties;
  const next = {};
  for (const [key, value] of Object.entries(properties)) {
    if (isBlockedProperty(key)) continue;
    next[key] = typeof value === "string" ? scrubText(value) : value;
  }
  return next;
}
