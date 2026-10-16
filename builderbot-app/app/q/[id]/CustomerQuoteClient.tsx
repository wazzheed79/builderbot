"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Download,
  Wrench,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  getQuoteById,
  updateQuoteStatus,
  Quote,
  getBusinessProfile,
  BusinessProfile,
} from "@/lib/storage";

export default function CustomerQuoteClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quoteId = resolvedParams.id || "";

  // Lazy initialize quote from local storage
  const [loadedQuote, setLoadedQuote] = useState<Quote | undefined>(() =>
    getQuoteById(quoteId)
  );

  const [isLoadingCloud, setIsLoadingCloud] = useState(() => !getQuoteById(quoteId));

  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(() => {
    const q = getQuoteById(quoteId);
    if (q?.status === "Accepted") return "accepted";
    if (q?.status === "Rejected") return "rejected";
    return "pending";
  });

  const [signatureName, setSignatureName] = useState(
    () => getQuoteById(quoteId)?.acceptedSignatureName ?? ""
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [profile] = useState<BusinessProfile>(() => getBusinessProfile());

  // Fetch from server / Supabase for external client devices
  useEffect(() => {
    if (!loadedQuote) {
      let isMounted = true;
      fetch(`/api/quote/${quoteId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted) return;
          if (data?.quote) {
            setLoadedQuote(data.quote);
            if (data.quote.status === "Accepted") setStatus("accepted");
            if (data.quote.status === "Rejected") setStatus("rejected");
            if (data.quote.acceptedSignatureName) {
              setSignatureName(data.quote.acceptedSignatureName);
            }
          }
          setIsLoadingCloud(false);
        })
        .catch(() => {
          if (isMounted) setIsLoadingCloud(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [loadedQuote, quoteId]);

  if (isLoadingCloud) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md max-w-sm w-full text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-900">Retrieving Quotation...</p>
          <p className="text-xs text-slate-500">Connecting to secure trade link</p>
        </div>
      </div>
    );
  }

  // BUG FIX: If quote does not exist, show genuine Not Found screen instead of someone else's quote!
  if (!loadedQuote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Quote Not Found</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Quotation link &ldquo;<strong>{quoteId}</strong>&rdquo; does not exist, has expired, or has not been published yet.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Return to BuilderBot Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Contractor details from user profile
  const contractorName = profile.companyName || "Trade Contractor Services";
  const contactPhone = profile.phone || "+44 7000 000000";
  const contactEmail = profile.email || "quotes@contractor.co.uk";

  const handleConfirmAccept = () => {
    if (!signatureName.trim() || !agreedToTerms) return;

    const trimmedName = signatureName.trim();
    const updated = updateQuoteStatus(quoteId, "Accepted", {
      signatureName: trimmedName,
    });

    if (updated) {
      setLoadedQuote(updated);
    } else if (loadedQuote) {
      setLoadedQuote({
        ...loadedQuote,
        status: "Accepted",
        acceptedSignatureName: trimmedName,
        acceptedAt: new Date().toISOString(),
      });
    }
    setStatus("accepted");

    fetch(`/api/quote/${quoteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "Accepted",
        signatureName: trimmedName,
      }),
    }).catch(() => {});

    setShowSignModal(false);
  };

  const handleConfirmDecline = () => {
    const trimmedReason = declineReason.trim();
    const updated = updateQuoteStatus(quoteId, "Rejected", {
      reason: trimmedReason,
    });

    if (updated) {
      setLoadedQuote(updated);
    } else if (loadedQuote) {
      setLoadedQuote({
        ...loadedQuote,
        status: "Rejected",
        rejectedReason: trimmedReason,
        rejectedAt: new Date().toISOString(),
      });
    }
    setStatus("rejected");

    fetch(`/api/quote/${quoteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "Rejected",
        reason: trimmedReason,
      }),
    }).catch(() => {});

    setShowDeclineModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner / Notice for Customer */}
        {status === "accepted" ? (
          <div className="bg-emerald-600 text-white p-6 sm:p-7 rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-white shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-black">Quote Accepted & Signed!</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  Thank you, {signatureName || loadedQuote.clientName}. Your digital acceptance has been confirmed with {contractorName}.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-lg font-semibold">
                    Signed: {loadedQuote.acceptedSignatureName || signatureName}
                  </span>
                  <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-lg font-semibold">
                    Deposit Due: £{loadedQuote.deposit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {profile.bankAccountNumber && (
              <div className="bg-emerald-700/60 border border-emerald-500/40 rounded-xl p-4 text-xs space-y-2">
                <p className="font-bold text-emerald-100 uppercase tracking-wider text-[11px]">
                  Deposit Payment Instructions (Bank Transfer):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono">
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Bank</span>
                    <span className="text-white font-bold">{profile.bankName || "Commercial Bank"}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Sort Code</span>
                    <span className="text-white font-bold">{profile.bankSortCode || "20-00-00"}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Account No</span>
                    <span className="text-white font-bold">{profile.bankAccountNumber}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Reference</span>
                    <span className="text-white font-bold">{loadedQuote.id}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : status === "rejected" ? (
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-start gap-4">
            <XCircle className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold">Quote Declined</h2>
              <p className="text-slate-300 text-sm mt-1">
                You have marked this quote as declined. Feedback has been sent to the contractor.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-md flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-200" />
              Official Trade Quotation #{loadedQuote.id}
            </span>
            <span className="bg-blue-700/80 px-2.5 py-1 rounded text-xs">
              Valid for {profile.quoteValidityDays || 30} Days
            </span>
          </div>
        )}

        {/* Main Document Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header & Contractor Details */}
          <div className="p-6 sm:p-8 bg-slate-900 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{profile.trade || "Licensed Trade Contractor"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {contractorName}
                </h1>
                {profile.tradingName && (
                  <p className="text-xs text-blue-300 font-medium">{profile.tradingName}</p>
                )}
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Quotation Ref: {loadedQuote.id}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {profile.accreditations && profile.accreditations.length > 0 ? (
                    profile.accreditations.map((acc, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-emerald-300 px-2.5 py-1 rounded-md font-semibold border border-slate-700"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {acc}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-medium border border-slate-700">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Direct Trade Quotation
                    </span>
                  )}
                  {profile.vatRegistered && profile.vatNumber && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md font-mono border border-slate-700">
                      VAT: {profile.vatNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Contractor Contact */}
              <div className="text-left sm:text-right text-xs text-slate-400 space-y-1">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-blue-400 border border-slate-700">
                  {loadedQuote.id}
                </span>
                <p className="pt-2 flex items-center sm:justify-end gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{contactPhone}</span>
                </p>
                <p className="flex items-center sm:justify-end gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{contactEmail}</span>
                </p>
                {profile.address && (
                  <p className="flex items-center sm:justify-end gap-1.5 text-slate-400 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{profile.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold tracking-wider">Prepared For</span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {loadedQuote.clientName} {loadedQuote.clientCompany ? `(${loadedQuote.clientCompany})` : ""}
                </p>
                <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {loadedQuote.clientAddress}
                </p>
                {loadedQuote.clientPhone && (
                  <p className="text-slate-400 flex items-center gap-1 mt-0.5 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {loadedQuote.clientPhone}
                  </p>
                )}
                {loadedQuote.clientEmail && (
                  <p className="text-slate-400 flex items-center gap-1 mt-0.5 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {loadedQuote.clientEmail}
                  </p>
                )}
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold tracking-wider">Project Specification</span>
                <p className="text-sm font-bold text-white mt-0.5">{loadedQuote.title}</p>
                <p className="text-slate-400 mt-0.5">Date Issued: {loadedQuote.createdAt}</p>
                {profile.ownerName && (
                  <p className="text-slate-400 mt-0.5 text-[11px]">Estimator: {profile.ownerName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="p-6 sm:p-8 space-y-6">
            {loadedQuote.notes && (
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Scope of Work & Specification
                </h2>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-normal">
                  {loadedQuote.notes}
                </p>
              </div>
            )}

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
                    {loadedQuote.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-medium text-slate-900">{item.description}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                          £{(item.quantity * item.rate).toFixed(2)}
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
                <p>• {loadedQuote.depositPercent ?? 20}% deposit (£{loadedQuote.deposit.toFixed(2)}) required upon quote acceptance.</p>
                <p>• Remaining balance due upon completion of works.</p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-slate-900">£{loadedQuote.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>20% VAT:</span>
                  <span className="font-medium text-slate-900">£{loadedQuote.vat.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black">
                  <span className="text-base text-slate-900">Total Price:</span>
                  <span className="text-2xl text-blue-600">£{loadedQuote.total.toFixed(2)}</span>
                </div>
                <div className="pt-1 flex justify-between text-xs text-emerald-700 font-bold">
                  <span>Deposit Required:</span>
                  <span>£{loadedQuote.deposit.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions Note */}
            {profile.termsAndConditions && (
              <div className="pt-4 border-t border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Contractor Terms & Warranty Conditions
                </span>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {profile.termsAndConditions}
                </p>
              </div>
            )}

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
                    Accepted & signed by {loadedQuote.acceptedSignatureName || signatureName}.
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="underline text-emerald-900 hover:text-emerald-700"
                  >
                    Print Receipt
                  </button>
                </div>
              ) : (
                <div className="w-full bg-slate-100 border border-slate-300 p-4 rounded-xl text-center text-xs text-slate-600">
                  This quote has been declined. Contact the contractor if you wish to adjust scope.
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
              By typing your legal name below, you confirm acceptance of quotation <strong>{loadedQuote.id}</strong> (£{loadedQuote.total.toFixed(2)}) and agree to the required deposit of <strong>£{loadedQuote.deposit.toFixed(2)}</strong>.
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
              Please share a quick reason with the contractor (optional):
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
