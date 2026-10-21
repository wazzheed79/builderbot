"use client";

import { useSyncExternalStore } from "react";
import { todayIso } from "@/lib/invoice-rules.mjs";

function subscribe() {
  return () => {};
}

/** London's date, filled in after the page loads so the build stays stable. */
export function useTodayIso() {
  return useSyncExternalStore(subscribe, () => todayIso(), () => "");
}
