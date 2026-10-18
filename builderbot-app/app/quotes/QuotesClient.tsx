"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  FileText,
  Share2,
  CheckCircle2,
  RotateCcw,
  Wrench,
  User,
  HelpCircle,
  Mic,
  MicOff,
  Calculator,
  Eye,
  Save,
  MessageCircle,
  Camera,
} from "lucide-react";
import {
  LineItem,
  saveQuote,
  roundMoney,
  getPricingMemory,
  DEFAULT_BUSINESS_PROFILE,
} from "@/lib/storage";
import { useBusinessProfile, useCustomerList } from "@/lib/live-store";
import QuoteTemplatesBar, {
  QuoteTemplate,
  DEFAULT_QUOTE_TEMPLATES,
} from "@/components/quotes/QuoteTemplatesBar";
import MarginCalculator from "@/components/quotes/MarginCalculator";
import LineItemEditor from "@/components/quotes/LineItemEditor";
import SitePhotosUploader from "@/components/quotes/SitePhotosUploader";
import {
  getWhatsAppShareUrl,
  formatWhatsAppQuoteMessage,
  getWhatsAppFollowUpUrl,
  formatWhatsAppFollowUpMessage,
} from "@/lib/share";
import { getAuthHeaders } from "@/lib/supabase";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    isFinal: boolean;
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export default function QuotesClient() {
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId");

  const customers = useCustomerList();
  const profile = useBusinessProfile();

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [appliedCustomerParam, setAppliedCustomerParam] = useState("");

  // Active Quote tracking (prevents duplicate re-saving)
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [quoteTitle, setQuoteTitle] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // Active Tab
  const [activeTab, setActiveTab] = useState<"items" | "calculator">("items");

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(DEFAULT_BUSINESS_PROFILE.vatRegistered ?? true);
  const [depositPercent, setDepositPercent] = useState(DEFAULT_BUSINESS_PROFILE.defaultDepositPercent ?? 20);
  const [isAiDraft, setIsAiDraft] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<LineItem[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ratesReadyFor, setRatesReadyFor] = useState("");

  if (
    customerIdParam &&
    appliedCustomerParam !== customerIdParam &&
    customers.some((customer) => customer.id === customerIdParam)
  ) {
    const match = customers.find((customer) => customer.id === customerIdParam);
    if (match) {
      setAppliedCustomerParam(customerIdParam);
      setSelectedCustomerId(match.id);
      setClientName(match.name || "");
      setClientCompany(match.company || "");
      setClientAddress(match.address || "");
      setClientPhone(match.phone || "");
      setClientEmail(match.email || "");
    }
  }

  const rateStamp = `${profile.vatRegistered}:${profile.defaultDepositPercent}`;
  if (ratesReadyFor !== rateStamp) {
    setRatesReadyFor(rateStamp);
    setVatEnabled(profile.vatRegistered ?? true);
    setDepositPercent(profile.defaultDepositPercent ?? 20);
  }

  // Handle Customer Selection Dropdown
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) return;
    const match = customers.find((c) => c.id === id);
    if (match) {
      setClientName(match.name);
      setClientCompany(match.company ?? "");
      setClientAddress(match.address);
      setClientPhone(match.phone);
      setClientEmail(match.email);
      triggerToast(`Loaded customer details for ${match.name}`);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initialize Speech Recognition cleanly without setState in effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const windowObj = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      };

      const SpeechRec = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-GB";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // Only append FINAL speech results so text doesn't duplicate
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript.trim();
              if (text) {
                setNotesInput((prev) => `${prev ? prev + " " : ""}${text}`);
              }
            }
          }
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Toggle Voice Recording
  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      triggerToast("Voice dictation is only supported in browsers with microphone access (Chrome, Edge, Safari).");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      triggerToast("Voice recording stopped.");
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        triggerToast("Listening... dictate your job notes clearly.");
      } catch {
        setIsRecording(false);
      }
    }
  };

  // Real Server-Side AI Scope Expander
  const handleExpandDescription = async () => {
    if (!notesInput.trim()) {
      triggerToast("Please dictate or enter job notes first.");
      return;
    }
    setIsExpanding(true);

    try {
      const res = await fetch("/api/quote/expand", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          notes: notesInput.trim(),
          title: quoteTitle.trim(),
          trade: profile.trade,
        }),
      });

      const data = await res.json();
      if (res.ok && data.scopeOfWork) {
        setNotesInput(data.scopeOfWork);
        if (data.title && !quoteTitle) setQuoteTitle(data.title);
        triggerToast(
          data.aiPowered
            ? "AI expanded your notes. Read them before you send the quote."
            : data.notice || "Kept your own notes. Sign in for an AI rewrite when it is switched on."
        );
      } else {
        triggerToast(data.error || "Could not expand scope. Please try again.");
      }
    } catch {
      triggerToast("Network error contacting AI server.");
    } finally {
      setIsExpanding(false);
    }
  };

  // Apply Template
  const handleSelectTemplate = (template: QuoteTemplate) => {
    setQuoteTitle(template.title);
    setNotesInput(template.notes);
    setItems(template.items);
    triggerToast(`Loaded "${template.name}" template!`);
  };

  // Load Sample Quote
  const handleLoadSample = () => {
    setClientName("Sarah Jenkins");
    setClientCompany("Private Homeowner");
    setClientAddress("24 Orchard Way, Bristol, BS8 4EJ");
    setClientPhone("+44 7911 123456");
    setClientEmail("sarah.jenkins@example.com");
    handleSelectTemplate(DEFAULT_QUOTE_TEMPLATES[0]);
  };

  // Apply Margin Calculator Values
  const handleApplyMarginFromCalc = (newItems: LineItem[]) => {
    setItems(newItems);
    setActiveTab("items");
    triggerToast("Calculated labor, materials & markup applied to quote!");
  };

  // Real Server-Side AI Quote Generator
  const handleGenerateAI = async () => {
    if (!notesInput.trim()) {
      triggerToast("Please enter or dictate job notes first.");
      return;
    }
    setIsGenerating(true);

    try {
      const res = await fetch("/api/quote/generate", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          notes: notesInput.trim(),
          trade: profile.trade,
          photos: photos && photos.length > 0 ? photos : undefined,
          pricingMemory: getPricingMemory(),
        }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        const mappedItems: LineItem[] = data.items.map(
          (
            it: {
              type: "labor" | "material" | "service";
              description: string;
              quantity: number;
              unit: string;
              rate: number;
            },
            idx: number
          ) => ({
            id: `ai-${Date.now()}-${idx}`,
            type: it.type,
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
          })
        );

        setItems(mappedItems);
        setIsAiDraft(true);
        if (data.title && !quoteTitle) setQuoteTitle(data.title);
        if (data.scopeOfWork) setNotesInput(data.scopeOfWork);
        if (data.suggestedDepositPercent) setDepositPercent(data.suggestedDepositPercent);

        triggerToast(
          data.aiPowered
            ? "AI suggested prices. Change anything that does not look right before you send it."
            : "Rough estimate only. Edit every price before you send this quote."
        );
      } else {
        triggerToast(data.error || "Could not generate quote items.");
      }
    } catch {
      triggerToast("Network error contacting AI server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = (type: "labor" | "material") => {
    const memory = getPricingMemory();
    const newItem: LineItem = {
      id: Date.now().toString(),
      type,
      description: type === "labor" ? "Labour hours" : "Materials / Fixtures",
      quantity: 1,
      unit: type === "labor" ? "hrs" : "unit",
      rate: type === "labor" ? memory.laborHourlyRate || 50 : 25,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Currency Calculations (rounded to pence)
  const subtotal = roundMoney(items.reduce((acc, curr) => acc + curr.quantity * curr.rate, 0));
  const vat = roundMoney(vatEnabled ? subtotal * 0.2 : 0);
  const total = roundMoney(subtotal + vat);
  const deposit = roundMoney((total * depositPercent) / 100);

  // Save to Repository (Updates existing if activeQuoteId set)
  const handleSaveQuote = (status: "Draft" | "Sent" = "Sent") => {
    if (!clientName.trim() && items.length === 0) {
      triggerToast("Please add client details or line items before saving.");
      return;
    }

    const saved = saveQuote({
      ...(activeQuoteId ? { id: activeQuoteId, token: activeToken ?? undefined } : {}),
      customerId: selectedCustomerId || undefined,
      clientName: clientName.trim() || "Private Client",
      clientCompany: clientCompany.trim() || undefined,
      clientAddress: clientAddress.trim() || "Local Address",
      clientPhone: clientPhone.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      title: quoteTitle.trim() || "Trade Works Specification",
      notes: notesInput.trim(),
      photos,
      items,
      subtotal,
      vatEnabled,
      vat,
      total,
      depositPercent,
      deposit,
      status,
    });

    setActiveQuoteId(saved.id);
    setActiveToken(saved.token);
    triggerToast(`Quote ${saved.id} saved! Link: /q/${saved.token}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-36 lg:pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-clay-700" />
            <span>Quote Builder</span>
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Pick a customer, build line items with day rates or templates, and save active quotes.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {activeToken || activeQuoteId ? (
            <Link
              href={`/q/${activeToken || activeQuoteId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Customer Link ({activeQuoteId})</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <span>Load Example Data</span>
            </button>
          )}

          {activeQuoteId && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              #{activeQuoteId}
            </span>
          )}
        </div>
      </div>

      {/* 1. Quick Quote Templates Selector Bar */}
      <QuoteTemplatesBar onSelectTemplate={handleSelectTemplate} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input, Voice & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real Customer Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-clay-700" />
                <span>Link to Customer Record</span>
              </label>
              <Link
                href="/customers"
                className="text-xs text-clay-700 font-semibold hover:underline"
              >
                + New Customer
              </Link>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Select from Customer Directory (or enter custom) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""} — {c.address}
                </option>
              ))}
            </select>
          </div>

          {/* Voice & Text Prompt Box */}
          <div className="bg-gradient-to-br from-paper/70 via-white to-slate-50 p-5 sm:p-6 rounded-2xl border-2 border-clay-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <label className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-clay-700" />
                <span>Job Notes & Van Voice Dictation</span>
              </label>

              {/* Voice Quoting Button (High-contrast, large touch area) */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[46px] rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md active:scale-95 ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-400/50 shadow-red-500/25 animate-pulse"
                    : "bg-clay-700 hover:bg-clay-800 text-white"
                }`}
                title="Speak your quote from your van"
              >
                {isRecording ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
                    <MicOff className="w-4 h-4" />
                    <span>Listening... (Tap to Finish)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-300" />
                    <span>Dictate Quote in Van</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Speak or type job notes: 'Build brick garden wall 10 meters long, 2 days labor for two men...'"
              className="w-full p-3.5 text-xs sm:text-sm font-medium rounded-xl border-2 border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-2xs text-slate-900"
            />

            {/* Live Recording Status Banner */}
            {isRecording && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-xs text-red-900 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span className="font-bold">
                    Van Mic Active: Speak job scope, materials or days needed.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotesInput("");
                    triggerToast("Dictation cleared.");
                  }}
                  className="text-[11px] font-bold text-red-700 underline hover:text-red-900 shrink-0"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-clay-100/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExpandDescription}
                  disabled={isExpanding || !notesInput.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isExpanding ? "Polishing..." : "✨ Expand to Professional Scope"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotesInput("")}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                {photos.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{photos.length} photo{photos.length > 1 ? "s" : ""} included</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !notesInput.trim()}
                  className="inline-flex items-center gap-2 bg-clay-700 hover:bg-clay-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md transition active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isGenerating
                      ? photos.length > 0
                        ? "Inspecting Photos & Itemizing..."
                        : "Itemizing..."
                      : photos.length > 0
                      ? `Generate Items (Voice + ${photos.length} Photos)`
                      : "Generate Items"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Job Site & Inspection Photos Uploader */}
          <SitePhotosUploader photos={photos} onChange={setPhotos} />
          <p className="text-xs text-stone-600">
            Photos stay on this phone until the database photo step has been run and you are signed in.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("items")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === "items"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Itemized Breakdown ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === "calculator"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Labour & Margin Calculator</span>
            </button>
          </div>

          {/* TAB 1: Itemized Breakdown */}
          {activeTab === "items" ? (
            <div className="space-y-6">
              {/* Client & Project Details */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Client & Project Details</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Garden Wall Construction"
                      value={quoteTitle}
                      onChange={(e) => setQuoteTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Site / Property Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15 High Street, Bristol"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Modular Line Item Editor */}
              <LineItemEditor
                items={items}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                isAiDraft={isAiDraft}
                onAcknowledgeAiDraft={() => setIsAiDraft(false)}
              />
            </div>
          ) : (
            /* TAB 2: Modular Margin Calculator */
            <MarginCalculator onApply={handleApplyMarginFromCalc} />
          )}
        </div>

        {/* Right Column: Live Quote Card & Persistence Actions (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-6">
          <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-widest text-clay-300">
                  Quote Summary
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {new Date().toISOString().split("T")[0]}
                </span>
              </div>
              <h3 className="text-xl font-black mt-1 text-white">{quoteTitle || "Untitled Quote"}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Prepared for {clientName || "Client"} {clientCompany ? `(${clientCompany})` : ""}
              </p>
            </div>

            {/* Financials & Toggles */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="space-y-2.5 text-sm text-slate-600 pb-4 border-b border-slate-200">
                <div className="flex justify-between">
                  <span>Subtotal (Net)</span>
                  <span className="font-semibold text-slate-900">£{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={vatEnabled}
                      onChange={(e) => setVatEnabled(e.target.checked)}
                      className="rounded text-clay-700 focus:ring-clay-600 h-4 w-4"
                    />
                    <span>Add 20% VAT</span>
                  </label>
                  <span className="font-semibold text-slate-900">
                    {vatEnabled ? `£${vat.toFixed(2)}` : "£0.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>Deposit on Signing</span>
                    <select
                      value={depositPercent}
                      onChange={(e) => setDepositPercent(parseInt(e.target.value))}
                      className="bg-slate-100 rounded px-1.5 py-0.5 text-xs font-semibold"
                    >
                      <option value={0}>0% (No Deposit)</option>
                      <option value={10}>10%</option>
                      <option value={20}>20%</option>
                      <option value={25}>25%</option>
                      <option value={50}>50%</option>
                    </select>
                  </div>
                  <span className="font-semibold text-emerald-700">£{deposit.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs uppercase font-extrabold text-slate-400">Total Price</span>
                  <p className="text-xs text-slate-500">Includes materials & labor</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900">£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery & Persistence Actions */}
              <div className="pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSaveQuote("Sent")}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  <span>{activeQuoteId ? "Update & Issue Quote" : "Save & Issue Quote to Client"}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={activeToken ? `/q/${activeToken}` : activeQuoteId ? `/q/${activeQuoteId}` : "#"}
                    onClick={(e) => {
                      if (!activeQuoteId && !activeToken) {
                        e.preventDefault();
                        triggerToast("Please save the quote first to generate a customer link.");
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                      activeQuoteId || activeToken
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Customer Link</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeQuoteId && !activeToken) {
                        triggerToast("Save the quote first to generate a shareable WhatsApp link.");
                        return;
                      }
                      const siteOrigin = window.location.origin;
                      const params = {
                        quoteId: activeQuoteId || "",
                        token: activeToken || activeQuoteId || "",
                        clientName: clientName || "there",
                        clientPhone: clientPhone,
                        quoteTitle: quoteTitle,
                        companyName: profile.companyName,
                        contractorName: profile.ownerName,
                        total,
                        deposit,
                        depositPercent,
                      };
                      const waUrl = getWhatsAppShareUrl(params, siteOrigin);
                      const shareText = formatWhatsAppQuoteMessage(params, siteOrigin);
                      navigator.clipboard.writeText(shareText);
                      window.open(waUrl, "_blank");
                      triggerToast("WhatsApp opened & message copied to clipboard!");
                    }}
                    className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeQuoteId && !activeToken) {
                        triggerToast("Save the quote first to generate a follow-up link.");
                        return;
                      }
                      const siteOrigin = window.location.origin;
                      const params = {
                        quoteId: activeQuoteId || "",
                        token: activeToken || activeQuoteId || "",
                        clientName: clientName || "there",
                        clientPhone: clientPhone,
                        quoteTitle: quoteTitle,
                        companyName: profile.companyName,
                        contractorName: profile.ownerName,
                        total,
                        deposit,
                        depositPercent,
                      };
                      const waFollowUpUrl = getWhatsAppFollowUpUrl(params, siteOrigin);
                      const followUpText = formatWhatsAppFollowUpMessage(params, siteOrigin);
                      navigator.clipboard.writeText(followUpText);
                      window.open(waFollowUpUrl, "_blank");
                      triggerToast("WhatsApp opened with warm follow-up message!");
                    }}
                    className="col-span-2 flex items-center justify-center gap-1.5 bg-clay-50 hover:bg-clay-100 text-clay-800 border border-clay-200 font-semibold py-2 px-3 rounded-xl text-xs transition"
                    title="Send a polite follow-up message if the customer hasn't responded"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-clay-700" />
                    <span>Send Polite Follow-Up (WhatsApp)</span>
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="p-3 bg-clay-50/70 border border-clay-200/60 rounded-xl flex items-start gap-2 text-xs text-clay-800">
                <HelpCircle className="w-4 h-4 text-clay-700 shrink-0 mt-0.5" />
                <span>
                  Quotes get a unique, unguessable customer link where clients can sign digitally from any smartphone.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Summary & Fast Action Bar (lg:hidden) */}
      <div className="lg:hidden fixed bottom-[64px] left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t-2 border-slate-800 text-white px-4 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-lg font-black text-white">£{total.toFixed(2)}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-400">
            Deposit: £{deposit.toFixed(2)} ({depositPercent}%)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeQuoteId || activeToken ? (
            <button
              type="button"
              onClick={() => {
                const siteOrigin = window.location.origin;
                const params = {
                  quoteId: activeQuoteId || "",
                  token: activeToken || activeQuoteId || "",
                  clientName: clientName || "there",
                  clientPhone: clientPhone,
                  quoteTitle: quoteTitle,
                  companyName: profile.companyName,
                  contractorName: profile.ownerName,
                  total,
                  deposit,
                  depositPercent,
                };
                const waUrl = getWhatsAppShareUrl(params, siteOrigin);
                const shareText = formatWhatsAppQuoteMessage(params, siteOrigin);
                navigator.clipboard.writeText(shareText);
                window.open(waUrl, "_blank");
                triggerToast("WhatsApp opened & message copied to clipboard!");
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold px-3.5 py-2 min-h-[46px] rounded-xl text-xs shadow-md active:scale-95 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveQuote()}
              className="inline-flex items-center gap-1.5 bg-clay-700 hover:bg-clay-800 active:bg-blue-800 text-white font-extrabold px-4 py-2 min-h-[46px] rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Quote</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
            }}
            className="p-2 min-h-[46px] min-w-[46px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold active:scale-90 transition"
            title="Jump to Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
