"use client";

import { useEffect, useState } from "react";
import { todayIso } from "@/lib/invoice-rules.mjs";

/** London's date, filled in after the page loads so the build stays stable. */
export function useTodayIso() {
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(todayIso());
  }, []);
  return today;
}
