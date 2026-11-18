import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { brand } from "@/lib/brand.mjs";
import { rateCardFromParams } from "@/lib/day-rate.mjs";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Rate card",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** A printable A4 rate card. Choose "Save as PDF" in the print window for a PDF. */
export default function RateCardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-stone-600">Loading your rate card…</div>}>
      <RateCard searchParams={searchParams} />
    </Suspense>
  );
}

async function RateCard({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  const card = rateCardFromParams(params);
  const pounds = (n: number) => `£${n.toLocaleString("en-GB")}`;
  const rows: [string, string][] = [
    ["Half day", pounds(card.half)],
    ["Per hour", pounds(card.hour)],
    ...(card.callOut > 0 ? ([["Call-out, from", pounds(card.callOut)]] as [string, string][]) : []),
    ["Weekend day", pounds(card.weekend)],
    ["Emergency, per hour", pounds(card.emergency)],
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/day-rate-calculator" className="text-sm font-bold text-clay-700 underline">
          ← Back to the calculator
        </Link>
        <PrintButton />
      </div>
      {card.day > 0 ? (
        <article className="print-page overflow-hidden rounded-2xl border border-stone-300 bg-white print:rounded-none print:border-0">
          <div className="h-3 bg-clay-600" />
          <div className="p-8 sm:p-12">
            <p className="text-sm font-bold uppercase tracking-widest text-clay-700">
              {card.trade ? `${card.trade} · rates` : "Rates"}
            </p>
            <h1 className="mt-1 text-4xl font-black text-ink">{card.name || "My rates"}</h1>
            <p className="mt-10 text-lg text-stone-600">Day rate</p>
            <p className="text-8xl font-black tabular-nums tracking-tight text-ink">{pounds(card.day)}</p>
            <dl className="mt-10 divide-y divide-stone-200 border-y border-stone-200 text-xl">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between py-3">
                  <dt className="text-stone-600">{label}</dt>
                  <dd className="font-black tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-base text-stone-600">Prices before VAT. Materials are charged on top.</p>
            <p className="mt-10 text-sm text-stone-400">Made with {brand.name}</p>
          </div>
        </article>
      ) : (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-700">
          This link has no rates in it. Open the calculator to make your card.
        </p>
      )}
    </div>
  );
}
