import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Plain-language terms for the free ${brand.name} beta.`,
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-clay-800 hover:underline">
        Back to {brand.name}
      </Link>
      <h1 className="mt-4 text-3xl font-black text-ink tracking-tight">Terms of use</h1>
      <p className="mt-2 text-sm font-semibold text-stone-500">Last updated 20 October 2026</p>
      <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-4">
        Plain-language terms for the free beta. Not legal advice.
      </p>

      <div className="mt-8 space-y-6 text-sm text-stone-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-ink">The beta is free</h2>
          <p className="mt-2">
            {brand.name}, run by <strong>{brand.ownerName}</strong>, {brand.ownerRole}.{" "}
            {brand.foundingDetail} Paid plans and card payments are not available yet. You will
            not be charged during the beta. The price may change later, and you would be told
            before any charge.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Your quotes are your responsibility</h2>
          <p className="mt-2">
            Prices, descriptions, VAT, and any trade registration you type are yours to check
            before a customer sees them. Suggested prices are estimates. They are not a survey,
            a fixed contract, or proof of a licence. Do not send a quote you have not read.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Accounts and data</h2>
          <p className="mt-2">
            Quotes kept only in this browser can disappear if the browser is cleared. Sign in if
            you need the same quotes on more than one device. You must have permission to store
            your customers&apos; contact details.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">The service can change or stop</h2>
          <p className="mt-2">
            This is a test version. Features can change, and the free service can be paused.
            Contact{" "}
            <a className="font-semibold text-clay-800 underline" href={`mailto:${brand.ownerEmail}`}>
              {brand.ownerEmail}
            </a>{" "}
            about access or deletion.
          </p>
        </section>
      </div>
    </div>
  );
}
