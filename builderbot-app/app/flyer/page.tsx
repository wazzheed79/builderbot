"use client";

import { Printer, ArrowLeft, Sparkles, CheckCircle2, Smartphone, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import QuoteQrCode from "@/components/quotes/QuoteQrCode";
import { brand } from "@/lib/brand.mjs";
import { useSiteHost, useSiteOrigin } from "@/lib/live-store";

export default function TradeFlyerPage() {
  const liveUrl = useSiteOrigin();
  const hostLabel = useSiteHost() || "Open this site";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-200 py-8 px-4 sm:px-6 flex flex-col items-center">
      {/* On-Screen Action Bar (Hidden when printed) */}
      <div className="w-full max-w-xl mb-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-300 flex items-center justify-between gap-4 print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <div className="text-center">
          <span className="text-xs font-extrabold text-slate-900 block">
            A5 Trade Counter Notice Board Flyer
          </span>
          <span className="text-[11px] text-slate-500">
            For Screwfix, Toolstation & Travis Perkins
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-clay-700 hover:bg-clay-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-clay-700/25 transition active:scale-[0.98]"
        >
          <Printer className="w-4 h-4" />
          <span>Print Flyer</span>
        </button>
      </div>

      {/* Printing Tips Callout (Hidden on print) */}
      <div className="w-full max-w-xl mb-4 bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 flex items-center justify-between print:hidden">
        <span>💡 <strong>Tip for Printing:</strong> In your browser print window, select <strong>A5</strong> (or A4 with &quot;Fit to page&quot;) and check <strong>&quot;Background graphics&quot;</strong>.</span>
      </div>

      {/* The Printable A5 Flyer (148mm x 210mm proportional container) */}
      <div
        id="flyer-sheet"
        className="w-full max-w-[560px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-none text-slate-900 flex flex-col justify-between"
        style={{
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        {/* Top Header Banner */}
        <div className="bg-slate-950 text-white p-6 sm:p-7 text-center relative overflow-hidden border-b-4 border-amber-500">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-black uppercase tracking-widest border border-amber-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>For UK Builders • Plumbers • Sparks • Roofers • Carpenters</span>
          </div>

          <p className="text-sm font-black tracking-wide text-amber-200 mb-2">{brand.name}</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight uppercase">
            Still writing quotes at <br />
            <span className="text-amber-400 underline decoration-amber-400/50 decoration-wavy decoration-2">
              9:00 PM on your sofa?
            </span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
            Stop losing your evenings to paperwork after a 10-hour day on site. Price, quote, and get a typed acceptance from your phone in under 2 minutes.
          </p>
        </div>

        {/* Core Value Pillars */}
        <div className="p-6 sm:p-7 space-y-4 bg-gradient-to-b from-white to-slate-50 flex-1 flex flex-col justify-around">
          <div className="space-y-3.5">
            {/* Pillar 1 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-clay-100 text-clay-800 flex items-center justify-center shrink-0 font-bold mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                  1. Speak or Type in the Van (Under 2 Mins)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Dictate the job: <em>&quot;Fit 6 fence panels and concrete posts&quot;</em>. {brand.name} drafts materials and hours. You check every price.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                  2. Send via WhatsApp with 1 Tap
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  No messy Word docs or scrawled paper notes. Customer receives a sleek, branded quote with your logo directly on their mobile phone.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                  3. Typed acceptance on their phone
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Homeowners can read the quote and accept it on their phone by typing their name. Card payments are not switched on during the beta.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action & High-Contrast QR Code */}
          <div className="mt-2 p-5 rounded-2xl bg-slate-900 text-white border-2 border-amber-500 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Free during the beta</span>
              </div>
              <h4 className="text-lg font-black text-white leading-tight">
                Scan with Phone Camera to Try Free:
              </h4>
              <p className="text-xs text-slate-300">
                No app store download. Launches immediately on your mobile browser.
              </p>
              <div className="pt-1">
                <span className="font-mono text-xs font-bold text-amber-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 inline-block">
                  {hostLabel}
                </span>
              </div>
            </div>

            {/* Sharp Vector QR Code */}
            <div className="shrink-0 bg-white p-2.5 rounded-2xl shadow-md border-2 border-white">
              <QuoteQrCode url={liveUrl} size={110} label="" />
              <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wider block text-center mt-1">
                Scan to Open
              </span>
            </div>
          </div>

          {/* Social Proof & Founder Endorsement */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Created by British founder <strong>Michael Boylen</strong></span>
            </div>
            <span>No long contracts • Cancel anytime</span>
          </div>
        </div>

        {/* Bottom Tear-off Style Tabs */}
        <div className="bg-slate-100 border-t-2 border-dashed border-slate-300 p-3 grid grid-cols-4 gap-2 text-center text-[10px] font-mono text-slate-700">
          <div className="border-r border-slate-300 pr-1">
            <span className="font-bold block text-clay-800">{brand.shortName}</span>
            <span className="text-[9px] text-slate-500 truncate block">{hostLabel}</span>
          </div>
          <div className="border-r border-slate-300 pr-1">
            <span className="font-bold block text-clay-800">{brand.tagline}</span>
            <span className="text-[9px] text-slate-500 truncate block">Free during the beta</span>
          </div>
          <div className="border-r border-slate-300 pr-1">
            <span className="font-bold block text-clay-800">{brand.shortName}</span>
            <span className="text-[9px] text-slate-500 truncate block">{hostLabel}</span>
          </div>
          <div>
            <span className="font-bold block text-clay-800">WhatsApp Quotes</span>
            <span className="text-[9px] text-slate-500 truncate block">Scan QR Code</span>
          </div>
        </div>
      </div>
    </div>
  );
}
