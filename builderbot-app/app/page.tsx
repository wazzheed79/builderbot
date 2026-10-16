import Link from "next/link";
import {
  Wrench,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Smartphone,
  ShieldCheck,
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

  const features = [
    {
      icon: Clock,
      title: "Quote in Under 2 Minutes",
      desc: "Stop spending late evenings after long days on site. Type or speak the job details and generate a full quote before you leave the driveway.",
    },
    {
      icon: Sparkles,
      title: "AI Trade Estimator",
      desc: "Our model breaks down labor, material quantities, markups, and day rates automatically with accurate trade terminology.",
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
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs sm:text-sm font-semibold mb-6 border border-blue-200 shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI-Powered Quoting for Hardworking Trades</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Turn job notes into quotes in{" "}
              <span className="text-blue-600 underline decoration-blue-300 decoration-wavy decoration-2">
                under 2 minutes
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              No more losing evenings to quoting spreadsheets. Enter rough job notes
              or voice memos, and BuilderBot generates itemized, professional quotes ready to send.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/quotes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-blue-600/25 transition active:scale-[0.98]"
              >
                <span>Create Your First Quote</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-7 py-4 rounded-xl text-base border border-slate-300 shadow-xs transition"
              >
                <span>View Dashboard Demo</span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mobile & desktop ready
              </span>
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

          {/* Interactive Quote Preview Card Mockup */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
              {/* Header Bar */}
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
                    BB
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Apex Plumbing & Heating Ltd</h3>
                    <p className="text-xs text-slate-400">Quote #BB-1042 • 16 Oct 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Draft Ready
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 space-y-6">
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

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase">
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Qty/Hrs</th>
                        <th className="pb-2 text-right">Rate</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-3 font-medium text-slate-900">Thermostatic Bar Shower Kit & Riser Rail</td>
                        <td className="py-3 text-right">1</td>
                        <td className="py-3 text-right">£245.00</td>
                        <td className="py-3 text-right font-semibold">£245.00</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-slate-900">Chrome Heated Towel Rail (1200x500mm) + Valves</td>
                        <td className="py-3 text-right">1</td>
                        <td className="py-3 text-right">£165.00</td>
                        <td className="py-3 text-right font-semibold">£165.00</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-slate-900">Certified Plumbing Labor & System Power Flush</td>
                        <td className="py-3 text-right">8 hrs</td>
                        <td className="py-3 text-right">£55.00</td>
                        <td className="py-3 text-right font-semibold">£440.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals & Quick Action */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    💡 <span className="font-medium text-slate-700">AI auto-calculated:</span> 20% deposit (£170.00) required on signing.
                  </div>
                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Total Inc. VAT</span>
                      <p className="text-2xl font-black text-slate-900">£850.00</p>
                    </div>
                    <Link
                      href="/quotes"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition"
                    >
                      Try Customizing
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Builders Choose BuilderBot: Old Way vs. BuilderBot */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              The Modern Trade Advantage
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              Why Builders Choose BuilderBot
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Compare the traditional painful quoting routine with the BuilderBot workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* The Old Way */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-rose-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-rose-100">
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

            {/* With BuilderBot */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-blue-600 shadow-xl shadow-blue-600/10 relative overflow-hidden ring-4 ring-blue-500/10">
              <div className="flex items-center justify-between pb-4 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    ✓
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">With BuilderBot</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ⚡ Fast & Professional
                </span>
              </div>

              <ul className="mt-6 space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>Instant AI quotes:</strong> Itemized labor, materials, and VAT generated in seconds.</span>
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
                  <span><strong>1-Click acceptance link:</strong> Customers sign on their phone and deposits get locked in.</span>
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
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-md hover:border-blue-200 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5 font-bold">
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
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-widest">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl font-extrabold mt-2">
              From site visit to signed quote in minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Speak or Type Job Notes</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Describe the work: &ldquo;Replace 3 double sockets, fit 6 downlights, run test certificate.&rdquo;
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">AI Calculates Breakdown</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                BuilderBot splits out trade materials, estimated labor hours, and totals with standard markup.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
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
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg transition"
            >
              <span>Try Generating a Quote Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 text-sm">BuilderBot</span>
            <span>— The AI Quoting Platform for Trades</span>
          </div>
          <p>© 2026 BuilderBot. Designed for fast quoting on site.</p>
        </div>
      </footer>
    </div>
  );
}