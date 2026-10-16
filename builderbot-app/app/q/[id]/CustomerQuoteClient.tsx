"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Download,
  Share2,
  Wrench,
  Sparkles,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { getQuoteById, updateQuoteStatus, Quote } from "@/lib/storage";

export default function CustomerQuoteClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quoteId = resolvedParams.id || "BB-1042";

  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [signatureName, setSignatureName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [loadedQuote, setLoadedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const q = getQuoteById(quoteId);
    if (q) {
      setLoadedQuote(q);
      if (q.status === "Accepted") setStatus("accepted");
      else if (q.status === "Declined") setStatus("declined");
      else setStatus("pending");
    }
  }, [quoteId]);

  const quoteData = {
    id: loadedQuote?.id || quoteId || "BB-1042",
    businessName: "Apex Plumbing & Heating Ltd",
    contactName: "Mark Robinson",
    phone: "07911 123456",
    email: "mark@apexplumbing.co.uk",
    accreditations: ["Gas Safe Register #589214", "TrustMark Accredited", "£2M Public Liability Insured"],
    clientName: loadedQuote?.clientName || "Sarah Jenkins",
    clientAddress: loadedQuote?.clientAddress || "24 Orchard Way, Bristol, BS8 4EJ",
    date: loadedQuote?.createdAt || "16 Oct 2026",
    expiry: "Valid 30 Days",
    title: loadedQuote?.title || "En-suite Bathroom Renovation & Radiator Upgrade",
    scope:
      loadedQuote?.notes ||
      "Full strip out of existing shower and sanitaryware. Installation of thermostatic bar shower, 1200x500mm chrome heated towel rail, low-profile resin tray, vanity basin, pipework rerouting, testing, and licensed trade waste disposal.",
    items: loadedQuote?.items && loadedQuote.items.length > 0
      ? loadedQuote.items.map((i) => ({
          description: i.description,
          type: i.type.charAt(0).toUpperCase() + i.type.slice(1),
          amount: `£${(i.quantity * i.rate).toFixed(2)}`,
        }))
      : [
          {
            description: "Thermostatic Bar Shower Kit & Riser Rail",
            type: "Materials",
            amount: "£245.00",
          },
          {
            description: "Chrome Heated Towel Rail (1200x500mm) + Angled Valves",
            type: "Materials",
            amount: "£165.00",
          },
          {
            description: "Certified plumbing labor, waste routing & pressure testing",
            type: "Labor",
            amount: "£880.00",
          },
        ],
    subtotal: `£${(loadedQuote?.subtotal || 1665.0).toFixed(2)}`,
    vat: `£${(loadedQuote?.vat || 333.0).toFixed(2)}`,
    total: `£${(loadedQuote?.total || 1998.0).toFixed(2)}`,
    depositRequired: `£${(loadedQuote?.deposit || 399.6).toFixed(2)}`,
    depositPercent: `${loadedQuote?.depositPercent || 20}%`,
  };

  const handleConfirmAccept = () => {
    if (!signatureName.trim() || !agreedToTerms) return;
    updateQuoteStatus(quoteId, "Accepted");
    setStatus("accepted");
    setShowSignModal(false);
  };

  const handleConfirmDecline = () => {
    updateQuoteStatus(quoteId, "Declined");
    setStatus("declined");
    setShowDeclineModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner / Notice for Customer */}
        {status === "accepted" ? (
          <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl flex items-start gap-4 animate-in fade-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-white shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-black">Quote Accepted & Signed!</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Thank you, {signatureName || quoteData.clientName}. {quoteData.businessName} has received your digital acceptance. The dashboard and booking deposit receipt have been updated.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-lg font-semibold">
                  Signed & Confirmed
                </span>
                <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-lg font-semibold">
                  Deposit: {quoteData.depositRequired}
                </span>
              </div>
            </div>
          </div>
        ) : status === "declined" ? (
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-start gap-4">
            <XCircle className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold">Quote Declined</h2>
              <p className="text-slate-300 text-sm mt-1">
                You have marked this quote as declined. Feedback has been updated for {quoteData.businessName}.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-md flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-200" />
              Official Trade Quote from {quoteData.businessName}
            </span>
            <span className="bg-blue-700/80 px-2.5 py-1 rounded text-xs">
              {quoteData.expiry}
            </span>
          </div>
        )}

        {/* Main Document Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header & Trade Details */}
          <div className="p-6 sm:p-8 bg-slate-900 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Licensed Trade Contractor</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {quoteData.businessName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Proprietor: {quoteData.contactName}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {quoteData.accreditations.map((acc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-medium border border-slate-700"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {acc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quote Ref & Contact */}
              <div className="text-left sm:text-right text-xs text-slate-400 space-y-1">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-blue-400 border border-slate-700">
                  {quoteData.id}
                </span>
                <p className="pt-2 flex items-center sm:justify-end gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{quoteData.phone}</span>
                </p>
                <p className="flex items-center sm:justify-end gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{quoteData.email}</span>
                </p>
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold tracking-wider">Prepared For</span>
                <p className="text-sm font-bold text-white mt-0.5">{quoteData.clientName}</p>
                <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {quoteData.clientAddress}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold tracking-wider">Project Specification</span>
                <p className="text-sm font-bold text-white mt-0.5">{quoteData.title}</p>
                <p className="text-slate-400 mt-0.5">Date Issued: {quoteData.date}</p>
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                Scope of Work & Materials
              </h2>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-normal">
                {quoteData.scope}
              </p>
            </div>

            {/* Line Items Table */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                Itemized Cost Breakdown
              </h2>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {quoteData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-medium text-slate-900">{item.description}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals & Deposit */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Payment & Deposit Terms:</p>
                <p>• {quoteData.depositPercent} deposit ({quoteData.depositRequired}) payable upon quote acceptance.</p>
                <p>• Remaining balance due upon satisfactory completion of works.</p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-slate-900">{quoteData.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>20% VAT:</span>
                  <span className="font-medium text-slate-900">{quoteData.vat}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black">
                  <span className="text-base text-slate-900">Total Price:</span>
                  <span className="text-2xl text-blue-600">{quoteData.total}</span>
                </div>
                <div className="pt-1 flex justify-between text-xs text-emerald-700 font-bold">
                  <span>Deposit Required:</span>
                  <span>{quoteData.depositRequired}</span>
                </div>
              </div>
            </div>

            {/* Action Bar for Customer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              {status === "pending" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSignModal(true)}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Accept & Sign Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-5 rounded-xl border border-slate-300 transition"
                  >
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span>Decline</span>
                  </button>
                </>
              ) : status === "accepted" ? (
                <div className="w-full bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm text-emerald-800 font-semibold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    You accepted this quote on {quoteData.date}.
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="underline text-emerald-900 hover:text-emerald-700"
                  >
                    Download Copy
                  </button>
                </div>
              ) : (
                <div className="w-full bg-slate-100 border border-slate-300 p-4 rounded-xl text-center text-xs text-slate-600">
                  This quote has been declined. Contact {quoteData.businessName} if you wish to reopen it.
                </div>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3.5 px-4 rounded-xl text-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back to App Link */}
        <div className="text-center pt-2">
          <Link
            href="/quotes"
            className="text-xs text-slate-500 hover:text-blue-600 font-medium inline-flex items-center gap-1"
          >
            <span>← Back to BuilderBot Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Accept & Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Digital Quote Acceptance</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              By typing your legal name below, you confirm acceptance of quotation <strong>{quoteData.id}</strong> ({quoteData.total}) and agree to pay the required deposit of <strong>{quoteData.depositRequired}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                />
                <span>
                  I agree to the terms, scope of work, and deposit schedule stated in this quotation.
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={!signatureName.trim() || !agreedToTerms}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition"
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Decline Quote</span>
            </h3>

            <p className="text-xs text-slate-600">
              Please share a quick reason with {quoteData.businessName} (optional):
            </p>

            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Budget too high, postponing project, found another contractor..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Decline Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
