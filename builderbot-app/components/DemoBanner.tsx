"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { loadDemoSampleData } from "@/lib/storage";
import { Sparkles, CloudOff, ArrowRight, RefreshCw, X } from "lucide-react";

export default function DemoBanner() {
  const pathname = usePathname();
  const { isDemoMode, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (loading || !isDemoMode || dismissed || pathname === "/" || pathname === "/login") {
    return null;
  }

  const handleResetSampleData = () => {
    setResetting(true);
    loadDemoSampleData();
    setTimeout(() => setResetting(false), 500);
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-blue-500/10 border-b border-amber-200/80 px-4 py-2.5 text-xs sm:text-sm text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <CloudOff className="w-3 h-3 text-amber-600" />
            Demo Mode
          </span>
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">Offline browser storage.</span> Quotes and customers won&apos;t sync to your phone or team until you sign in.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSampleData}
            disabled={resetting}
            title="Reload realistic trade demonstration quotes and customers"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3 h-3 text-slate-500 ${resetting ? "animate-spin" : ""}`} />
            <span>Reset Demo Data</span>
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
          >
            <Sparkles className="w-3 h-3" />
            <span>Sign In / Create Account</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
