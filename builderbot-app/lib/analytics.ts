import type { CaptureResult, PostHog } from "posthog-js";
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  SIGNUP_STORAGE_KEY,
  isCustomerPublicPath,
  isFreshSignup,
  normalizeConsent,
  sanitizeCapturedProperties,
  sanitizeEventProperties,
} from "@/lib/analytics-rules.mjs";

export type AnalyticsConsent = "accepted" | "declined";

type AnalyticsUser = {
  id: string;
  createdAt?: string;
  lastSignInAt?: string;
};

type QueuedEvent = {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
};

let client: PostHog | null = null;
let starting: Promise<void> | null = null;
let currentUser: AnalyticsUser | null = null;
let identifiedId: string | null = null;
const queue: QueuedEvent[] = [];

export function analyticsConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST);
}

export function readConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function rememberConsent(choice: AnalyticsConsent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // A private browser can refuse storage. The choice still applies for this page.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function signupAlreadyTracked(id: string) {
  try {
    const raw = window.localStorage.getItem(SIGNUP_STORAGE_KEY) || "";
    return raw.split(",").filter(Boolean).includes(id);
  } catch {
    return false;
  }
}

function rememberSignup(id: string) {
  try {
    const raw = window.localStorage.getItem(SIGNUP_STORAGE_KEY) || "";
    const ids = raw.split(",").filter(Boolean);
    if (!ids.includes(id)) ids.push(id);
    window.localStorage.setItem(SIGNUP_STORAGE_KEY, ids.slice(-20).join(","));
  } catch {
    // The event may fire again on the next visit. That is preferable to storing an email.
  }
}

function scrubCapture(capture: CaptureResult): CaptureResult | null {
  if (capture.event === "$exception" || capture.event === "$autocapture") return null;
  return {
    ...capture,
    properties: sanitizeCapturedProperties(capture.properties),
    $set: capture.$set ? sanitizeCapturedProperties(capture.$set) : capture.$set,
    $set_once: capture.$set_once ? sanitizeCapturedProperties(capture.$set_once) : capture.$set_once,
  };
}

function applyIdentity() {
  if (!client) return;
  if (!currentUser) {
    if (identifiedId) {
      identifiedId = null;
      client.reset();
      if (typeof window !== "undefined") syncSessionRecording(window.location.pathname);
    }
    return;
  }
  if (identifiedId !== currentUser.id) {
    client.identify(currentUser.id);
    identifiedId = currentUser.id;
  }
  if (
    isFreshSignup(currentUser.createdAt, currentUser.lastSignInAt) &&
    !signupAlreadyTracked(currentUser.id)
  ) {
    rememberSignup(currentUser.id);
    client.capture("signed_up");
  }
}

function flushQueue() {
  if (!client) return;
  const pending = queue.splice(0, queue.length);
  for (const item of pending) {
    const properties = sanitizeEventProperties(item.name, item.properties);
    if (properties) client.capture(item.name, properties);
  }
}

export function setAnalyticsUser(user: AnalyticsUser | null) {
  currentUser = user;
  applyIdentity();
}

export async function startAnalytics() {
  if (!analyticsConfigured() || readConsent() !== "accepted" || typeof window === "undefined") return;
  if (client) {
    applyIdentity();
    syncSessionRecording(window.location.pathname);
    return;
  }
  if (starting) return starting;

  starting = (async () => {
    const posthog = (await import("posthog-js")).default;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || !host || readConsent() !== "accepted") return;
    posthog.init(key, {
      api_host: host,
      defaults: "2026-01-30",
      autocapture: false,
      capture_exceptions: false,
      capture_pageview: true,
      capture_pageleave: false,
      persistence: "localStorage+cookie",
      person_profiles: "identified_only",
      disable_session_recording: isCustomerPublicPath(window.location.pathname),
      session_recording: {
        maskAllInputs: true,
        streamNetworkBody: false,
        captureJsonLd: false,
      },
      before_send: scrubCapture,
      property_denylist: ["email", "phone", "name", "address", "$ip", "$email"],
    });
    client = posthog;
    applyIdentity();
    syncSessionRecording(window.location.pathname);
    flushQueue();
  })().finally(() => {
    starting = null;
  });

  return starting;
}

export function bootAnalyticsIfConsented() {
  if (readConsent() === "accepted") void startAnalytics();
}

export function syncSessionRecording(pathname: string) {
  if (!client) return;
  if (isCustomerPublicPath(pathname)) {
    client.stopSessionRecording();
    return;
  }
  client.startSessionRecording();
}

export function captureEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null>
): boolean {
  if (!analyticsConfigured() || readConsent() !== "accepted") return false;
  const safe = sanitizeEventProperties(name, properties);
  if (!safe) return false;
  if (!client) {
    queue.push({ name, properties });
    void startAnalytics();
    return true;
  }
  client.capture(name, safe);
  return true;
}
