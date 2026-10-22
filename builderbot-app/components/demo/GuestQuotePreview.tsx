"use client";

import { useState } from "react";
import { Clock, ShieldCheck, Wrench } from "lucide-react";
import { formatGbp, preparePrintableQuote } from "@/lib/quote-print.mjs";
import { GUEST_PLACEHOLDER_BUSINESS } from "@/lib/guest-demo.mjs";

type PreviewItem = {
  id?: string;
  type?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
};

type PreviewOption = {
  id: string;
  label: string;
  items: PreviewItem[];
  subtotal: number;
  vat: number;
  total: number;
  deposit: number;
};

export type GuestPreviewQuote = {
  title: string;
  scopeOfWork: string;
  suggestedDepositPercent: number;
  items: PreviewItem[];
  options: PreviewOption[];
  aiPowered: boolean;
  estimateOnly: boolean;
  notice?: string;
  businessName: string;
  previewOnly: true;
};

/**
 * The customer page, with a placeholder business name and no way to accept,
 * share, or pay. Bank details are never shown here.
 */
export default function GuestQuotePreview({ quote }: { quote: GuestPreviewQuote }) {
  const options = Array.isArray(quote.options) ? quote.options.slice(0, 3) : [];
  const [pickedId, setPickedId] = useState(options[0]?.id || "");
  const chosen = options.find((option) => option.id === pickedId) || options[0];
  const items = chosen?.items || quote.items;
  const printable = preparePrintableQuote({
    items,
    vatEnabled: true,
    depositPercent: quote.suggestedDepositPercent,
    totals: chosen
      ? {
          subtotal: chosen.subtotal,
          vat: chosen.vat,
          total: chosen.total,
          deposit: chosen.deposit,
        }
      : undefined,
  });
  const businessName = quote.businessName || GUEST_PLACEHOLDER_BUSINESS;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 border-t-8 border-t-clay-700 bg-[#fffdf8] shadow-xl">
      <div className="border-b border-stone-200 bg-clay-50 px-4 py-3 text-sm font-semibold text-clay-900">
        Preview of what your customer would see. This is not a real quote and it has not been sent.
      </div>
      <div className="border-b border-stone-200 p-5 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-800">Quotation</p>
        <div className="mb-2 mt-2 inline-flex items-center gap-2 rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-xs font-bold text-clay-800">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Trade quote</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-ink">{businessName}</h2>
        <p className="mt-1 text-sm text-stone-500">Preview only. No quote number until you save it.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700">
            <ShieldCheck className="h-3 w-3 text-clay-700" aria-hidden="true" />
            Direct trade quotation
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Preview
          </span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
          <div>
            <span className="font-bold uppercase tracking-wider text-stone-500">Prepared for</span>
            <p className="mt-0.5 text-sm font-bold text-ink">Your customer</p>
            <p className="mt-0.5 text-stone-600">Address added after you sign up</p>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-stone-500">Project</span>
            <p className="mt-0.5 text-sm font-bold text-ink">{quote.title}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        {quote.scopeOfWork && (
          <div>
            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-600">
              Scope of work
            </h3>
            <p className="whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
              {quote.scopeOfWork}
            </p>
          </div>
        )}

        {options.length > 1 && (
          <div>
            <h3 className="mb-1 text-xs font-extrabold uppercase tracking-widest text-stone-600">
              Choose a price
            </h3>
            <p className="mb-3 text-sm text-stone-700">Pick one. The lines below match that choice.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {options.map((option) => {
                const selected = option.id === (chosen?.id || "");
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPickedId(option.id)}
                    className={`min-h-[4.5rem] rounded-2xl border-2 px-4 py-3 text-left ${
                      selected ? "border-clay-700 bg-clay-50" : "border-stone-200 bg-white"
                    }`}
                  >
                    <span className="block text-sm font-bold text-ink">{option.label}</span>
                    <span className="block text-xl font-black tabular-nums text-clay-800">
                      {formatGbp(option.total)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-stone-600">
            Itemised cost breakdown
          </h3>
          <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200">
            {printable.lines.map((item) => (
              <div key={item.key} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
                <p className="min-w-0 font-medium wrap-break-word text-ink">{item.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Qty</p>
                    <p className="mt-0.5 text-sm tabular-nums text-stone-800">
                      {item.qtyLabel} {item.unit}
                    </p>
                  </div>
                  <div className="min-w-0 border-l border-stone-200 pl-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Rate</p>
                    <p className="mt-0.5 text-sm tabular-nums text-stone-800">{item.rateLabel}</p>
                  </div>
                  <div className="min-w-0 border-l border-stone-200 pl-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{item.lineTotal}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 border-t border-stone-200 pt-4 sm:flex-row sm:items-center">
          <div className="space-y-1 text-xs text-stone-600">
            <p className="font-semibold text-stone-800">Payment terms on this preview</p>
            <p>
              {quote.suggestedDepositPercent}% deposit ({printable.deposit}) would be asked when they accept.
            </p>
            <p>No bank details are shown. Those are only added from your own settings, after a real quote is accepted.</p>
          </div>
          <div className="w-full space-y-2 rounded-xl border border-stone-300 bg-white p-4 text-sm sm:w-72">
            <div className="flex justify-between gap-3 text-stone-700">
              <span>Net</span>
              <span className="font-medium tabular-nums text-ink">{printable.subtotal}</span>
            </div>
            <div className="flex justify-between gap-3 text-stone-700">
              <span>VAT</span>
              <span className="font-medium tabular-nums text-ink">{printable.vat}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-stone-200 pt-2 text-base font-black text-ink">
              <span>Total</span>
              <span className="tabular-nums">{printable.total}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-stone-200 px-4 text-base font-bold text-stone-500"
        >
          Accept is switched off in this preview
        </button>
      </div>
    </div>
  );
}
