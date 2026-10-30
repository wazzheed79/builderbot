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
  Camera,
  MessageSquare,
} from "lucide-react";
import {
  getQuoteById,
  saveQuote,
  updateQuoteStatus,
  Quote,
  BusinessProfile,
  calculateQuoteExpiry,
} from "@/lib/storage";
import QuoteQrCode from "@/components/quotes/QuoteQrCode";
import { getWhatsAppShareUrl } from "@/lib/share";
import { getAuthHeaders } from "@/lib/supabase";
import { brand } from "@/lib/brand.mjs";
import { captureEvent } from "@/lib/analytics";
import { CONSENT_EVENT } from "@/lib/analytics-rules.mjs";
import { displayBusinessName } from "@/lib/business-name.mjs";
import { bankInstruction, formatGbp, preparePrintableQuote } from "@/lib/quote-print.mjs";
import {
  useBusinessProfile,
  useClientReady,
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

function withChosenOption(quote: Quote, optionId?: string): Quote {
  if (!optionId) return quote;
  const option = (quote.options || []).find((item) => item.id === optionId);
  if (!option) return quote;
  return {
    ...quote,
    items: option.items,
    subtotal: option.subtotal,
    vat: option.vat,
    total: option.total,
    deposit: option.deposit,
    selectedOptionId: option.id,
  };
}

function quoteMissingOnline(statusCode: number, message: string) {
  return (
    statusCode === 404 ||
    message === "Quote not found." ||
    message === "Quotation not found or expired."
  );
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
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionPending, setDecisionPending] = useState(false);
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);

  const loadedQuote = quoteOverride ?? cloudQuote ?? storedQuote;
  const choiceOptions = (loadedQuote?.options || []).slice(0, 3);
  const offeringChoice = choiceOptions.length > 1;
  const chosenOption = offeringChoice
    ? choiceOptions.find((option) => option.id === (pickedOptionId || loadedQuote?.selectedOptionId))
    : undefined;
  const shownItems = chosenOption?.items || loadedQuote?.items || [];
  const shownSubtotal = chosenOption?.subtotal ?? loadedQuote?.subtotal ?? 0;
  const shownVat = chosenOption?.vat ?? loadedQuote?.vat ?? 0;
  const shownTotal = chosenOption?.total ?? loadedQuote?.total ?? 0;
  const shownDeposit = chosenOption?.deposit ?? loadedQuote?.deposit ?? 0;
  const status = viewStatus(loadedQuote, remoteExpired);

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

  useEffect(() => {
    if (!loadedQuote || storedQuote) return;
    if (loadedQuote.status !== "Sent" && loadedQuote.status !== "Viewed") return;
    const key = `chuffed-view:${loadedQuote.token}`;
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      // A private browser can block storage. The server cookie still ignores a repeat open.
    }
    void getAuthHeaders().then((headers) => {
      void fetch(`/api/quote/${loadedQuote.token}/view`, {
        method: "POST",
        headers,
        credentials: "same-origin",
      });
    });
  }, [loadedQuote, storedQuote]);

  useEffect(() => {
    if (!loadedQuote || storedQuote) return;
    const key = `chuffed-analytics-view:${loadedQuote.id}`;
    const track = () => {
      try {
        if (sessionStorage.getItem(key) === "1") return;
      } catch {
        // Keep going. A blocked store just means this view may be counted again.
      }
      if (!captureEvent("quote_viewed")) return;
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        // The count was sent. A repeat on this phone is acceptable.
      }
    };
    track();
    window.addEventListener(CONSENT_EVENT, track);
    return () => window.removeEventListener(CONSENT_EVENT, track);
  }, [loadedQuote, storedQuote]);

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
  const contractorName = displayBusinessName(activeProfile.companyName, activeProfile.ownerName);
  const printable = preparePrintableQuote({
    items: shownItems,
    logoUrl: activeProfile.logoUrl,
    vatEnabled: Boolean(loadedQuote?.vatEnabled),
    depositPercent: loadedQuote?.depositPercent ?? 20,
    totals: {
      subtotal: shownSubtotal,
      vat: shownVat,
      total: shownTotal,
      deposit: shownDeposit,
    },
  });
  const bank = bankInstruction(activeProfile);
  const contactPhone = activeProfile.phone || "";
  const contactEmail = activeProfile.email || "";

  const expiry = calculateQuoteExpiry(
    loadedQuote.createdAt,
    activeProfile.quoteValidityDays || 30
  );
  const quoteLiveUrl = `${siteOrigin}/q/${loadedQuote.token || loadedQuote.id}`;

  const rememberLocalDecision = (signed: Quote): boolean => {
    const localQuote = getQuoteById(quoteId);
    if (!localQuote) return false;
    const updated = updateQuoteStatus(quoteId, signed.status, {
      signatureName: signed.acceptedSignatureName,
      reason: signed.rejectedReason,
    });
    if (!updated) return false;
    if (signed.selectedOptionId) {
      saveQuote({
        ...updated,
        items: signed.items,
        subtotal: signed.subtotal,
        vat: signed.vat,
        total: signed.total,
        deposit: signed.deposit,
        selectedOptionId: signed.selectedOptionId,
      });
    }
    return true;
  };

  const handleConfirmAccept = async () => {
    if (!loadedQuote || decisionPending) return;
    if (!signatureName.trim()) {
      setDecisionError("Type your name to accept.");
      return;
    }
    if (!agreedToTerms) {
      setDecisionError("Tick the box to agree to the terms.");
      return;
    }
    if (offeringChoice && !chosenOption) {
      setDecisionError("Choose Standard, Better, or Premium before you accept.");
      return;
    }

    const trimmedName = signatureName.trim();
    setDecisionError(null);
    setDecisionPending(true);

    try {
      const res = await fetch(`/api/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Accepted",
          signatureName: trimmedName,
          selectedOptionId: chosenOption?.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || "This quote cannot be accepted.";
        const localQuote = getQuoteById(quoteId);
        if (quoteMissingOnline(res.status, message) && localQuote) {
          const signed = withChosenOption(
            {
              ...localQuote,
              status: "Accepted",
              acceptedSignatureName: trimmedName,
              acceptedAt: new Date().toISOString(),
            },
            chosenOption?.id
          );
          if (!rememberLocalDecision(signed)) {
            setDecisionError("This quote cannot be accepted. Drafts and expired quotes stay open.");
            return;
          }
          captureEvent("quote_accepted", { had_options: offeringChoice });
          setQuoteOverride(signed);
          setShowSignModal(false);
          return;
        }
        setDecisionError(message);
        return;
      }

      const signed = withChosenOption(
        {
          ...loadedQuote,
          status: "Accepted",
          acceptedSignatureName: trimmedName,
          acceptedAt: new Date().toISOString(),
        },
        chosenOption?.id
      );
      rememberLocalDecision(signed);
      captureEvent("quote_accepted", { had_options: offeringChoice });
      setQuoteOverride(signed);
      setDecisionError(null);
      setShowSignModal(false);
    } catch {
      setDecisionError("Could not reach the quote. Nothing was accepted.");
    } finally {
      setDecisionPending(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!loadedQuote || decisionPending) return;
    const trimmedReason = declineReason.trim();
    setDecisionError(null);
    setDecisionPending(true);

    try {
      const res = await fetch(`/api/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected", reason: trimmedReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || "This quote cannot be declined.";
        if (quoteMissingOnline(res.status, message) && getQuoteById(quoteId)) {
          const updated = updateQuoteStatus(quoteId, "Rejected", { reason: trimmedReason });
          if (!updated) {
            setDecisionError("This quote cannot be declined from its current status.");
            return;
          }
          setQuoteOverride(updated);
          setShowDeclineModal(false);
          return;
        }
        setDecisionError(message);
        return;
      }

      setQuoteOverride({
        ...loadedQuote,
        status: "Rejected",
        rejectedReason: trimmedReason,
        rejectedAt: new Date().toISOString(),
      });
      rememberLocalDecision({
        ...loadedQuote,
        status: "Rejected",
        rejectedReason: trimmedReason,
      });
      setDecisionError(null);
      setShowDeclineModal(false);
    } catch {
      setDecisionError("Could not reach the quote. Nothing was changed.");
    } finally {
      setDecisionPending(false);
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
    } else if (contactEmail) {
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Question regarding Quote #${loadedQuote.id}`)}&body=${message}`;
    }
  };

  return (
    <div className={`min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8 ${status === "pending" ? "pb-32 sm:pb-8" : ""}`}>
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
                  3. {status === "accepted" ? "Accepted" : "Accept"}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  {status === "accepted" ? "Typed acceptance" : "Your decision"}
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
                <h2 className="text-xl font-black">Quote accepted</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  Thank you, {signatureName || loadedQuote.clientName}. Your typed acceptance has been confirmed with {contractorName}.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-lg font-semibold">
                    Typed acceptance: {loadedQuote.acceptedSignatureName || signatureName}
                  </span>
                  <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-lg font-semibold">
                    Deposit Due: {formatGbp(loadedQuote.deposit)}
                  </span>
                </div>
              </div>
            </div>

            {status === "accepted" && bank && (
              <div className="bg-emerald-700/60 border border-emerald-500/40 rounded-xl p-4 text-xs space-y-2">
                <p className="font-bold text-emerald-100 uppercase tracking-wider text-[11px]">
                  Deposit Payment Instructions (Bank Transfer):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono">
                  {bank.bankName && (
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Bank</span>
                    <span className="text-white font-bold">{bank.bankName}</span>
                  </div>
                  )}
                  {bank.sortCode && (
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Sort Code</span>
                    <span className="text-white font-bold">{bank.sortCode}</span>
                  </div>
                  )}
                  <div>
                    <span className="text-emerald-300 text-[10px] block font-sans">Account No</span>
                    <span className="text-white font-bold">{bank.accountNumber}</span>
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
        <div className="quote-document print-page overflow-hidden rounded-2xl border border-stone-200 border-t-8 border-t-clay-700 bg-[#fffdf8] shadow-xl print:overflow-visible">
          {/* Header & Contractor Details */}
          <div className="quote-letterhead border-b border-stone-200 bg-[#fffdf8] p-6 text-ink sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-stone-200">
              <div className="flex items-start gap-4">
                {printable.hasLogo && activeProfile.logoUrl && (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white p-1.5 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProfile.logoUrl}
                      alt={contractorName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-800">Quotation</p>
                  <div className="mb-2 mt-2 inline-flex items-center gap-2 rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-xs font-bold text-clay-800">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{activeProfile.trade || "Trade quote"}</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
                    {contractorName}
                  </h1>
                {activeProfile.tradingName && (
                  <p className="text-xs text-clay-800 font-medium">{activeProfile.tradingName}</p>
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
                {contactPhone && (
                  <p className="pt-2 flex items-center sm:justify-end gap-1.5 text-stone-700">
                    <Phone className="w-3.5 h-3.5 text-clay-700" />
                    <span>{contactPhone}</span>
                  </p>
                )}
                {contactEmail && (
                  <p className="flex items-center sm:justify-end gap-1.5 text-stone-700">
                    <Mail className="w-3.5 h-3.5 text-clay-700" />
                    <span>{contactEmail}</span>
                  </p>
                )}
                {activeProfile.address && (
                  <p className="flex items-center sm:justify-end gap-1.5 text-stone-500 text-[11px]">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{activeProfile.address}</span>
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
                {activeProfile.ownerName && (
                  <p className="text-stone-600 mt-0.5 text-[11px]">Estimator: {activeProfile.ownerName}</p>
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
                <p className="quote-line-long text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-normal wrap-break-word whitespace-pre-wrap">
                  {loadedQuote.notes}
                </p>
              </div>
            )}

            {offeringChoice && (
              <div className="quote-choice">
                <h2 className="mb-1 text-xs font-extrabold uppercase tracking-widest text-stone-600">
                  Choose a price
                </h2>
                <p className="mb-3 text-sm text-stone-700">
                  Pick one. The lines below match that choice.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {choiceOptions.map((option) => {
                    const selected = (pickedOptionId || loadedQuote.selectedOptionId) === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setPickedOptionId(option.id);
                          setDecisionError(null);
                        }}
                        className={`min-h-[4.5rem] rounded-2xl border-2 px-4 py-3 text-left ${
                          selected ? "border-clay-700 bg-clay-50" : "border-stone-200 bg-white"
                        }`}
                      >
                        <span className="block text-sm font-bold text-ink">{option.label}</span>
                        <span className="block text-xl font-black tabular-nums text-clay-800">{formatGbp(option.total)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-stone-600">
                Itemised cost breakdown
              </h2>
              <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200">
                {printable.lines.map((item) => (
                  <div key={item.key} className={`grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end ${item.long ? "quote-line quote-line-long" : "quote-line"}`}>
                    <p className="min-w-0 font-medium wrap-break-word text-ink">{item.description}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Qty</p>
                        <p className="mt-0.5 text-sm tabular-nums text-stone-800">{item.qtyLabel} {item.unit}</p>
                      </div>
                      <div className="min-w-0 border-l border-stone-200 pl-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Rate</p>
                        <p className="mt-0.5 text-sm tabular-nums text-stone-800">{item.rateLabel}</p>
                      </div>
                      <div className="min-w-0 border-l border-stone-200 pl-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{item.lineTotal}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Deposit */}
            <div className="quote-totals flex flex-col items-start justify-between gap-6 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Payment & Deposit Terms:</p>
                <p>• {loadedQuote.depositPercent ?? 20}% deposit ({printable.deposit}) required upon quote acceptance.</p>
                <p>• Remaining balance due upon completion of works.</p>
              </div>

              <div className="w-full space-y-2 rounded-xl border border-stone-300 bg-white p-4 text-sm sm:w-72">
                <div className="flex justify-between gap-3 text-stone-700">
                  <span>Net</span>
                  <span className="font-medium tabular-nums text-ink">{printable.subtotal}</span>
                </div>
                <div className="flex justify-between gap-3 text-stone-700">
                  <span>{loadedQuote.vatEnabled ? "VAT (20%)" : "VAT not added"}</span>
                  <span className="font-medium tabular-nums text-ink">{printable.vat}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t-2 border-ink pt-2 font-black">
                  <span className="text-base text-ink">{loadedQuote.vatEnabled ? "Total inc. VAT" : "Total"}</span>
                  <span className="text-2xl tabular-nums text-clay-800">{printable.total}</span>
                </div>
                <div className="flex justify-between gap-3 pt-1 text-xs font-bold text-emerald-800">
                  <span>Deposit due if accepted</span>
                  <span className="tabular-nums">{printable.deposit}</span>
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
                  Scan this code with a phone camera to read the quote and accept it.
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Ref: {loadedQuote.id} • Valid until {expiry.expiryFormatted}
                </p>
              </div>
              <QuoteQrCode url={quoteLiveUrl} size={90} label="Scan to accept" />
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

            {/* Action Bar for Customer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3 no-print">
              {status === "pending" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDecisionError(null);
                      setShowSignModal(true);
                    }}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.98] sm:flex-1"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Accept quote</span>
                  </button>

                  {(contactPhone || contactEmail) && (
                  <button
                    type="button"
                    onClick={handleRequestChanges}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-clay-50 hover:bg-clay-100 text-clay-800 font-bold py-3.5 px-5 rounded-xl border border-clay-200 transition active:scale-[0.98]"
                    title="Send a quick WhatsApp or message to query or adjust scope"
                  >
                    <MessageSquare className="w-4 h-4 text-clay-700" />
                    <span>Ask Question / Request Changes</span>
                  </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionError(null);
                      setShowDeclineModal(true);
                    }}
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
                    <span>Accepted by {loadedQuote.acceptedSignatureName || signatureName}.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="underline text-emerald-900 hover:text-emerald-700"
                  >
                    Print Receipt
                  </button>
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

        {/* Viral Brand Badge: No-print so it stays off official paper, but visible on mobile/web */}
        <div className="no-print mt-6 mb-12 text-center">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-2xs hover:border-clay-400 hover:text-clay-800 transition"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-clay-700 text-white font-black text-[10px]">
              CQ
            </span>
            <span>Created with <strong className="font-bold text-ink">{brand.name}</strong></span>
            <span className="text-stone-300">·</span>
            <span className="text-clay-700 hover:underline">Free for UK trades →</span>
          </Link>
        </div>
      </div>

      {status === "pending" && (
        <div className="quote-sticky-accept no-print fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-3 py-3 shadow-[0_-8px_24px_rgba(44,36,22,0.12)] sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                {loadedQuote.vatEnabled ? "Total inc. VAT" : "Total"}
              </p>
              <p className="text-xl font-black tabular-nums text-ink">{printable.total}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDecisionError(null);
                setShowSignModal(true);
              }}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 text-base font-bold text-white"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Typed acceptance modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-auto my-4 p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Typed acceptance</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                disabled={decisionPending}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 font-bold min-h-11 min-w-11"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              By typing your name below, you accept quotation <strong>{loadedQuote.id}</strong> ({printable.total}) and the deposit of <strong>{printable.deposit}</strong>. This is a typed acceptance.
            </p>

            {offeringChoice && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Choose a price</p>
                <div className="grid grid-cols-1 gap-2">
                  {choiceOptions.map((option) => {
                    const selected = (pickedOptionId || loadedQuote.selectedOptionId) === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setPickedOptionId(option.id);
                          setDecisionError(null);
                        }}
                        aria-pressed={selected}
                        className={`min-h-12 rounded-xl border-2 px-3 py-3 text-left ${
                          selected ? "border-emerald-800 bg-emerald-50" : "border-stone-200 bg-white"
                        }`}
                      >
                        <span className="block text-sm font-bold text-ink">{option.label}</span>
                        <span className="block text-lg font-black text-clay-700">{formatGbp(option.total)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="acceptance-name">
                  Your name
                </label>
                <input
                  id="acceptance-name"
                  type="text"
                  value={signatureName}
                  onChange={(e) => {
                    setSignatureName(e.target.value);
                    setDecisionError(null);
                  }}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    setDecisionError(null);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                />
                <span>
                  I agree to the terms, scope of work, and deposit schedule stated in this quotation.
                </span>
              </label>
            </div>

            {decisionError && (
              <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {decisionError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                disabled={decisionPending}
                className="flex-1 min-h-11 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={decisionPending}
                className="flex-1 min-h-11 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition"
              >
                {decisionPending ? "Saving…" : "Confirm acceptance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-auto my-4 p-6 shadow-2xl border border-slate-200 space-y-4">
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
              onChange={(e) => {
                setDeclineReason(e.target.value);
                setDecisionError(null);
              }}
              placeholder="e.g. Budget too high, postponing project, found another contractor..."
              className="w-full p-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-slate-800"
            />

            {decisionError && (
              <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {decisionError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                disabled={decisionPending}
                className="flex-1 min-h-11 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={decisionPending}
                className="flex-1 min-h-11 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition"
              >
                {decisionPending ? "Declining…" : "Decline Quote"}
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
