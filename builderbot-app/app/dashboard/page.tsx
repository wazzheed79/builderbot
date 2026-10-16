"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  getDashboardMetrics,
  getCustomers,
  getJobs,
  getInvoices,
  getRecentActivityFeed,
  ActivityItem,
} from "@/lib/storage";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(() => getDashboardMetrics());
  const [customerCount, setCustomerCount] = useState(() => getCustomers().length);
  const [activeJobsCount, setActiveJobsCount] = useState(
    () => getJobs().filter((j) => j.status === "Scheduled" || j.status === "In Progress").length
  );
  const [outstandingBalance, setOutstandingBalance] = useState(() =>
    getInvoices()
      .filter((i) => i.status !== "Paid")
      .reduce((acc, i) => acc + i.balanceDue, 0)
  );
  const [activities, setActivities] = useState<ActivityItem[]>(() => getRecentActivityFeed());

  useEffect(() => {
    const handleUpdate = () => {
      setMetrics(getDashboardMetrics());
      setCustomerCount(getCustomers().length);
      setActiveJobsCount(
        getJobs().filter((j) => j.status === "Scheduled" || j.status === "In Progress").length
      );
      setOutstandingBalance(
        getInvoices()
          .filter((i) => i.status !== "Paid")
          .reduce((acc, i) => acc + i.balanceDue, 0)
      );
      setActivities(getRecentActivityFeed());
    };
    window.addEventListener("builderbot_storage_updated", handleUpdate);
    return () => window.removeEventListener("builderbot_storage_updated", handleUpdate);
  }, []);

  const stats = [
    {
      title: "Quotes Sent",
      value: (metrics.sentQuotesCount + metrics.viewedQuotesCount).toString(),
      change:
        metrics.viewedQuotesCount > 0
          ? `${metrics.viewedQuotesCount} opened by client`
          : `${metrics.sentQuotesCount} active in pipeline`,
      icon: FileText,
      color: "text-blue-600 bg-blue-50 border-blue-200",
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
        <Link
          href="/quotes"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition self-start sm:self-auto active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Quote</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
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
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Create new</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-6">Quote ID</th>
                  <th className="py-3 px-6">Client</th>
                  <th className="py-3 px-6">Job Summary</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Customer Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metrics.recentQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-xs text-slate-900">
                      {q.id}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">{q.clientName}</p>
                      <p className="text-xs text-slate-400">{q.createdAt}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-block text-xs font-medium text-slate-600 truncate max-w-xs">
                        {q.title}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900">
                      £{q.total.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          q.status === "Accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.status === "Viewed"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : q.status === "Sent"
                            ? "bg-blue-100 text-blue-800"
                            : q.status === "Rejected"
                            ? "bg-rose-100 text-rose-800"
                            : q.status === "Expired"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {q.status === "Viewed" ? "👀 Viewed" : q.status}
                      </span>
                      {q.status === "Viewed" && q.viewedAt && (
                        <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                          Opened {new Date(q.viewedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/q/${q.token || q.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Customer Page</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Real-Time Activity Feed (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
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
                let iconColor = "text-blue-600 bg-blue-50 border-blue-200";

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
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline mt-1"
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