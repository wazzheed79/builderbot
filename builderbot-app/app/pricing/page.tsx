import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand.mjs";
import FoundingOffer from "@/components/FoundingOffer";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${brand.name} is free while it is in testing. No card needed.`,
};

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <FoundingOffer />
      <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-ink">
        {brand.name} is free during the beta
      </h1>
      <p className="mt-3 text-base text-stone-600 leading-relaxed">
        {brand.tagline}. There is no card payment and no paid plan to buy yet. You will not be
        charged for using this test version.
      </p>

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-ink">What you can do now</h2>
        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          <li>Write a quote on your phone, with prices you can edit.</li>
          <li>Save customers in this browser, or sign in so they sync to your account.</li>
          <li>Send a customer a link. They can read it and sign if the quote was sent and has not expired.</li>
          <li>Keep your own bank details hidden until the customer has accepted.</li>
        </ul>
        <Link
          href="/quotes"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-clay-700 px-5 font-bold text-white hover:bg-clay-800"
        >
          Create a quote
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-paper p-6">
        <h2 className="text-lg font-bold text-ink">Paid plans</h2>
        <p className="mt-2 text-sm text-stone-600">
          Coming later. They are switched off, so nobody can look like a paying subscriber and
          nobody can be charged from this page.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-xl bg-stone-200 px-5 font-bold text-stone-500"
        >
          Coming soon
        </button>
      </div>
    </div>
  );
}
