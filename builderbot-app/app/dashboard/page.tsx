"use client";

import {
  useActivityFeed,
  useClientReady,
  useCustomerList,
  useDashboardMetrics,
  useInvoiceList,
  useJobList,
  useBusinessProfile,
} from "@/lib/live-store";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  PlusCircle,
  Users,
  ChevronRight,
  ArrowUpRight,
  Eye,
  UserPlus,
  XCircle,
  Send,
  Activity,
  Printer,
} from "lucide-react";
import { loadDemoSampleData } from "@/lib/storage";
import { brand } from "@/lib/brand.mjs";
import { QuoteFollowUp } from "@/components/quotes/QuoteFollowUp";

export default function DashboardPage() {
  const ready = useClientReady();
  const profile = useBusinessProfile();
  const metrics = useDashboardMetrics();
  const customerCount = useCustomerList().length;
  const activeJobsCount = useJobList().filter(
    (job) => job.status === "Scheduled" || job.status === "In Progress"
  ).length;
  const outstandingBalance = useInvoiceList()
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const activities = useActivityFeed();

  if (!ready) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-sm text-stone-600">Loading your dashboard…</div>
    );
  }

  const stats = [
    {
      title: "Quotes Sent",
      value: (metrics.sentQuotesCount + metrics.viewedQuotesCount).toString(),
      change:
        metrics.viewedQuotesCount > 0
          ? `${metrics.viewedQuotesCount} opened by client`
          : `${metrics.sentQuotesCount} active in pipeline`,
      icon: FileText,
      color: "text-clay-700 bg-clay-50 border-clay-200",
    },
    {
      title: "Accepted Won",
      value: `£${metrics.totalAcceptedValue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${metrics.winRate}% win rate`,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Active Jobs",
      value: activeJobsCount.toString(),
      change: "On site / scheduled",
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      title: "Invoices Due",
      value: `£${outstandingBalance.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "Awaiting settlement",
      icon: Clock,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      href: "/invoices",
    },
    {
      title: "Active Customers",
      value: customerCount.toString(),
      change: "Directory synced",
      icon: Users,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Trades Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real-time overview of active quotes, won contract value, and live customer activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/flyer"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 transition"
            title="Print A5 Notice Board Flyer for Screwfix & Toolstation"
          >
            <Printer className="w-4 h-4 text-clay-700" />
            <span>Notice Board Flyer</span>
          </Link>

          <Link
            href="/quotes"
            className="inline-flex items-center gap-2 bg-clay-700 hover:bg-clay-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Quote</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const card = (
            <div
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
          const href = "href" in stat ? stat.href : "";
          return href ? (
            <Link key={idx} href={href} className="block min-h-12">
              {card}
            </Link>
          ) : (
            <div key={idx}>{card}</div>
          );
        })}
      </div>

      {/* Main Grid: Pipeline Table (8 cols) + Activity Feed (4 cols) */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recent Quotes & Pipeline (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Quotes & Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status updates from client acceptance links.</p>
            </div>
            <Link
              href="/quotes"
              className="text-xs font-semibold text-clay-700 hover:text-clay-800 flex items-center gap-1"
            >
              <span>Create new</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {metrics.recentQuotes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <h3 className="text-lg font-black text-ink">No quotes yet</h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                {brand.name} starts empty. Create a quote, or load example jobs to see how a finished one looks.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link
                  href="/quotes"
                  className="inline-flex items-center justify-center gap-2 bg-clay-700 hover:bg-clay-800 text-white font-bold px-5 py-3 rounded-xl"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create a quote
                </Link>
                <button
                  type="button"
                  onClick={() => loadDemoSampleData()}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-stone-300 bg-white font-semibold text-sm"
                >
                  Show me an example
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.recentQuotes.map((q) => (
                <div key={q.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-bold text-slate-900">{q.id}</p>
                    <p className="font-semibold text-slate-900 truncate">{q.clientName}</p>
                    <p className="text-sm text-slate-600 break-words">{q.title}</p>
                    <p className="text-xs text-slate-400">{q.createdAt}</p>
                    <QuoteFollowUp quote={q} companyName={profile.companyName} />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <p className="font-bold tabular-nums">£{q.total.toFixed(2)}</p>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                      {q.status}
                    </span>
                    <Link
                      href={`/quotes?quote=${q.id}`}
                      className="text-xs font-semibold text-clay-800 inline-flex items-center gap-1"
                    >
                      Open
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/q/${q.token || q.id}`}
                      className="text-xs font-semibold text-clay-800 inline-flex items-center gap-1"
                    >
                      Customer page
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Real-Time Activity Feed (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-clay-700" />
              <span>Live Trade Feed</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent activity recorded yet.</p>
            ) : (
              activities.map((item) => {
                let Icon = Send;
                let iconColor = "text-clay-700 bg-clay-50 border-clay-200";

                if (item.type === "quote_accepted") {
                  Icon = CheckCircle;
                  iconColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
                } else if (item.type === "quote_viewed") {
                  Icon = Eye;
                  iconColor = "text-amber-600 bg-amber-50 border-amber-200";
                } else if (item.type === "quote_rejected") {
                  Icon = XCircle;
                  iconColor = "text-rose-600 bg-rose-50 border-rose-200";
                } else if (item.type === "customer_created") {
                  Icon = UserPlus;
                  iconColor = "text-indigo-600 bg-indigo-50 border-indigo-200";
                }

                return (
                  <div key={item.id} className="flex items-start gap-3 group">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {item.relativeTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                      {item.link && (
                        <Link
                          href={item.link}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-clay-700 hover:text-clay-800 hover:underline mt-1"
                        >
                          <span>View record</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}