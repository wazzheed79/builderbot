"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPlanPrice } from "@/lib/stripe-rules.mjs";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [demoModalInfo, setDemoModalInfo] = useState<{
    open: boolean;
    planName: string;
    price: number;
    interval: string;
  } | null>(null);

  const handleSelectPlan = async (planId: "free" | "pro" | "business") => {
    if (planId === "free") {
      router.push("/quotes");
      return;
    }

    try {
      setLoadingPlan(planId);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          interval: billingCycle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start checkout. Please try again.");
        return;
      }

      if (data.url) {
        // Redirect to real Stripe Checkout
        window.location.href = data.url;
      } else if (data.demo) {
        // Stripe preview mode
        setDemoModalInfo({
          open: true,
          planName: data.plan.name,
          price: data.plan.price,
          interval: data.plan.interval,
        });
      }
    } catch (err) {
      console.error(err);
      alert("Network error starting checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header & Mission */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Phase 4: Founder Pricing Special</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Simple, Honest Pricing <br className="hidden sm:inline" />
            <span className="text-blue-600">Built for UK Tradespeople</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600">
            No expensive enterprise software. No salesman calls. Just fast, professional quotes
            from your phone that help you win more work.
          </p>

          {/* Billing Cycle Switch */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-semibold cursor-pointer ${
                billingCycle === "month" ? "text-slate-900" : "text-slate-500"
              }`}
              onClick={() => setBillingCycle("month")}
            >
              Pay Monthly
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === "month" ? "year" : "month")}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                billingCycle === "year" ? "bg-blue-600" : "bg-slate-300"
              }`}
              role="switch"
              aria-checked={billingCycle === "year"}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingCycle === "year" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

            <span
              className={`text-sm font-semibold cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "year" ? "text-slate-900" : "text-slate-500"
              }`}
              onClick={() => setBillingCycle("year")}
            >
              Pay Annually
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Save 2 Months
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* 1. Free Starter */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {SUBSCRIPTION_PLANS.free.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For trade learners and occasional quoting
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  {SUBSCRIPTION_PLANS.free.badge}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">£0</span>
                  <span className="text-slate-500 text-sm font-medium">/ forever</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Up to 5 quotes each calendar month</p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  What is included:
                </p>
                <ul className="space-y-3">
                  {SUBSCRIPTION_PLANS.free.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/quotes"
                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
              >
                Use Free Starter
              </Link>
            </div>
          </div>

          {/* 2. Pro Sole Trader (Highlighted) */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-xl p-6 sm:p-8 flex flex-col justify-between relative hover:shadow-2xl transition">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Founder Early Bird</span>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {SUBSCRIPTION_PLANS.pro.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For active builders, plumbers, sparks & roofers
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">
                  Popular
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {billingCycle === "year"
                      ? formatPlanPrice(SUBSCRIPTION_PLANS.pro.yearlyPriceGbp)
                      : formatPlanPrice(SUBSCRIPTION_PLANS.pro.monthlyPriceGbp)}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">
                    {billingCycle === "year" ? "/ year" : "/ month"}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {billingCycle === "year"
                    ? "Equivalent to just £8.25/month (billed annually)"
                    : "Cancel anytime with 1 click"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">
                  Everything in Free, plus:
                </p>
                <ul className="space-y-3">
                  {SUBSCRIPTION_PLANS.pro.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-800">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span className="font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleSelectPlan("pro")}
                disabled={loadingPlan === "pro"}
                className="w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-[0.98] transition disabled:opacity-75"
              >
                {loadingPlan === "pro" ? (
                  <span>Connecting to Stripe...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Upgrade to Pro</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 3. Business & Teams */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {SUBSCRIPTION_PLANS.business.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For multi-van trades & small contractors
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                  {SUBSCRIPTION_PLANS.business.badge}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {billingCycle === "year"
                      ? formatPlanPrice(SUBSCRIPTION_PLANS.business.yearlyPriceGbp)
                      : formatPlanPrice(SUBSCRIPTION_PLANS.business.monthlyPriceGbp)}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">
                    {billingCycle === "year" ? "/ year" : "/ month"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Up to 5 team member accounts</p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  For growing businesses:
                </p>
                <ul className="space-y-3">
                  {SUBSCRIPTION_PLANS.business.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleSelectPlan("business")}
                disabled={loadingPlan === "business"}
                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-75"
              >
                {loadingPlan === "business" ? (
                  <span>Connecting to Stripe...</span>
                ) : (
                  <span>Get Business Plan</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Trade Guarantee Banner */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Risk Guarantee</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              Try Pro for 30 Days. If it doesn&apos;t win you work, pay nothing.
            </h3>
            <p className="text-sm text-slate-300 max-w-2xl">
              We stand behind our software. If TradeMate does not save you at least 3 hours of
              paperwork in your first month, Michael will personally refund every penny.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectPlan("pro")}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition shadow-md active:scale-[0.98]"
          >
            Start 30-Day Pro Trial
          </button>
        </div>

        {/* Frequently Asked Questions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-500">
              Clear answers without technical or legal mumbo-jumbo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                Can I write this off as a business expense on my taxes?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes, 100%. Under HMRC rules, trade software subscriptions are an allowable business
                expense. You can deduct the full cost from your taxable profit on your annual Self
                Assessment or Corporation Tax return.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                Am I locked into a long contract?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never. There are zero contracts or tie-ins. If you pay monthly, you can cancel with
                a single click inside your Settings at any time, and you won&apos;t be billed another
                pence.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                How do customer card deposits work?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you send a quote via WhatsApp or email, the customer can open the link on their
                phone and tap &quot;Pay 20% Deposit&quot;. Stripe processes their card or Apple Pay safely
                and pays the money straight into your nominated UK bank account.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                Why is TradeMate so much cheaper than Tradify or Powered Now?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Older software companies have hundreds of corporate sales staff, complex bloated
                menus, and huge overheads. TradeMate is built lean by British founder Michael
                Boylen to do one thing exceptionally well: create quotes and get you paid fast.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Preview Modal (Shown when Stripe API keys are in preview/setup mode) */}
      {demoModalInfo?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Stripe Checkout Ready: {demoModalInfo.planName}
              </h3>
              <p className="text-xs text-slate-500">
                Plan amount: £{demoModalInfo.price} / {demoModalInfo.interval}
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Phase 4 Stripe Integration Active</span>
              </div>
              <p>
                The checkout endpoint responded successfully! Once your live{" "}
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">
                  STRIPE_SECRET_KEY
                </code>{" "}
                is added to your Vercel project, this button will immediately launch Stripe&apos;s
                hosted checkout page.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDemoModalInfo(null)}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
