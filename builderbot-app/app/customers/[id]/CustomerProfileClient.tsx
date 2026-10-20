"use client";

import { useState, use, useMemo } from "react";
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
  UserCheck,
  Wrench,
  Receipt,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  Job,
  Invoice,
  Quote,
  saveJob,
  deleteJob,
  saveInvoice,
  convertQuoteToInvoice,
} from "@/lib/storage";
import { getWhatsAppShareUrl, getWhatsAppInvoiceShareUrl } from "@/lib/share";
import { QuoteFollowUp } from "@/components/quotes/QuoteFollowUp";
import {
  useClientReady,
  useCustomerList,
  useQuoteList,
  useJobList,
  useInvoiceList,
  useBusinessProfile,
  useSiteOrigin,
} from "@/lib/live-store";

export default function CustomerProfileClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id || "";
  const ready = useClientReady();
  const siteOrigin = useSiteOrigin();
  const customer = useCustomerList().find((item) => item.id === customerId);
  const businessProfile = useBusinessProfile();
  const allQuotes = useQuoteList();
  const allJobs = useJobList();
  const allInvoices = useInvoiceList();

  // Tabs: quotes | jobs | invoices
  const [activeTab, setActiveTab] = useState<"quotes" | "jobs" | "invoices">("quotes");

  // Jobs and Invoices state
  const jobs = useMemo(
    () => allJobs.filter((job) => job.customerId === customerId),
    [allJobs, customerId]
  );
  const invoices = useMemo(
    () => allInvoices.filter((invoice) => invoice.customerId === customerId),
    [allInvoices, customerId]
  );
  const metrics = useMemo(() => {
    const quotes = allQuotes.filter(
      (quote) =>
        quote.customerId === customerId ||
        (customer ? quote.clientName.toLowerCase() === customer.name.toLowerCase() : false)
    );
    const accepted = quotes.filter((quote) => quote.status === "Accepted");
    const decided = quotes.filter((quote) => quote.status === "Accepted" || quote.status === "Rejected").length;
    const totalWon = accepted.reduce((sum, quote) => sum + quote.total, 0);
    return {
      totalQuotes: quotes.length,
      totalWon,
      winRate: decided > 0 ? Math.round((accepted.length / decided) * 100) : 0,
      quotes,
    };
  }, [allQuotes, customer, customerId]);

  // Modal / Creator states
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobAddress, setNewJobAddress] = useState("");
  const [newJobStatus, setNewJobStatus] = useState<Job["status"]>("Scheduled");
  const [newJobNotes, setNewJobNotes] = useState("");
  const [newJobQuoteId, setNewJobQuoteId] = useState("");

  // Toast / Feedback message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!ready) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-sm text-stone-600">Loading customer…</div>;
  }

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
          className="inline-flex items-center gap-2 bg-clay-700 hover:bg-clay-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition"
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

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;

    saveJob({
      customerId: customer.id,
      title: newJobTitle.trim(),
      address: newJobAddress.trim() || customer.address,
      status: newJobStatus,
      notes: newJobNotes.trim(),
      quoteId: newJobQuoteId || undefined,
    });

    setShowAddJobModal(false);
    setNewJobTitle("");
    setNewJobNotes("");
    setNewJobQuoteId("");
    setActionNotice("New job scheduled successfully.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleJobStatusChange = (job: Job, newStatus: Job["status"]) => {
    saveJob({
      ...job,
      status: newStatus,
    });
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm("Are you sure you want to delete this job record?")) {
      deleteJob(jobId);
    }
  };

  const handleConvertQuoteToInvoice = (quote: Quote, depositOnly: boolean = false) => {
    const inv = convertQuoteToInvoice(quote, depositOnly);
    setActiveTab("invoices");
    setActionNotice(`Invoice ${inv.id} generated from quote ${quote.id}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleMarkInvoicePaid = (inv: Invoice) => {
    saveInvoice({
      ...inv,
      status: "Paid",
      depositPaid: inv.total,
      balanceDue: 0,
      paidAt: new Date().toISOString(),
    });
    setActionNotice(`Invoice ${inv.id} marked as fully settled.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-clay-700 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-clay-700 hover:bg-clay-800 text-white shadow-sm transition active:scale-[0.98]"
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
            <div className="w-12 h-12 rounded-xl bg-clay-50 border border-clay-200 flex items-center justify-center text-clay-700">
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
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Jobs</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {jobs.filter((j) => j.status === "Scheduled" || j.status === "In Progress").length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{jobs.length} total on record</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Wrench className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoiced</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                £{invoices.reduce((acc, i) => acc + i.total, 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{invoices.length} invoices issued</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Grid: Customer Details & Multi-Tab Pipeline */}
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

        {/* Right Column: Interactive Tabs for Quotes, Jobs & Invoices (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation Pill Bar */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-3 gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab("quotes")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === "quotes"
                  ? "bg-clay-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Quotes</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "quotes" ? "bg-clay-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {metrics?.quotes.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === "jobs"
                  ? "bg-clay-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span className="truncate">Jobs</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "jobs" ? "bg-clay-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {jobs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invoices")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === "invoices"
                  ? "bg-clay-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span className="truncate">Invoices</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "invoices" ? "bg-clay-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {invoices.length}
              </span>
            </button>
          </div>

          {/* TAB 1: QUOTES */}
          {activeTab === "quotes" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quotes & Project History</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological record of estimates and accepted quotes for this customer.
                  </p>
                </div>

                <Link
                  href={`/quotes?customerId=${customer.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-clay-700 hover:text-clay-800 bg-clay-50 px-3 py-1.5 rounded-lg transition"
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
                    className="inline-flex items-center gap-1.5 bg-clay-700 hover:bg-clay-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Build First Quote</span>
                  </Link>
                </div>
              ) : (
                <div className="stack-table">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="py-3 px-6">Quote ID</th>
                        <th className="py-3 px-6">Job Specification</th>
                        <th className="py-3 px-6 text-right">Total (£)</th>
                        <th className="py-3 px-6 text-center">Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
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
                                  ? "bg-clay-100 text-clay-800"
                                  : q.status === "Rejected"
                                  ? "bg-rose-100 text-rose-800"
                                  : q.status === "Expired"
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {q.status === "Viewed" ? "👀 Viewed" : q.status}
                            </span>
                            {q.status === "Accepted" && q.acceptedSignatureName && (
                              <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                                Signed: {q.acceptedSignatureName}
                              </span>
                            )}
                            <QuoteFollowUp quote={q} companyName={businessProfile.companyName} />
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                            {/* Convert to Invoice Button when Accepted */}
                            {q.status === "Accepted" && (
                              <button
                                type="button"
                                onClick={() => handleConvertQuoteToInvoice(q, false)}
                                title="Convert accepted quote to tax invoice"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Invoice</span>
                              </button>
                            )}

                            <a
                              href={getWhatsAppShareUrl(
                                {
                                  quoteId: q.id,
                                  token: q.token,
                                  clientName: customer.name,
                                  clientPhone: customer.phone,
                                  quoteTitle: q.title,
                                  companyName: businessProfile.companyName,
                                  contractorName: businessProfile.ownerName,
                                  total: q.total,
                                  deposit: q.deposit,
                                  depositPercent: q.depositPercent,
                                },
                                siteOrigin
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Send or follow up quote via WhatsApp"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg inline-flex items-center transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            <Link
                              href={`/q/${q.token || q.id}`}
                              className="text-xs font-semibold text-clay-700 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Review</span>
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
          )}

          {/* TAB 2: JOBS */}
          {activeTab === "jobs" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Active & Scheduled Jobs</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track site progress from quote to scheduled works and final completion.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddJobModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-clay-700 hover:bg-clay-800 px-3.5 py-2 rounded-xl transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Job</span>
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No active jobs recorded</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Schedule a site visit, track bathroom/kitchen refits, or organize fence installation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddJobModal(true)}
                    className="inline-flex items-center gap-1.5 bg-clay-700 hover:bg-clay-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Job</span>
                  </button>
                </div>
              ) : (
                <div className="p-5 sm:p-6 grid grid-cols-1 gap-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition space-y-3 bg-slate-50/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">{job.id}</span>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{job.title}</h3>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{job.address}</span>
                          </p>
                        </div>

                        {/* Interactive Status Selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={job.status}
                            onChange={(e) => handleJobStatusChange(job, e.target.value as Job["status"])}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                              job.status === "In Progress"
                                ? "bg-clay-50 text-clay-800 border-clay-200"
                                : job.status === "Scheduled"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : job.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : job.status === "Invoiced"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            <option value="Quoted">Quoted</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Invoiced">Invoiced</option>
                          </select>
                        </div>
                      </div>

                      {job.notes && (
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                          {job.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-400 text-[11px]">Logged on {job.createdAt}</span>

                        <div className="flex items-center gap-3">
                          {job.quoteId ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              Quote: {job.quoteId}
                            </span>
                          ) : (
                            <Link
                              href={`/quotes?customerId=${customer.id}&title=${encodeURIComponent(job.title)}`}
                              className="text-clay-700 font-bold hover:underline flex items-center gap-1 text-xs"
                            >
                              <span>Build Quote</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVOICES */}
          {activeTab === "invoices" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Invoices & Payment Tracking</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track stage payments, deposit receipts, and send WhatsApp payment requests.
                  </p>
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No invoices issued for this customer</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When a customer accepts a quotation, convert it directly to an invoice with one tap.
                  </p>
                </div>
              ) : (
                <div className="stack-table">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="py-3 px-6">Invoice #</th>
                        <th className="py-3 px-6">Description</th>
                        <th className="py-3 px-6 text-right">Total (£)</th>
                        <th className="py-3 px-6 text-right">Balance Due</th>
                        <th className="py-3 px-6 text-center">Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-6 font-mono font-bold text-xs text-slate-900">
                            {inv.id}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{inv.title}</p>
                            <p className="text-[11px] text-slate-400">Due: {inv.dueDate}</p>
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-slate-900">
                            £{inv.total.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-right font-black text-slate-900">
                            £{inv.balanceDue.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                inv.status === "Paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : inv.status === "Partially Paid"
                                  ? "bg-clay-100 text-clay-800"
                                  : inv.status === "Overdue"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                            {inv.status !== "Paid" && (
                              <button
                                type="button"
                                onClick={() => handleMarkInvoicePaid(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Mark Paid</span>
                              </button>
                            )}

                            <a
                              href={getWhatsAppInvoiceShareUrl({
                                invoiceId: inv.id,
                                clientName: customer.name,
                                clientPhone: customer.phone,
                                title: inv.title,
                                companyName: businessProfile.companyName,
                                contractorName: businessProfile.ownerName,
                                total: inv.total,
                                balanceDue: inv.balanceDue,
                                dueDate: inv.dueDate,
                                bankName: businessProfile.bankName,
                                bankSortCode: businessProfile.bankSortCode,
                                bankAccountNumber: businessProfile.bankAccountNumber,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Send invoice reminder via WhatsApp"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg inline-flex items-center transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-clay-700" />
                <span>Schedule New Job</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddJobModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Job Title / Specification *
                </label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Master ensuite bathroom refit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site / Work Address
                </label>
                <input
                  type="text"
                  value={newJobAddress}
                  onChange={(e) => setNewJobAddress(e.target.value)}
                  placeholder="Property address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newJobStatus}
                    onChange={(e) => setNewJobStatus(e.target.value as Job["status"])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="Quoted">Quoted</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link Existing Quote
                  </label>
                  <select
                    value={newJobQuoteId}
                    onChange={(e) => setNewJobQuoteId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  >
                    <option value="">None / Standalone</option>
                    {metrics?.quotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.id} - £{q.total.toFixed(0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site Notes / Access Instructions
                </label>
                <textarea
                  rows={3}
                  value={newJobNotes}
                  onChange={(e) => setNewJobNotes(e.target.value)}
                  placeholder="e.g. Side gate code 1234, materials delivered Tuesday 8am..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-clay-700 hover:bg-clay-800 rounded-xl shadow-md transition"
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
