"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Plus,
  ArrowUpRight,
  MessageCircle,
  FileText,
  CheckCircle,
  TrendingUp,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  getCustomerById,
  getCustomerMetrics,
  Customer,
} from "@/lib/storage";

export default function CustomerProfileClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id || "";
  const [customer] = useState<Customer | undefined>(() => getCustomerById(customerId));
  const [metrics] = useState(() => (customer ? getCustomerMetrics(customer.id) : null));

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <UserCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Customer Record Not Found</h1>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          The requested customer could not be found in your local or synced directory.
        </p>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>
    );
  }

  const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${customer.name}, `)}`
    : `https://wa.me/?text=${encodeURIComponent(`Hi ${customer.name}, `)}`;

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back Navigation */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </Link>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {customer.name}
              </h1>
              {customer.company && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{customer.company}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Customer since {customer.createdAt}</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Active Client</span>
            </p>
          </div>
        </div>

        {/* 1-Tap Trade Communication Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {customer.phone && (
            <>
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Call</span>
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </>
          )}

          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Email</span>
            </a>
          )}

          <Link
            href={`/quotes?customerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Quote</span>
          </Link>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Quotes Total</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalQuotes}</p>
              <p className="text-xs text-slate-500 mt-0.5">Projects quoted</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Won Value</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">£{metrics.totalWon.toFixed(2)}</p>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{metrics.winRate}% win rate</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Value</p>
              <p className="text-2xl font-black text-amber-600 mt-1">£{metrics.totalPending.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Awaiting decision</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Billed</p>
              <p className="text-2xl font-black text-slate-900 mt-1">£{metrics.totalBilled.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-0.5">All time pipeline</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Grid: Customer Details & Quote Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact & Site Notes (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Property & Contact Details
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                  Site / Property Address
                </span>
                <p className="text-slate-900 font-semibold flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{customer.address}</span>
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                  Phone Number
                </span>
                <p className="text-slate-900 font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{customer.phone || "Not provided"}</span>
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                  Email Address
                </span>
                <p className="text-slate-900 font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{customer.email || "Not provided"}</span>
                </p>
              </div>

              {customer.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1.5">
                    Tradesperson Site Notes
                  </span>
                  <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 text-amber-900 flex items-start gap-2 leading-relaxed">
                    <ClipboardList className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{customer.notes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quotes & Job History (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quotes & Project History</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological record of estimates and accepted jobs for this customer.
                </p>
              </div>

              <Link
                href={`/quotes?customerId=${customer.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Quote</span>
              </Link>
            </div>

            {metrics && metrics.quotes.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No quotes created for this customer yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create a quote in under two minutes with AI trade itemisation and send it directly via WhatsApp.
                </p>
                <Link
                  href={`/quotes?customerId=${customer.id}`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Build First Quote</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-6">Quote ID</th>
                      <th className="py-3 px-6">Job Specification</th>
                      <th className="py-3 px-6 text-right">Total (£)</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Customer Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {metrics?.quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6 font-mono font-bold text-xs text-slate-900">
                          {q.id}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm">{q.title}</p>
                          <p className="text-[11px] text-slate-400">{q.createdAt}</p>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-slate-900">
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
                          {q.status === "Accepted" && q.acceptedSignatureName && (
                            <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                              Signed: {q.acceptedSignatureName}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/q/${q.token || q.id}`}
                            className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Review Link</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
