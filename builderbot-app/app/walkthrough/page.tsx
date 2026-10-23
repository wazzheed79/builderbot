import type { Metadata } from "next";
import Link from "next/link";
import VanWalkthrough from "@/components/VanWalkthrough";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Quick van demo — Chuffed Quotes",
  description:
    "A short demo of the five steps: speak or type the job, check the prices, send a WhatsApp link, the customer types their name, then make an invoice.",
  alternates: { canonical: "/walkthrough" },
};

export default function WalkthroughPage() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span>Back to Chuffed Quotes</span>
          </Link>
          <Link
            href="/try"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-clay-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-clay-800"
          >
            <span>Try free, no sign-up</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-2 pt-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            Quick interactive demo
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Quote from your van. Skip the Sunday paperwork.
          </h1>
          <p className="mx-auto max-w-xl text-sm text-slate-400 sm:text-base">
            Five steps in the app, from notes in the van to an invoice. Sample names and prices. Not a real job, and not a claim that other trades already use it.
          </p>
        </div>

        <VanWalkthrough standalone />

        {/* 3 Real World Trade Scenarios */}
        <div className="mt-8 space-y-4">
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <span>🛠️</span>
              <span>Where Chuffed Quotes Saves Your Bacon</span>
            </h2>
            <p className="text-xs text-slate-400">
              Three common on-site situations UK trades face every week:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Scenario 1: Friday 5 PM in the Van
              </span>
              <p className="text-xs font-semibold text-white">The &ldquo;Can you email me a quote tonight?&rdquo; customer</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instead of driving home to a cold dinner and spending 2 hours on a laptop, tap the mic from your driver&apos;s seat. Dictate the job notes, send the WhatsApp quote, and enjoy your Sunday.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Scenario 2: The Price Haggler
              </span>
              <p className="text-xs font-semibold text-white">How 3 packages stop discount demands</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you give one price, clients haggle. When you give Standard, Better, and Premium packages, they compare options instead of shopping around. Most pick the middle package.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                Scenario 3: &ldquo;While you&apos;re here...&rdquo;
              </span>
              <p className="text-xs font-semibold text-white">Locking in extras without arguments</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Client asks for extra tiling or replacement valves while you&apos;re on site? Quote it in 15 seconds and get their digital sign-off on their phone before you start the work.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-4 text-left sm:grid-cols-3">
          <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-400">1. Talk or type</p>
            <p className="text-xs text-slate-300">
              Describe the job in plain English from the van, or type a few notes. You check the words before a customer sees them.
            </p>
          </div>
          <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">2. WhatsApp link</p>
            <p className="text-xs text-slate-300">
              After you sign in and save, send the link. The customer opens it on their phone. No app and no account for them.
            </p>
          </div>
          <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-400">3. Invoice later</p>
            <p className="text-xs text-slate-300">
              A sent or accepted quote can become an invoice you share or print. Bank details show only if you saved them.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h2 className="text-lg font-bold text-white">Ready to try a quote?</h2>
          <p className="mx-auto max-w-md text-xs text-slate-400 sm:text-sm">
            Free during the beta for UK trades. No payment card.
          </p>
          <div className="flex justify-center pt-2">
            <Link
              href="/try"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-clay-700 px-5 text-sm font-bold text-white shadow-md hover:bg-clay-800"
            >
              <span>Build a test quote</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
