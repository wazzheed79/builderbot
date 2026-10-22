import type { Metadata } from "next";
import Link from "next/link";
import { brand, configuredSiteUrl } from "@/lib/brand.mjs";
import FoundingOffer from "@/components/FoundingOffer";
import HomeCtas from "@/components/HomeCtas";
import HomeVoice from "@/components/HomeVoice";
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Mic,
  MessageCircle,
  ListChecks,
  Layers,
} from "lucide-react";

const site = configuredSiteUrl() || "https://www.chuffedquotes.co.uk";

export const metadata: Metadata = {
  title: {
    absolute: `${brand.name} — rough notes into a professional quote`,
  },
  description: brand.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${brand.name} — rough notes into a professional quote`,
    description: brand.description,
    url: "/",
  },
};

const steps = [
  {
    title: "Say the job",
    body: "Talk for a moment in the van, or type a few rough notes. Plain English is enough.",
  },
  {
    title: "Check the prices",
    body: "You get an itemised list. Change any line. Send one price, or Standard, Better, and Premium.",
  },
  {
    title: "Send the link",
    body: "Share it by link or WhatsApp. Your customer picks a price if you offered a choice, then accepts. No login for them.",
  },
];

const features = [
  {
    icon: Mic,
    title: "Talk or type",
    body: "Describe the job out loud, or type it. You read the result before anyone else does.",
  },
  {
    icon: ListChecks,
    title: "Prices you can edit",
    body: "Every quantity and rate can be changed. A rough estimate is labelled as one.",
  },
  {
    icon: MessageCircle,
    title: "Link or WhatsApp",
    body: "Sign in, save the quote, then send the customer link. They open it on their phone.",
  },
  {
    icon: Layers,
    title: "One price, or three",
    body: "Offer a single total, or Standard, Better, and Premium. The customer picks one.",
  },
  {
    icon: ShieldCheck,
    title: "Your name on it",
    body: "The quote uses the business name, logo, and terms you save in settings.",
  },
  {
    icon: Smartphone,
    title: "Built for a phone",
    body: "Large buttons, so you can put a quote together from the driver's seat.",
  },
];

const faqs = [
  {
    q: "Can I try it without signing up?",
    a: "Yes. Tap Try it free. Type a job, or use a decorating, plumbing, or electrics example. You see Standard, Better, and Premium, and a preview of the customer page under the name Your Business Name. It is not saved, and you cannot send it, until you create a free account.",
  },
  {
    q: "What does Chuffed Quotes do?",
    a: "It turns rough notes about a job into an itemised quote you can edit, then a link your customer can open.",
  },
  {
    q: "Does my customer need an account?",
    a: "No. They open the link, read the quote, pick a price if you offered more than one, and can accept or decline. They do not sign in.",
  },
  {
    q: "Can I send it on WhatsApp?",
    a: "Yes, after you sign in and save the quote. A customer link is only offered once the quote is saved online. Until then it stays in this browser.",
  },
  {
    q: "What are Standard, Better, and Premium?",
    a: "An optional set of three prices on one quote. You check each one before you send it. The customer chooses one, and that choice is what they accept. You can also send a single price.",
  },
  {
    q: "Do I have to keep the suggested prices?",
    a: "No. Change any line before the customer sees it. If a build is only a rough estimate, the quote says so.",
  },
  {
    q: "Is it free?",
    a: "Yes, during the beta, for UK trades. No card is taken, and paid plans are switched off. The first 100 people who join keep it free for 12 months.",
  },
  {
    q: "Can it be printed?",
    a: "Yes. The customer page has Print / Save PDF. The printout shows your business name, the lines, the total, and VAT when you turned VAT on. Bank details are shown after they accept, and only if you saved them.",
  },
];

const previewLines = [
  {
    description: "Thermostatic Bar Shower Kit & Riser Rail",
    qty: "1",
    rate: "£245.00",
    total: "£245.00",
  },
  {
    description: "Chrome Heated Towel Rail (1200x500mm) + Valves",
    qty: "1",
    rate: "£165.00",
    total: "£165.00",
  },
  {
    description: "Certified Plumbing Labour & System Power Flush",
    qty: "8 hrs",
    rate: "£55.00",
    total: "£440.00",
  },
];

const trades = [
  "Builders",
  "Plumbers",
  "Electricians",
  "Carpenters",
  "Roofers",
  "Painters & Decorators",
  "Landscapers",
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: site,
    description: brand.description,
    inLanguage: "en-GB",
    publisher: {
      "@type": "Person",
      name: brand.ownerName,
      email: brand.ownerEmail,
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-b from-paper via-white to-paper px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="inline-flex items-center rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-clay-800">
              Free in beta for UK trades
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.12] tracking-tight text-ink sm:text-5xl">
              Rough job notes, into a professional itemised quote, in minutes.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-700">
              Send it by a link or WhatsApp. Your customer can pick Standard, Better, or Premium,
              then accept on their phone. They do not need to log in.
            </p>
            <HomeCtas />
            <ul className="mt-5 flex flex-col gap-2 text-sm font-medium text-stone-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                Try a quote with no account
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                No card needed
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                You check every price before it is sent
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                Your customer does not need an account
              </li>
            </ul>
            <HomeVoice />
          </div>

          <figure className="min-w-0" aria-label="Example quote. Not a real customer or business.">
            <figcaption className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-stone-600 lg:text-left">
              Example of the quote your customer sees
            </figcaption>
            <div className="quote-document relative overflow-hidden rounded-2xl border border-stone-200 bg-[#fffdf8] shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-paper px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clay-700 text-white">
                    <Wrench className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-clay-800">Example</p>
                    <h2 className="truncate text-base font-bold text-ink">Premier Trade Services</h2>
                    <p className="text-xs text-stone-600">Sample quote #BB-1042. Not a real business.</p>
                  </div>
                </div>
                <span className="rounded-full border border-clay-200 bg-white px-2.5 py-1 text-xs font-semibold text-clay-800">
                  Ready to check
                </span>
              </div>

              <div className="relative space-y-6 p-4 sm:p-8">
                <div className="demo-notes pointer-events-none absolute inset-0 z-10 flex flex-col justify-center gap-3 bg-[#fffdf8] p-5 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-clay-800">Spoken in the van</p>
                  <p className="demo-line text-base font-medium text-ink">En-suite shower needs replacing.</p>
                  <p className="demo-line text-base font-medium text-ink">New thermostatic bar shower and a heated towel rail.</p>
                  <p className="demo-line text-base font-medium text-ink">About a day on site.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 border-b border-slate-100 pb-6 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Client</span>
                    <p className="mt-0.5 font-semibold text-ink">Sarah Jenkins</p>
                    <p className="text-xs text-stone-600">24 Orchard Way, Bristol</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Job</span>
                    <p className="mt-0.5 font-semibold text-ink">En-suite Shower & Radiator Replacement</p>
                    <p className="text-xs text-stone-600">Full thermostatic valve fitment, tiling prep & testing</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-sm">
                  {previewLines.map((line) => (
                    <div
                      key={line.description}
                      className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end md:gap-8"
                    >
                      <p className="font-medium leading-snug text-ink">{line.description}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Qty</p>
                          <p className="mt-0.5 whitespace-nowrap tabular-nums text-stone-700">{line.qty}</p>
                        </div>
                        <div className="min-w-0 border-l border-slate-200 pl-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Rate</p>
                          <p className="mt-0.5 whitespace-nowrap tabular-nums text-stone-700">{line.rate}</p>
                        </div>
                        <div className="min-w-0 border-l border-slate-200 pl-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total</p>
                          <p className="mt-0.5 whitespace-nowrap font-semibold tabular-nums text-ink">{line.total}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-end">
                  <div className="space-y-1 text-xs text-stone-700">
                    <p>Net £850.00</p>
                    <p>VAT at 20% £170.00</p>
                    <p className="font-semibold text-ink">Deposit 20% £204.00</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold uppercase text-stone-500">Total inc. VAT</span>
                    <p className="text-3xl font-black tabular-nums text-ink">£1,020.00</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-stone-600">
                  This sample is one price. On a real quote you can also offer Standard, Better, and Premium,
                  and the customer picks one. Sarah Jenkins and Premier Trade Services are not real.
                </p>
              </div>
            </div>
          </figure>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-stone-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Made for</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {trades.map((trade) => (
              <li
                key={trade}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700"
              >
                {trade}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="how-heading" className="text-3xl font-black tracking-tight text-ink">
            How it works
          </h2>
          <p className="mt-2 max-w-2xl text-base text-stone-700">
            Three steps, from notes on site to a quote the customer can accept.
          </p>
          <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-stone-200 bg-paper p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-clay-700 text-base font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-paper px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="features-heading" className="text-3xl font-black tracking-tight text-ink">
            What you get
          </h2>
          <p className="mt-2 max-w-2xl text-base text-stone-700">
            A short list. Nothing here needs a card, and nothing is switched on that the app does not do.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="rounded-2xl border border-stone-200 bg-white p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay-100 text-clay-800">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700">{feature.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-3xl font-black tracking-tight text-ink">
            Questions
          </h2>
          <div className="faq mt-6 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {faqs.map((item) => (
              <details key={item.q} className="group px-4 py-1 sm:px-5">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-bold text-ink">
                  <span>{item.q}</span>
                  <span className="text-xl font-normal text-clay-800 group-open:hidden" aria-hidden="true">
                    +
                  </span>
                  <span className="hidden text-xl font-normal text-clay-800 group-open:inline" aria-hidden="true">
                    –
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-stone-700">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-4 py-16 text-paper sm:px-6 lg:px-8" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-3xl">
          <h2 id="cta-heading" className="text-3xl font-black tracking-tight">
            Free in beta for UK trades
          </h2>
          <p className="mt-3 text-base leading-relaxed text-paper/90">
            Try a quote with no account. Create a free account when you want it saved, with your
            business name on it, and a link your customer can sign. No card.
          </p>
          <div className="mt-6">
            <FoundingOffer />
          </div>
          <HomeCtas tone="ink" />
          <Link
            href="/pricing"
            className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-paper underline decoration-white/40 underline-offset-4"
          >
            Read the beta offer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-paper px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-clay-700 text-lg font-black text-white">
            MB
          </div>
          <div>
            <h2 className="text-xl font-black text-ink">From Michael Boylen</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              I built {brand.name} so a job written in rough notes can become a quote a customer can
              open and accept, without an evening spent formatting it.
            </p>
            <p className="mt-3 text-xs font-bold text-ink">
              Michael Boylen · {brand.ownerEmail}
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-stone-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-stone-600 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-700 text-white">
              <Wrench className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-ink">{brand.name}</span>
            <span>— {brand.tagline}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium" aria-label="Footer">
            <Link href="/pricing" className="inline-flex min-h-11 items-center hover:text-clay-800">
              Free beta
            </Link>
            <Link href="/feedback" className="inline-flex min-h-11 items-center hover:text-clay-800">
              Feedback
            </Link>
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-clay-800">
              Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-clay-800">
              Terms
            </Link>
          </nav>
          <p>© 2026 {brand.name}. Free during the beta.</p>
        </div>
      </footer>
    </div>
  );
}
