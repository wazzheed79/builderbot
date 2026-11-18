"use client";

import { useEffect, useState } from "react";
import { CLOUD_SAVE_FAILED_EVENT } from "@/lib/cloud-retry.mjs";

/**
 * Small notice shown when an online save still fails after retries.
 * The record is safe on this device; it is just not online yet.
 */
export default function CloudSaveNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener(CLOUD_SAVE_FAILED_EVENT, show);
    return () => window.removeEventListener(CLOUD_SAVE_FAILED_EVENT, show);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="no-print fixed inset-x-3 bottom-28 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg lg:bottom-6"
    >
      <p className="flex-1">
        Saved on this device, but not online yet. Check your signal and save again so it is not lost.
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="font-semibold underline"
        aria-label="Dismiss"
      >
        OK
      </button>
    </div>
  );
}
