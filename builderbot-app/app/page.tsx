import Link from "next/link";
import { brand } from "@/lib/brand.mjs";
import FoundingOffer from "@/components/FoundingOffer";
import HomeVoice from "@/components/HomeVoice";
import {
  Wrench,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Mic,
} from "lucide-react";

export default function Home() {
  const tradePills = [
    "Builders",
    "Plumbers",
    "Electricians",
    "Carpenters",
    "Roofers",
    "Painters & Decorators",
    "Landscapers",
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
      description: "Certified Plumbing Labor & System Power Flush",
      qty: "8 hrs",
      rate: "£55.00",
      total: "£440.00",
    },
  ];

  const features = [
    {
      icon: Mic,
      title: "Talk in the van",
      desc: "About 30 seconds of plain English is enough. If the microphone is unavailable, type the same notes. You still get a quote to edit.",
    },
    {
      icon: Sparkles,
      title: "Prices you can check",
      desc: "Signed-in AI pricing runs only when an AI key is set. Otherwise you get a rough estimate, clearly labelled, and you change every figure.",
    },
    {
      icon: Smartphone,
      title: "Mobile-First for the Van",
      desc: "No fiddly small spreadsheets. Built specifically with large tap targets and fast inputs for phones and tablets on job sites.",
    },
    {
      icon: ShieldCheck,
      title: "Look Professional & Win Jobs",
      desc: "Deliver sleek, branded PDF quotes with your business logo, payment terms, and direct one-click acceptance links.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-paper via-white to-paper pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl lg:max-w-2xl">
            <FoundingOffer />

            <h1 className="mt-6 text-4xl font-black tracking-tight text-ink leading-[1.12] sm:text-5xl">
              Talk for 30 seconds in the van. Get a professional quote.
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-stone-700">
              Say the job in plain English, or type a few rough notes. {brand.name} turns them
              into a price list you can check, then a link your customer can open.
            </p>

            <HomeVoice />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-stone-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No card needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free while in testing
              </span>
              <Link href="/dashboard" className="font-semibold text-clay-800 underline">
                See an empty dashboard
              </Link>
            </div>

            {/* Trades Served */}
            <div className="mt-10 pt-8 border-t border-slate-200/80">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Tailored for every trade
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {tradePills.map((trade) => (
                  <span
                    key={trade}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    {trade}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="notes-to-quote relative mt-10 max-w-4xl mx-auto">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-stone-500">
              Rough notes, then a quote you can send
            </p>
            <div className="quote-document relative overflow-hidden rounded-2xl border border-stone-200 bg-[#fffdf8] shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-paper px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-700 text-white">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-ink">Premier Trade Services</h3>
                    <p className="text-xs text-stone-500">Quote #BB-1042</p>
                  </div>
                </div>
                <span className="rounded-full border border-clay-200 bg-white px-2.5 py-1 text-xs font-semibold text-clay-800">
                  Ready to check
                </span>
              </div>

              <div className="relative space-y-6 p-4 sm:p-8">
                <div className="demo-notes pointer-events-none absolute inset-0 z-10 flex flex-col justify-center gap-3 bg-[#fffdf8] p-5 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-clay-800">Spoken in the van</p>
                  <p className="demo-line text-base font-medium text-ink">Kitchen tap is dripping.</p>
                  <p className="demo-line text-base font-medium text-ink">Swap the tap and check the pipe.</p>
                  <p className="demo-line text-base font-medium text-ink">About an hour on site.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100 text-sm">
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Client</span>
                    <p className="font-semibold text-slate-900 mt-0.5">Sarah Jenkins</p>
                    <p className="text-slate-500 text-xs">24 Orchard Way, Bristol</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Job Description</span>
                    <p className="font-semibold text-slate-900 mt-0.5">En-suite Shower & Radiator Replacement</p>
                    <p className="text-slate-500 text-xs">Full thermostatic valve fitment, tiling prep & testing</p>
                  </div>
                </div>

                {/* Line items. Each amount has its own label and column so rate and total cannot run together. */}
                <div className="divide-y divide-slate-100 text-sm">
                  {previewLines.map((line) => (
                    <div
                      key={line.description}
                      className="py-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end md:gap-8"
                    >
                      <p className="font-medium text-slate-900 leading-snug">{line.description}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qty</p>
                          <p className="mt-0.5 tabular-nums whitespace-nowrap text-slate-700">{line.qty}</p>
                        </div>
                        <div data-price="rate" className="min-w-0 border-l border-slate-200 pl-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rate</p>
                          <p className="mt-0.5 tabular-nums whitespace-nowrap text-slate-700">{line.rate}</p>
                        </div>
                        <div data-price="total" className="min-w-0 border-l border-slate-200 pl-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                          <p className="mt-0.5 tabular-nums whitespace-nowrap font-semibold text-slate-900">{line.total}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals & Quick Action */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Net £850.00</p>
                    <p>VAT at 20% £170.00</p>
                    <p className="font-semibold text-slate-800">Deposit 20% of the total £204.00</p>
                  </div>
                  <div className="flex w-full min-w-0 flex-wrap items-end justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="text-xs uppercase font-semibold text-slate-400">Total inc. VAT</span>
                      <p className="text-2xl font-black text-slate-900">£1,020.00</p>
                    </div>
                    <Link
                      href="/quotes"
                      className="inline-flex min-h-11 items-center rounded-lg bg-clay-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-clay-800"
                    >
                      Try it with your job
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Old way compared with this product */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-clay-700 bg-clay-50 px-3 py-1 rounded-full border border-clay-200">
              The Modern Trade Advantage
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              Why trades choose {brand.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Compare the old quoting routine with the {brand.shortName} workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* The Old Way */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-rose-200/80 shadow-xs relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                    ✕
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">The Old Way</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Slow & Frustrating
                </span>
              </div>

              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Excel & Word docs:</strong> Fiddling with formatting and formulas after a long day.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Scrap paper notes:</strong> Lost measurements and scribbled notes in the van.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Hours lost at night:</strong> Typing estimates at 9:00 PM instead of spending time with family.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Chasing customers:</strong> Awkward phone tag asking &ldquo;did you get my email?&rdquo;</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Guessing margins:</strong> Forgetting waste or material markups and undercharging.</span>
                </li>
              </ul>
            </div>

            {/* With this product */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-clay-700 shadow-xl shadow-clay-700/10 relative overflow-hidden ring-4 ring-clay-600/10">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-clay-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-clay-700 text-white flex items-center justify-center font-bold text-sm">
                    ✓
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">With {brand.name}</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ⚡ Fast & Professional
                </span>
              </div>

              <ul className="mt-6 space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>A price list from your notes:</strong> You read it and change anything before the customer sees it.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>Digital customer hub:</strong> All client notes, site addresses, and quote history in one place.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>Voice quoting in your van:</strong> Speak for 30 seconds before you drive away and send it.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>Acceptance link:</strong> Customers can read the quote and sign on their phone.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>Calculated margins:</strong> Automatically protects your day rates and material markup.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Built around how trades actually work.
            </h2>
            <p className="mt-4 text-base text-slate-600">
              No complicated enterprise menus or useless settings. Just fast, accurate quoting that wins jobs and gets you paid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-md hover:border-clay-200 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-clay-100 text-clay-800 flex items-center justify-center mb-5 font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Banner */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-clay-300 font-semibold text-xs uppercase tracking-widest">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl font-extrabold mt-2">
              From site visit to signed quote in minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-clay-700 text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Speak or Type Job Notes</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Describe the work: &ldquo;Replace 3 double sockets, fit 6 downlights, run test certificate.&rdquo;
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-clay-700 text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Check the prices</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {brand.name} suggests materials, hours, and totals. You change every price before it is sent.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-clay-700 text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">Send & Track Acceptance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Share via WhatsApp, SMS, or PDF. Customer reviews and accepts from their phone.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/quotes"
              className="inline-flex items-center gap-2 bg-clay-700 hover:bg-clay-600 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg transition"
            >
              <span>Try Generating a Quote Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="py-16 sm:py-20 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-clay-700 to-clay-800 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              MB
            </div>

            <div className="space-y-3 text-center md:text-left">
              <span className="text-xs font-extrabold uppercase tracking-widest text-clay-700 bg-clay-50 px-3 py-1 rounded-full border border-clay-200">
                A Note from the Founder
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Built for Hardworking UK Tradespeople
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                &ldquo;Hi, I&apos;m Michael Boylen. I built {brand.name} because trades shouldn&apos;t have to spend the evening after a long day turning site notes into a quote.&rdquo;
              </p>
              <p className="text-xs font-bold text-slate-900 pt-1">
                — Michael Boylen, founder of {brand.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-clay-700 text-white flex items-center justify-center font-bold text-xs">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{brand.name}</span>
            <span>— {brand.tagline}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 font-medium">
            <Link href="/pricing" className="hover:text-clay-700 transition">
              Free beta
            </Link>
            <Link href="/feedback" className="hover:text-clay-700 transition">
              Feedback
            </Link>
            <Link href="/privacy" className="hover:text-clay-700 transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-clay-700 transition">
              Terms
            </Link>
          </div>
          <p>© 2026 {brand.name}. Free while in testing.</p>
        </div>
      </footer>
    </div>
  );
}