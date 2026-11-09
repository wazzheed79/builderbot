"use client";

import { useEffect, useState } from "react";
import { callOutFeeAmount } from "@/lib/call-out.mjs";
import { getPricingMemory } from "@/lib/storage";

/** The call-out fee saved in Settings. 0 until the page has loaded, and 0 when none is set. */
export function useCallOutFee() {
  const [fee, setFee] = useState(0);

  useEffect(() => {
    const read = () => setFee(callOutFeeAmount(getPricingMemory()));
    read();
    window.addEventListener("trademate_pricing_memory_updated", read);
    return () => window.removeEventListener("trademate_pricing_memory_updated", read);
  }, []);

  return fee;
}
