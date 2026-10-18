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
  Clock,
  Share2,
  Receipt,
  Camera,
  MessageSquare,
} from "lucide-react";
import {
  getQuoteById,
  updateQuoteStatus,
  markQuoteViewed,
  Quote,
  Invoice,
  convertQuoteToInvoice,
  BusinessProfile,
  calculateQuoteExpiry,
} from "@/lib/storage";
import QuoteQrCode from "@/components/quotes/QuoteQrCode";
import { getWhatsAppShareUrl } from "@/lib/share";
import { brand } from "@/lib/brand.mjs";
import {
  useBusinessProfile,
  useClientReady,
  useInvoiceList,
  useQuoteList,
  useSiteOrigin,
} from "@/lib/live-store";

function viewStatus(quote: Quote | undefined, remoteExpired: boolean) {
  if (!quote) return "pending" as const;
  if (quote.status === "Accepted") return "accepted" as const;
  if (quote.status === "Rejected") return "rejected" as const;
  if (quote.status === "Expired" || remoteExpired) return "expired" as const;
  return "pending" as const;
}

export default function CustomerQuoteClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quoteId = resolvedParams.id || "";
  const siteOrigin = useSiteOrigin();
  const ready = useClientReady();
  const quotes = useQuoteList();
  const invoices = useInvoiceList();
  const profile = useBusinessProfile();
  const storedQuote = quotes.find((q) => {
    const lower = quoteId.toLowerCase();
    return q.id.toLowerCase() === lower || q.token.toLowerCase() === lower;
  });

  const [quoteOverride, setQuoteOverride] = useState<Quote | undefined>(undefined);
  const [cloudQuote, setCloudQuote] = useState<Quote | undefined>(undefined);
  const [cloudSettled, setCloudSettled] = useState(false);
  const [remoteExpired, setRemoteExpired] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedModalPhoto, setSelectedModalPhoto] = useState<string | null>(null);
  const [serverContractor, setServerContractor] = useState<Partial<BusinessProfile> | null>(null);
  const [invoiceOverride, setInvoiceOverride] = useState<Invoice | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const loadedQuote = quoteOverride ?? cloudQuote ?? storedQuote;
  const status = viewStatus(loadedQuote, remoteExpired);
  const createdInvoice =
    invoiceOverride ??
    (loadedQuote ? invoices.find((invoice) => invoice.quoteId === loadedQuote.id) ?? null : null);

  const handleCreateInvoice = () => {
    if (!loadedQuote) return;
    setInvoiceOverride(convertQuoteToInvoice(loadedQuote, false));
  };

  // Fetch from server / Supabase for external client devices
  useEffect(() => {
    if (!ready || storedQuote || quoteOverride) return;
    let isMounted = true;
    fetch(`/api/quote/${quoteId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.quote) {
          setCloudQuote(data.quote);
          if (data.isExpired) setRemoteExpired(true);
          if (data.quote.acceptedSignatureName) {
            setSignatureName(data.quote.acceptedSignatureName);
          }
          if (data.contractor) {
            setServerContractor(data.contractor);
          }
        }
        setCloudSettled(true);
      })
      .catch(() => {
        if (isMounted) setCloudSettled(true);
      });

    return () => {
      isMounted = false;
    };
  }, [ready, storedQuote, quoteOverride, quoteId]);

  // Mark quote as Viewed when customer opens the link
  useEffect(() => {
    if (loadedQuote && loadedQuote.status === "Sent") {
      markQuoteViewed(loadedQuote.id);
    }
  }, [loadedQuote]);

  if (!ready || (!loadedQuote && !cloudSettled)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md max-w-sm w-full text-center space-y-3">
          <Loader2 className="w-8 h-8 text-clay-700 animate-spin mx-auto" />
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
              className="text-xs font-semibold text-clay-700 hover:underline"
            >
              Return to {brand.name}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeProfile: BusinessProfile = serverContractor
    ? ({ ...profile, ...serverContractor } as BusinessProfile)
    : profile;
  const contractorName = activeProfile.companyName || "Trade Contractor Services";
  const contactPhone = activeProfile.phone || "+44 7000 000000";
  const contactEmail = activeProfile.email || "quotes@contractor.co.uk";

  const expiry = calculateQuoteExpiry(
    loadedQuote.createdAt,
    activeProfile.quoteValidityDays || 30
  );
  const quoteLiveUrl = `${siteOrigin}/q/${loadedQuote.token || loadedQuote.id}`;

  const handleConfirmAccept = async () => {
    if (!loadedQuote || !signatureName.trim() || !agreedToTerms) return;

    const trimmedName = signatureName.trim();
    const localQuote = getQuoteById(quoteId);
    setDecisionError(null);

    if (localQuote) {
      const updated = updateQuoteStatus(quoteId, "Accepted", {
        signatureName: trimmedName,
      });
      if (!updated) {
        setDecisionError("This quote cannot be accepted. Drafts and expired quotes stay unsigned.");
        return;
      }
      setQuoteOverride(updated);
      setShowSignModal(false);
      fetch(`/api/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Accepted", signatureName: trimmedName }),
      }).catch(() => {});
      return;
    }

    try {
      const res = await fetch(`/api/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Accepted", signatureName: trimmedName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDecisionError(data.error || "This quote cannot be accepted.");
        return;
      }
      setQuoteOverride({
        ...loadedQuote,
        status: "Accepted",
        acceptedSignatureName: trimmedName,
        acceptedAt: new Date().toISOString(),
      });
      setShowSignModal(false);
    } catch {
      setDecisionError("Could not reach the quote. Nothing was signed.");
    }
  };

  const handleConfirmDecline = async () => {
    if (!loadedQuote) return;
    const trimmedReason = declineReason.trim();
    const localQuote = getQuoteById(quoteId);
    setDecisionError(null);

    if (localQuote) {
      const updated = updateQuoteStatus(quoteId, "Rejected", { reason: trimmedReason });
      if (!updated) {
        setDecisionError("This quote cannot be declined from its current status.");
        return;
      }
      setQuoteOverride(updated);
      setShowDeclineModal(false);
      fetch(`/api/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected", reason: trimmedReason }),
      }).catch(() => {});
      return;
    }

    try {
      const res = await fetch(`/api/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected", reason: trimmedReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDecisionError(data.error || "This quote cannot be declined.");
        return;
      }
      setQuoteOverride({
        ...loadedQuote,
        status: "Rejected",
        rejectedReason: trimmedReason,
        rejectedAt: new Date().toISOString(),
      });
      setShowDeclineModal(false);
    } catch {
      setDecisionError("Could not reach the quote. Nothing was changed.");
    }
  };

  const handleRequestChanges = () => {
    if (!loadedQuote) return;
    const cleanPhone = contactPhone.replace(/[^0-9+]/g, "");
    const message = encodeURIComponent(
      `Hi ${contractorName}, I am reviewing quotation #${loadedQuote.id} (${loadedQuote.title || "Trade Work"}). Could we discuss a small question or adjustment to the scope?`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    } else {
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Question regarding Quote #${loadedQuote.id}`)}&body=${message}`;
    }
  };

  return (
    <div className="min-h-screen bg-paper py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner / Notice for Customer */}
        <div className="no-print space-y-4">
        {/* Customer Job Progress Stepper */}
        {status !== "rejected" && status !== "expired" && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Job Progress Tracker</span>
              <span className="font-semibold text-slate-500">
                {status === "accepted"
                  ? "Signed"
                  : "Waiting for your review"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-[11px] font-bold text-slate-900 leading-tight">1. Prepared</span>
                <span className="text-[10px] text-slate-400 hidden sm:block">By {contractorName}</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-clay-100 text-clay-800 flex items-center justify-center font-bold text-xs mb-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-clay-700" />
                </div>
                <span className="text-[11px] font-bold text-slate-900 leading-tight">2. Viewed</span>
                <span className="text-[10px] text-slate-400 hidden sm:block">Under Review</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 shadow-xs transition ${
                    status === "accepted"
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20"
                      : "bg-clay-700 text-white ring-4 ring-clay-100 animate-pulse"
                  }`}
                >
                  {status === "accepted" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span>3</span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold leading-tight ${
                    status === "accepted" ? "text-slate-900" : "text-clay-700"
                  }`}
                >
                  3. {status === "accepted" ? "Accepted" : "Sign & Accept"}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  {status === "accepted" ? "Signed" : "Your decision"}
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 shadow-xs ${
                    status === "accepted"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <span>4</span>
                </div>
                <span
                  className={`text-[11px] font-bold leading-tight ${
                    status === "accepted" ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  4. Scheduled
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  {status === "accepted" ? "Booking Confirmed" : "Start Date Agreed"}
                </span>
              </div>
            </div>
          </div>
        )}

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

            {status === "accepted" && activeProfile.bankAccountNumber && (
              <div className="bg-emerald-700/60 border border-emerald-500/40 rounded-xl p-4 text-xs space-y-2">
                <p className="font-bold text-emerald-100 uppercase tracking-wider text-[11px]">
                  Deposit Payment Instructions (Bank Transfer):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono">
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Bank</span>
                    <span className="text-white font-bold">{activeProfile.bankName || "Commercial Bank"}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Sort Code</span>
                    <span className="text-white font-bold">{activeProfile.bankSortCode || "20-00-00"}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Account No</span>
                    <span className="text-white font-bold">{activeProfile.bankAccountNumber}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Reference</span>
                    <span className="text-white font-bold">{loadedQuote.id}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : status === "expired" ? (
          <div className="bg-amber-600 text-white p-6 rounded-2xl shadow-xl flex items-start gap-4">
            <Clock className="w-8 h-8 text-white shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold">Quotation Expired</h2>
              <p className="text-amber-100 text-sm mt-1">
                This quotation was valid for {activeProfile.quoteValidityDays || 30} days and has expired. Please contact {contractorName} to request updated pricing.
              </p>
            </div>
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
          <div className="bg-clay-700 text-white px-5 py-3 rounded-xl shadow-md flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-clay-100" />
              Official Trade Quotation #{loadedQuote.id}
            </span>
            <span className="bg-clay-800 px-2.5 py-1 rounded text-xs">
              Valid for {activeProfile.quoteValidityDays || 30} Days
            </span>
          </div>
        )}
        </div>

        {/* Main Document Card */}
        <div className="quote-document bg-[#fffdf8] rounded-2xl shadow-xl border border-stone-200 border-t-8 border-t-clay-700 overflow-hidden print-page">
          {/* Header & Contractor Details */}
          <div className="p-6 sm:p-8 bg-[#fffdf8] text-ink border-b border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-stone-200">
              <div className="flex items-start gap-4">
                {activeProfile.logoUrl && (
                  <div className="w-16 h-16 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProfile.logoUrl}
                      alt={contractorName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay-50 text-clay-800 text-xs font-bold border border-clay-200 mb-2">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{profile.trade || "Licensed Trade Contractor"}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-ink">
                    {contractorName}
                  </h1>
                {profile.tradingName && (
                  <p className="text-xs text-clay-800 font-medium">{profile.tradingName}</p>
                )}
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Quotation Ref: {loadedQuote.id}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {activeProfile.accreditations && activeProfile.accreditations.length > 0 ? (
                    activeProfile.accreditations.map((acc, i) => {
                      const lower = acc.toLowerCase();
                      const isGasSafe = lower.includes("gas safe");
                      const isElectric = lower.includes("niceic") || lower.includes("part p") || lower.includes("elecsa");
                      const isWaste = lower.includes("waste carrier") || lower.includes("environment agency");

                      const badgeClasses = isGasSafe
                        ? "bg-amber-50 text-amber-900 border-amber-300"
                        : isElectric
                        ? "bg-sky-50 text-sky-900 border-sky-200"
                        : isWaste
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-stone-50 text-stone-800 border-stone-200";

                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md font-bold border shadow-xs ${badgeClasses}`}
                        >
                          {isGasSafe || isElectric || isWaste ? null : (
                            <ShieldCheck className="w-3.5 h-3.5 text-clay-700" />
                          )}
                          <span>{acc}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-stone-50 text-stone-700 px-2.5 py-1 rounded-md font-medium border border-stone-200">
                      <ShieldCheck className="w-3 h-3 text-clay-700" />
                      Direct Trade Quotation
                    </span>
                  )}
                  {activeProfile.vatRegistered && activeProfile.vatNumber && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-stone-50 text-stone-800 px-2.5 py-1 rounded-md font-mono font-bold border border-stone-200">
                      VAT: {activeProfile.vatNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contractor Contact */}
              <div className="sm:text-right space-y-1">
                <div className="flex flex-wrap items-center sm:justify-end gap-1.5 pb-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-clay-50 text-clay-800 border border-clay-200">
                    {loadedQuote.id}
                  </span>
                  {expiry.isExpired ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                      <Clock className="w-3 h-3 text-red-700" />
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-700" />
                      Valid: {expiry.daysLeft}d left
                    </span>
                  )}
                </div>
                <p className="pt-2 flex items-center sm:justify-end gap-1.5 text-stone-700">
                  <Phone className="w-3.5 h-3.5 text-clay-700" />
                  <span>{contactPhone}</span>
                </p>
                <p className="flex items-center sm:justify-end gap-1.5 text-stone-700">
                  <Mail className="w-3.5 h-3.5 text-clay-700" />
                  <span>{contactEmail}</span>
                </p>
                {profile.address && (
                  <p className="flex items-center sm:justify-end gap-1.5 text-stone-500 text-[11px]">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{profile.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-500 uppercase font-bold tracking-wider">Prepared For</span>
                <p className="text-sm font-bold text-ink mt-0.5">
                  {loadedQuote.clientName} {loadedQuote.clientCompany ? `(${loadedQuote.clientCompany})` : ""}
                </p>
                <p className="text-stone-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {loadedQuote.clientAddress}
                </p>
                {loadedQuote.clientPhone && (
                  <p className="text-stone-600 flex items-center gap-1 mt-0.5 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {loadedQuote.clientPhone}
                  </p>
                )}
                {loadedQuote.clientEmail && (
                  <p className="text-stone-600 flex items-center gap-1 mt-0.5 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    {loadedQuote.clientEmail}
                  </p>
                )}
              </div>
              <div>
                <span className="text-stone-500 uppercase font-bold tracking-wider">Project Specification</span>
                <p className="text-sm font-bold text-ink mt-0.5">{loadedQuote.title}</p>
                <p className="text-stone-600 mt-0.5">Date Issued: {loadedQuote.createdAt}</p>
                {profile.ownerName && (
                  <p className="text-stone-600 mt-0.5 text-[11px]">Estimator: {profile.ownerName}</p>
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
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                {loadedQuote.items.map((item, idx) => (
                  <div key={idx} className="p-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900">{item.description}</p>
                      <p className="text-[11px] uppercase tracking-wider text-stone-500 mt-1">
                        {item.type} · {item.quantity} {item.unit} × £{item.rate.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums text-stone-900 sm:text-right">
                      £{(item.quantity * item.rate).toFixed(2)}
                    </p>
                  </div>
                ))}
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
                  <span>{loadedQuote.vatEnabled ? "VAT (20%):" : "VAT:"}</span>
                  <span className="font-medium text-slate-900">£{loadedQuote.vat.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black">
                  <span className="text-base text-slate-900">Total Price:</span>
                  <span className="text-2xl text-clay-700">£{loadedQuote.total.toFixed(2)}</span>
                </div>
                <div className="pt-1 flex justify-between text-xs text-emerald-700 font-bold">
                  <span>Deposit Required:</span>
                  <span>£{loadedQuote.deposit.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* QR Code & Digital Verification Block (Visible on Web & Printed PDF) */}
            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 justify-center sm:justify-start">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Digital Quotation
                </span>
                <p className="text-xs text-slate-600 max-w-md">
                  Scan this QR code with any smartphone camera to review the itemized scope or sign and legally approve this quotation online.
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Ref: {loadedQuote.id} • Valid until {expiry.expiryFormatted}
                </p>
              </div>
              <QuoteQrCode url={quoteLiveUrl} size={90} label="Scan to Sign" />
            </div>

            {/* Site & Inspection Reference Photos */}
            {loadedQuote.photos && loadedQuote.photos.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-clay-700" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                    Job Site & Inspection Reference Photos ({loadedQuote.photos.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {loadedQuote.photos.map((photoUrl, pIdx) => (
                    <div
                      key={pIdx}
                      className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative group cursor-pointer"
                      onClick={() => setSelectedModalPhoto(photoUrl)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Site Inspection Photo ${pIdx + 1}`}
                        className="w-full h-full object-cover transition group-hover:scale-105"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                        Photo #{pIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {decisionError && (
              <p className="text-sm font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 no-print">
                {decisionError}
              </p>
            )}

            {/* Action Bar for Customer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3 no-print">
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
                    onClick={handleRequestChanges}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-clay-50 hover:bg-clay-100 text-clay-800 font-bold py-3.5 px-5 rounded-xl border border-clay-200 transition active:scale-[0.98]"
                    title="Send a quick WhatsApp or message to query or adjust scope"
                  >
                    <MessageSquare className="w-4 h-4 text-clay-700" />
                    <span>Ask Question / Request Changes</span>
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
                <div className="w-full bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-emerald-800 font-semibold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Accepted & signed by {loadedQuote.acceptedSignatureName || signatureName}.</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {createdInvoice ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 font-bold">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{createdInvoice.id}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateInvoice}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Convert to Tax Invoice</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="underline text-emerald-900 hover:text-emerald-700 ml-1"
                    >
                      Print Receipt
                    </button>
                  </div>
                </div>
              ) : status === "expired" ? (
                <div className="w-full bg-amber-50 border border-amber-200 p-4 rounded-xl text-center text-xs text-amber-800 font-semibold">
                  This quotation has passed its validity window and is closed for online acceptance. Please contact the contractor to request an updated quotation.
                </div>
              ) : (
                <div className="w-full bg-slate-100 border border-slate-300 p-4 rounded-xl text-center text-xs text-slate-600">
                  This quote has been declined. Contact the contractor if you wish to adjust scope.
                </div>
              )}

              <a
                href={getWhatsAppShareUrl(
                  {
                    quoteId: loadedQuote.id,
                    token: loadedQuote.token,
                    clientName: loadedQuote.clientName,
                    clientPhone: loadedQuote.clientPhone,
                    quoteTitle: loadedQuote.title,
                    companyName: contractorName,
                    contractorName: activeProfile.ownerName,
                    total: loadedQuote.total,
                    deposit: loadedQuote.deposit,
                    depositPercent: loadedQuote.depositPercent,
                  },
                  siteOrigin
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3.5 px-4 rounded-xl text-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Print / Save PDF</span>
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

      {/* Full Size Photo Inspection Modal */}
      {selectedModalPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 no-print"
          onClick={() => setSelectedModalPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 border border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedModalPhoto}
              alt="Site Photo Full Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setSelectedModalPhoto(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
