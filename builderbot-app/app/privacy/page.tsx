import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `How ${brand.name} stores quotes, sign-in, and customer replies.`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-clay-800 hover:underline">
        Back to {brand.name}
      </Link>
      <h1 className="mt-4 text-3xl font-black text-ink tracking-tight">Privacy notice</h1>
      <p className="mt-2 text-sm font-semibold text-stone-500">Last updated 21 October 2026</p>
      <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-4">
        A plain-language notice for the free beta. It is not legal advice.
      </p>

      <div className="mt-8 space-y-6 text-sm text-stone-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-ink">Who this is from</h2>
          <p className="mt-2">
            {brand.name} is run by <strong>{brand.ownerName}</strong>, {brand.ownerRole}. Email{" "}
            <a className="font-semibold text-clay-800 underline" href={`mailto:${brand.ownerEmail}`}>
              {brand.ownerEmail}
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">What is stored</h2>
          <p className="mt-2">
            You can save customers, quotes, prices, site photos, and your business details. Until
            you sign in, that stays in this browser. After you sign in, it is stored in Supabase,
            in the EU (London) region, so you can open it on another phone. The website is hosted
            on Vercel.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Sign-in emails</h2>
          <p className="mt-2">
            Sign-in emails are sent by Resend from {brand.ownerEmail}. They contain a link and a
            6-digit code. We do not take card numbers. Card payments are switched off.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">AI quote drafts</h2>
          <p className="mt-2">
            If you ask for an AI draft, the notes you typed or spoke, and any photos you attach
            for that draft, are sent to Google Gemini. You check the prices before a customer
            sees them.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">When a customer opens a quote</h2>
          <p className="mt-2">
            We record that they viewed the quote, and whether they accepted or declined. Opening
            the same quote again on the same phone within a day counts as one view. If they type
            their name to accept, that name is saved with the quote.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Cookies</h2>
          <p className="mt-2">
            There is no advertising tracker. Sign-in keeps a session so you stay signed in on
            that phone. A customer quote page stores a cookie on that phone so a repeat open the
            same day is not counted again. Optional usage counts do not store a cookie, and do
            not start, until you tap Accept. Decline is remembered on this phone.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">If a page breaks</h2>
          <p className="mt-2">
            A short error report can be sent to Sentry so the fault can be fixed. Before it is
            sent, names, email addresses, phone numbers, addresses, and the words of a quote are
            removed. Sentry does not record the screen. If Sentry is not switched on, no report
            is sent.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Optional usage counts</h2>
          <p className="mt-2">
            If you tap Accept, PostHog counts how the app is used. That includes a new account, a
            quote being created, sent, opened, or accepted, an invoice being created or marked
            paid, and a template being saved. A signed-in tradesperson is recognised by an account
            id only, not by their email. Customer names, phone numbers, addresses, and quote
            wording are not included. A customer quote page and a customer invoice page are not
            recorded. On the tradesperson’s own pages, anything typed into a box is hidden.
            Decline means none of this is turned on. When it is switched on, these counts go to
            PostHog in the EU.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Asking for a copy or deletion</h2>
          <p className="mt-2">
            A customer named on a quote should ask the tradesperson who wrote it. You can delete
            a customer or a quote in the app, or email{" "}
            <a className="font-semibold text-clay-800 underline" href={`mailto:${brand.ownerEmail}`}>
              {brand.ownerEmail}
            </a>{" "}
            and we will help.
          </p>
        </section>
      </div>
    </div>
  );
}
