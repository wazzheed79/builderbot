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
  demo_build_clicked: ["used_example"],
  demo_quote_generated: ["ai_used", "used_example"],
  demo_build_failed: ["reason", "used_example"],
  demo_signup_clicked: [],
};

/** The only words a failure event may carry. Job notes never qualify. */
const FAILURE_REASONS = new Set(["empty_input", "daily_limit", "ai_error"]);

const PERSONAL_FRAGMENT =
  /email|phone|address|postcode|signature|sortcode|accountnumber|password|secret/;

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
    if (typeof value === "boolean" || typeof value === "number") {
      safe[key] = value;
      continue;
    }
    if (key === "reason" && typeof value === "string" && FAILURE_REASONS.has(value)) {
      safe[key] = value;
    }
  }
  return safe;
}

function isPersonalField(compact) {
  if (!compact || compact === "ip") return compact === "ip";
  if (isSensitiveKey(compact) || PERSONAL_FRAGMENT.test(compact)) return true;
  // access_token, reset_token, and similar. The exact key `token` is handled
  // before this runs, because PostHog needs that one property.
  return compact.includes("token");
}

function isBlockedProperty(key) {
  const lower = String(key).toLowerCase();
  // PostHog puts the project API key on `token` after our own properties.
  // Removing that key makes the library drop the event, so nothing is counted.
  if (lower === "token") return false;

  const compact = lower.replace(/[^a-z0-9]/g, "");
  if (compact === "ip") return true;

  // Check the raw key before non-letters are stripped. A leading `$` is
  // PostHog's own field (`$pathname`, `$lib`, `$session_id`). Stripping it
  // first made this skip impossible, so those fields were judged as ordinary
  // names. A personal field that merely starts with `$` is still removed.
  if (lower.startsWith("$")) return isPersonalField(compact);

  return isPersonalField(compact);
}

/** Strip personal details from anything PostHog would attach to an event. */
export function sanitizeCapturedProperties(properties) {
  if (!properties || typeof properties !== "object") return properties;
  const next = {};
  for (const [key, value] of Object.entries(properties)) {
    if (isBlockedProperty(key)) continue;
    // Leave the project API key byte-for-byte. A digit run inside it must not
    // be treated as a phone number.
    if (String(key).toLowerCase() === "token") {
      next[key] = value;
      continue;
    }
    next[key] = typeof value === "string" ? scrubText(value) : value;
  }
  return next;
}
