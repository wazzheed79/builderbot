import Link from "next/link";
import { brand } from "@/lib/brand.mjs";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-clay-800 hover:underline">
        Back to {brand.name}
      </Link>
      <h1 className="mt-4 text-3xl font-black text-ink tracking-tight">Privacy notice</h1>
      <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-4">
        This is a plain-language template for the free beta. It is not legal advice. Replace
        the placeholders <strong>[YOUR NAME]</strong> and <strong>[YOUR EMAIL]</strong> with
        the real owner details, then have it checked before you rely on it.
      </p>

      <div className="mt-8 space-y-6 text-sm text-stone-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-ink">Who this is from</h2>
          <p className="mt-2">
            {brand.name} is run by <strong>[YOUR NAME]</strong>. Contact: <strong>[YOUR EMAIL]</strong>.
            Last updated: October 2026.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">What a tradesperson stores</h2>
          <p className="mt-2">
            Until you create an account and sign in, customers, quotes, and site photos stay in
            this browser only. Clearing the browser, or using a different phone, can delete that
            work. There is no automatic backup of browser-only data.
          </p>
          <p className="mt-2">
            If you sign in, the app copies customers, quotes, jobs, invoices, and your business
            profile to a Supabase database so you can open them on another device. Site photos
            sync only after the database photo column has been added. Until then they stay on
            the phone that took them.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Who else sees data</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>The hosting company (Vercel) serves the website.</li>
            <li>Supabase stores accounts and synced records when sign-in is switched on.</li>
            <li>
              Google&apos;s Gemini service receives job notes, and photos if you attach them, only
              when you are signed in and an AI key has been added. Do not put customer secrets
              in notes if you are unsure how that provider uses them.
            </li>
            <li>Card payments are switched off during this free beta. No card numbers are taken.</li>
            <li>Feedback you send is stored in the database when that is set up, or written to the host logs.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Customers named on a quote</h2>
          <p className="mt-2">
            The tradesperson who types a customer&apos;s name, address, phone, or email decides
            why that information is there. {brand.name} provides the tool. A customer who wants
            a quote deleted should ask the tradesperson. The tradesperson can delete the record
            in the app, or email <strong>[YOUR EMAIL]</strong> for help with a synced account.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink">Cookies and analytics</h2>
          <p className="mt-2">
            This beta does not add an advertising tracker or a cookie banner script. Sign-in, if
            you use it, uses the account provider&apos;s session storage. Error notes sent by the
            app contain the page path and a short error message, not a customer list.
          </p>
        </section>
      </div>
    </div>
  );
}
