"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand.mjs";
import { CONSENT_EVENT } from "@/lib/analytics-rules.mjs";
import {
  analyticsConfigured,
  readConsent,
  rememberConsent,
  startAnalytics,
  syncSessionRecording,
  type AnalyticsConsent,
} from "@/lib/analytics";

function subscribeConsent(onStoreChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export default function AnalyticsConsentBanner() {
  const pathname = usePathname();
  const configured = analyticsConfigured();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const choice = useSyncExternalStore(subscribeConsent, readConsent, () => null);

  useEffect(() => {
    if (choice === "accepted") void startAnalytics();
  }, [choice]);

  useEffect(() => {
    syncSessionRecording(pathname);
  }, [pathname]);

  if (!configured || !mounted || choice) return null;

  const choose = (next: AnalyticsConsent) => {
    rememberConsent(next);
  };

  return (
    <div className="no-print border-b border-stone-200 bg-white px-4 py-3">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-snug text-stone-700">
          Optional usage counts help improve {brand.name}. No advertising, and nothing is sent until you accept.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-ink sm:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-clay-700 px-4 text-sm font-bold text-white sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
