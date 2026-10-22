import type { Metadata } from "next";
import Link from "next/link";
import VanWalkthrough from "@/components/VanWalkthrough";
import { brand } from "@/lib/brand.mjs";
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "45-Second Van Walkthrough — Chuffed Quotes",
  description:
    "Watch how UK trades turn rough steering-wheel voice notes into an itemised WhatsApp quote accepted by customers before pulling off the drive.",
  alternates: { canonical: "/walkthrough" },
};

export default function WalkthroughPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Chuffed Quotes</span>
          </Link>
          <Link
            href="/try"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-clay-700 hover:bg-clay-800 text-white font-bold text-xs transition shadow-sm"
          >
            <span>Try Free No Sign-Up</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Header Introduction */}
        <div className="text-center space-y-2 pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            <span>⚡</span>
            <span>45-Second Interactive Demonstration</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quote From Your Van. Never Lose Another Sunday.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            See the exact 5-step flow used by UK plumbers, sparkies, and builders from on-site dictation to customer sign-off.
          </p>
        </div>

        {/* Walkthrough Player */}
        <VanWalkthrough standalone />

        {/* Benefits Cards below */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">1. Zero Typing</p>
            <p className="text-xs text-slate-300">
              Speak naturally into your phone microphone from the driver&apos;s seat. No forms, no fiddly keyboards.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">2. WhatsApp Native</p>
            <p className="text-xs text-slate-300">
              Customers open a clean mobile quote in 1 tap without downloading an app or creating any login.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wide">3. Faster Payments</p>
            <p className="text-xs text-slate-300">
              Accepted quotes convert in 1 tap to professional VAT invoices with your bank sort code and account number.
            </p>
          </div>
        </div>

        {/* Call to action footer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 mt-6">
          <h2 className="text-lg font-bold text-white">Ready to quote your first job in 30 seconds?</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            100% free during beta for UK tradespeople. No payment card required.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/try"
              className="inline-flex items-center gap-2 rounded-xl bg-clay-700 hover:bg-clay-800 px-5 py-2.5 text-sm font-bold text-white shadow-md transition"
            >
              <span>Build a Test Quote Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
