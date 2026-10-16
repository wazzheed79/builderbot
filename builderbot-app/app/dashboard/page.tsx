"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  getDashboardMetrics,
  getCustomers,
} from "@/lib/storage";

export default function DashboardPage() {
  const [metrics] = useState(() => getDashboardMetrics());
  const [customerCount] = useState(() => getCustomers().length);

  const stats = [
    {
      title: "Quotes Sent",
      value: metrics.sentQuotesCount.toString(),
      change: `${metrics.sentQuotesCount} awaiting decision`,
      icon: FileText,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Accepted Value",
      value: `£${metrics.totalAcceptedValue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${metrics.winRate}% win rate`,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Pending Quotes",
      value: `£${metrics.totalPendingValue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${metrics.sentQuotesCount} active in pipeline`,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200",
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
            Real-time overview of active quotes, won contract value, and customer pipeline.
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
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* Recent Quotes Section */}
      <div className="mt-10 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                          : q.status === "Sent"
                          ? "bg-blue-100 text-blue-800"
                          : q.status === "Rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/q/${q.id}`}
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
    </div>
  );
}