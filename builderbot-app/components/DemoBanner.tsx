"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { loadDemoSampleData } from "@/lib/storage";
import { brand } from "@/lib/brand.mjs";
import { CloudOff, ArrowRight, RefreshCw, X } from "lucide-react";

export default function DemoBanner() {
  const pathname = usePathname();
  const { isDemoMode, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (
    !mounted ||
    loading ||
    !isDemoMode ||
    dismissed ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname === "/terms"
  ) {
    return null;
  }

  const handleShowExample = () => {
    setResetting(true);
    loadDemoSampleData();
    setTimeout(() => setResetting(false), 500);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-stone-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-start gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
            <CloudOff className="w-3 h-3" />
            This browser only
          </span>
          <p className="text-stone-700 min-w-0">
            <span className="font-semibold text-ink">Quotes are not backed up until you sign in.</span>{" "}
            Clearing this browser deletes them. {brand.name} is free while in testing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShowExample}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition"
          >
            <RefreshCw className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`} />
            <span>Show example quotes</span>
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-clay-700 hover:bg-clay-800 text-white transition"
          >
            <span>Sign in</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <Link href="/feedback" className="text-xs font-semibold text-clay-800 underline">
            Feedback
          </Link>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 text-stone-400 hover:text-stone-600 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
