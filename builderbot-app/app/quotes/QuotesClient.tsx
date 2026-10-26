"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Receipt,
} from "lucide-react";
import {
  LineItem,
  saveQuote,
  roundMoney,
  getPricingMemory,
  getQuoteById,
  deleteQuote,
  reassignStoredQuoteId,
  convertQuoteToInvoice,
  saveQuoteTemplate,
  deleteQuoteTemplate,
  templateFromQuote,
  recalculateQuoteTotals,
  DEFAULT_BUSINESS_PROFILE,
  type QuoteOption,
} from "@/lib/storage";
import { useBusinessProfile, useClientReady, useCustomerList, useInvoiceList, useQuoteList, useSavedQuoteTemplates } from "@/lib/live-store";
import { canCreateInvoiceFromQuote } from "@/lib/invoice-rules.mjs";
import { HOME_NOTES_KEY } from "@/lib/home-notes";
import {
  builderCanTakeGuestDemo,
  clearGuestDemoQuote,
  guestDemoToBuilderFields,
  readGuestDemoQuote,
} from "@/lib/guest-demo.mjs";
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
import { deleteCloudQuote, getAuthHeaders, syncQuoteToCloud } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import type { Quote } from "@/lib/storage";
import { loadRememberedPrices, rememberLinePrice } from "@/lib/price-memory";
import { buildChoiceOptions } from "@/lib/quote-options.mjs";
import { quoteDraftForSave } from "@/lib/quote-draft.mjs";
import {
  clearWorkingDraft,
  cloudSyncPlan,
  autosaveRowToRetire,
  ensureCloudIdentity,
  readWorkingDraft,
  recoveryWhenLabel,
  shouldOfferRecovery,
  snapshotHasWork,
  toCloudDraftQuote,
  writeWorkingDraft,
} from "@/lib/quote-autosave.mjs";
import { BUSINESS_NAME_PROMPT, hasBusinessName } from "@/lib/business-name.mjs";
import { captureEvent } from "@/lib/analytics";
import { QuoteFollowUp } from "@/components/quotes/QuoteFollowUp";
import { BusinessNamePrompt } from "@/components/BusinessNamePrompt";

function money(amount: number) {
  return amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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

function draftFingerprint(snapshot: Record<string, unknown>) {
  return JSON.stringify({
    clientName: snapshot.clientName,
    clientCompany: snapshot.clientCompany,
    clientAddress: snapshot.clientAddress,
    clientPhone: snapshot.clientPhone,
    clientEmail: snapshot.clientEmail,
    quoteTitle: snapshot.quoteTitle,
    notesInput: snapshot.notesInput,
    items: snapshot.items,
    photos: snapshot.photos,
    choiceOptions: snapshot.choiceOptions,
    choiceIndex: snapshot.choiceIndex,
    vatEnabled: snapshot.vatEnabled,
    depositPercent: snapshot.depositPercent,
    selectedCustomerId: snapshot.selectedCustomerId,
    activeQuoteId: snapshot.activeQuoteId,
    activeToken: snapshot.activeToken,
  });
}

export default function QuotesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId");

  const { user, isConfigured } = useAuth();
  const customers = useCustomerList();
  const savedQuotes = useQuoteList();
  const savedTemplates = useSavedQuoteTemplates();
  const invoices = useInvoiceList();
  const profile = useBusinessProfile();
  const ready = useClientReady();

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [appliedCustomerParam, setAppliedCustomerParam] = useState("");

  // Active Quote tracking (prevents duplicate re-saving)
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [templateName, setTemplateName] = useState("");

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
  const [estimateOnly, setEstimateOnly] = useState(false);
  const [homeNotesApplied, setHomeNotesApplied] = useState(false);
  const [fromHome, setFromHome] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<LineItem[]>([]);
  const [choiceOptions, setChoiceOptions] = useState<QuoteOption[] | null>(null);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [appliedQuoteParam, setAppliedQuoteParam] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [ratesReadyFor, setRatesReadyFor] = useState("");
  const [recoveryOffer, setRecoveryOffer] = useState<Record<string, unknown> | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [guestDemoApplied, setGuestDemoApplied] = useState(false);
  const [guestCarryNote, setGuestCarryNote] = useState(false);
  // Bumped when the tradesperson changes the lines, so a late AI reply cannot replace them.
  const editVersion = useRef(0);
  const requestSerial = useRef(0);
  const lineSerial = useRef(0);
  const ignoreAutosave = useRef(false);
  const baselineRef = useRef("");
  const cloudIdentity = useRef({ id: "", token: "" });
  const cloudPending = useRef(false);
  const userRef = useRef(user);
  const baselinedQuote = useRef("");
  const draftRef = useRef({
    items,
    choiceOptions,
    choiceIndex,
    vatEnabled,
    depositPercent,
    clientName,
    clientCompany,
    clientAddress,
    clientPhone,
    clientEmail,
    quoteTitle,
    notesInput,
    photos,
    selectedCustomerId,
    activeQuoteId,
    activeToken,
    cloudDraftId: null as string | null,
    cloudDraftToken: null as string | null,
  });
  const markDraftEdited = () => {
    editVersion.current += 1;
  };

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

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  if (ready && !homeNotesApplied) {
    const stored = readWorkingDraft(window.localStorage);
    const offer = shouldOfferRecovery(stored, searchParams.get("quote")) ? stored : null;
    setRecoveryOffer(offer);
    setDraftReady(true);
    setHomeNotesApplied(true);
    if (!offer) {
      const pending = sessionStorage.getItem(HOME_NOTES_KEY);
      if (pending) {
        setNotesInput(pending.slice(0, 2000));
        setFromHome(true);
      }
    }
  }

  useEffect(() => {
    if (!homeNotesApplied || recoveryOffer) return;
    sessionStorage.removeItem(HOME_NOTES_KEY);
  }, [homeNotesApplied, recoveryOffer]);

  useEffect(() => {
    if (!guestCarryNote) return;
    clearGuestDemoQuote(window.localStorage);
  }, [guestCarryNote]);

  useEffect(() => {
    const snapshot = {
      items,
      choiceOptions,
      choiceIndex,
      vatEnabled,
      depositPercent,
      clientName,
      clientCompany,
      clientAddress,
      clientPhone,
      clientEmail,
      quoteTitle,
      notesInput,
      photos,
      selectedCustomerId,
      activeQuoteId,
      activeToken,
      cloudDraftId: cloudIdentity.current.id || null,
      cloudDraftToken: cloudIdentity.current.token || null,
    };
    draftRef.current = snapshot;
    if (!draftReady || recoveryOffer) return;
    if (appliedQuoteParam && baselinedQuote.current !== appliedQuoteParam) {
      baselinedQuote.current = appliedQuoteParam;
      baselineRef.current = draftFingerprint(snapshot);
      return;
    }
    if (ignoreAutosave.current) {
      ignoreAutosave.current = false;
      baselineRef.current = draftFingerprint(snapshot);
      return;
    }
    if (!snapshotHasWork(snapshot) || draftFingerprint(snapshot) === baselineRef.current) return;

    const timer = window.setTimeout(() => {
      const saved = writeWorkingDraft(window.localStorage, draftRef.current, new Date().toISOString());
      if (saved?.cloudDraftId) {
        cloudIdentity.current = {
          id: String(saved.cloudDraftId),
          token: String(saved.cloudDraftToken || ""),
        };
      }
      const current = draftRef.current;
      const existing = current.activeQuoteId ? getQuoteById(current.activeQuoteId) : undefined;
      const online = navigator.onLine;
      const plan = cloudSyncPlan({
        online,
        signedIn: Boolean(userRef.current),
        snapshot: current,
        existingStatus: existing?.status,
      });
      if (plan === "wait") {
        cloudPending.current = true;
        return;
      }
      if (plan !== "sync") return;
      const withId = ensureCloudIdentity(current);
      cloudIdentity.current = {
        id: String(withId.cloudDraftId || ""),
        token: String(withId.cloudDraftToken || ""),
      };
      draftRef.current = {
        ...current,
        cloudDraftId: cloudIdentity.current.id || null,
        cloudDraftToken: cloudIdentity.current.token || null,
      };
      writeWorkingDraft(window.localStorage, draftRef.current, new Date().toISOString());
      const quote = toCloudDraftQuote(withId, new Date().toISOString().slice(0, 10));
      syncQuoteToCloud(quote as Quote).then((result) => {
        cloudPending.current = !result.ok;
      }).catch(() => {
        cloudPending.current = true;
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    items,
    choiceOptions,
    choiceIndex,
    vatEnabled,
    depositPercent,
    clientName,
    clientCompany,
    clientAddress,
    clientPhone,
    clientEmail,
    quoteTitle,
    notesInput,
    photos,
    selectedCustomerId,
    activeQuoteId,
    activeToken,
    appliedQuoteParam,
    recoveryOffer,
  ]);

  useEffect(() => {
    const flushLocal = () => {
      if (recoveryOffer) return;
      const snapshot = draftRef.current;
      if (!snapshotHasWork(snapshot) || draftFingerprint(snapshot) === baselineRef.current) return;
      writeWorkingDraft(window.localStorage, snapshot, new Date().toISOString());
    };
    const retryCloud = () => {
      if (!cloudPending.current || recoveryOffer || !userRef.current) return;
      const snapshot = draftRef.current;
      const existing = snapshot.activeQuoteId ? getQuoteById(snapshot.activeQuoteId) : undefined;
      if (cloudSyncPlan({ online: true, signedIn: true, snapshot, existingStatus: existing?.status }) !== "sync") {
        return;
      }
      const withId = ensureCloudIdentity(snapshot);
      cloudIdentity.current = {
        id: String(withId.cloudDraftId || ""),
        token: String(withId.cloudDraftToken || ""),
      };
      draftRef.current = {
        ...snapshot,
        cloudDraftId: cloudIdentity.current.id || null,
        cloudDraftToken: cloudIdentity.current.token || null,
      };
      writeWorkingDraft(window.localStorage, draftRef.current, new Date().toISOString());
      const quote = toCloudDraftQuote(withId, new Date().toISOString().slice(0, 10));
      syncQuoteToCloud(quote as Quote).then((result) => {
        cloudPending.current = !result.ok;
      }).catch(() => {
        cloudPending.current = true;
      });
    };
    window.addEventListener("pagehide", flushLocal);
    window.addEventListener("online", retryCloud);
    return () => {
      window.removeEventListener("pagehide", flushLocal);
      window.removeEventListener("online", retryCloud);
    };
  }, [recoveryOffer]);

  useEffect(() => {
    if (!user || !draftReady || recoveryOffer) return;
    const snapshot = draftRef.current;
    if (!snapshotHasWork(snapshot) || draftFingerprint(snapshot) === baselineRef.current) return;
    const existing = snapshot.activeQuoteId ? getQuoteById(snapshot.activeQuoteId) : undefined;
    const plan = cloudSyncPlan({
      online: navigator.onLine,
      signedIn: true,
      snapshot,
      existingStatus: existing?.status,
    });
    if (plan === "wait") cloudPending.current = true;
    if (plan !== "sync") return;
    const withId = ensureCloudIdentity(snapshot);
    cloudIdentity.current = {
      id: String(withId.cloudDraftId || ""),
      token: String(withId.cloudDraftToken || ""),
    };
    draftRef.current = {
      ...snapshot,
      cloudDraftId: cloudIdentity.current.id || null,
      cloudDraftToken: cloudIdentity.current.token || null,
    };
    writeWorkingDraft(window.localStorage, draftRef.current, new Date().toISOString());
    const quote = toCloudDraftQuote(withId, new Date().toISOString().slice(0, 10));
    syncQuoteToCloud(quote as Quote).then((result) => {
      cloudPending.current = !result.ok;
    }).catch(() => {
      cloudPending.current = true;
    });
  }, [user, draftReady, recoveryOffer]);

  const quoteParam = searchParams.get("quote");
  if (ready && quoteParam && appliedQuoteParam !== quoteParam) {
    const quote = getQuoteById(quoteParam);
    if (quote) {
      setAppliedQuoteParam(quoteParam);
      setActiveQuoteId(quote.id);
      setActiveToken(quote.token);
      setSelectedCustomerId(quote.customerId || "");
      setClientName(quote.clientName);
      setClientCompany(quote.clientCompany || "");
      setClientAddress(quote.clientAddress);
      setClientPhone(quote.clientPhone || "");
      setClientEmail(quote.clientEmail || "");
      setQuoteTitle(quote.title);
      setNotesInput(quote.notes || "");
      setVatEnabled(quote.vatEnabled);
      setDepositPercent(quote.depositPercent);
      setPhotos(quote.photos || []);
      if (quote.options && quote.options.length > 1) {
        setChoiceOptions(quote.options);
        setChoiceIndex(0);
        setItems(quote.options[0].items);
      } else {
        setChoiceOptions(null);
        setItems(quote.items);
      }
    }
  }

  const rateStamp = `${profile.vatRegistered}:${profile.defaultDepositPercent}`;
  if (ratesReadyFor !== rateStamp) {
    setRatesReadyFor(rateStamp);
    setVatEnabled(profile.vatRegistered ?? true);
    setDepositPercent(profile.defaultDepositPercent ?? 20);
  }

  if (
    typeof window !== "undefined" &&
    user &&
    draftReady &&
    ratesReadyFor &&
    !guestDemoApplied &&
    !recoveryOffer &&
    !quoteParam
  ) {
    const pending = readGuestDemoQuote(window.localStorage);
    const canTake = builderCanTakeGuestDemo({ items, activeQuoteId, clientName });
    if (!pending || !canTake) {
      setGuestDemoApplied(true);
    } else {
      const fields = guestDemoToBuilderFields(pending);
      setGuestDemoApplied(true);
      setQuoteTitle(fields.quoteTitle);
      setNotesInput(fields.notesInput);
      setItems(fields.items as LineItem[]);
      setChoiceOptions((fields.choiceOptions as QuoteOption[] | null) ?? null);
      setChoiceIndex(0);
      setVatEnabled(fields.vatEnabled);
      setDepositPercent(fields.depositPercent);
      setIsAiDraft(fields.aiPowered);
      setEstimateOnly(fields.estimateOnly);
      setGuestCarryNote(true);
    }
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
      triggerToast("This phone can't use the microphone here. Type the job instead.");
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
            : data.notice || "Kept your own words. Edit them before you send the quote."
        );
      } else {
        triggerToast(data.error || "Could not expand scope. Please try again.");
      }
    } catch {
      triggerToast("Could not reach the quote helper. Try again.");
    } finally {
      setIsExpanding(false);
    }
  };

  // Apply Template
  const handleSelectTemplate = (template: QuoteTemplate) => {
    markDraftEdited();
    setQuoteTitle(template.title);
    setNotesInput(template.notes);
    setItems(template.items.map((item) => ({ ...item, id: `${item.id}-${Date.now()}` })));
    if (typeof template.vatEnabled === "boolean") setVatEnabled(template.vatEnabled);
    setChoiceOptions(null);
    setChoiceIndex(0);
    triggerToast(`Loaded "${template.name}" template.`);
  };

  const handleSaveTemplate = () => {
    const result = templateFromQuote(
      { title: quoteTitle, notes: notesInput, items, vatEnabled },
      templateName
    );
    if (!result.ok) {
      triggerToast(result.error);
      return;
    }
    saveQuoteTemplate(result.template);
    captureEvent("template_saved");
    setTemplateName("");
    triggerToast(`Saved “${result.template.name}” for next time.`);
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
    markDraftEdited();
    setItems(newItems);
    setChoiceOptions(null);
    setChoiceIndex(0);
    setActiveTab("items");
    triggerToast("Labour, materials and markup are on the quote.");
  };

  // Real Server-Side AI Quote Generator
  const handleGenerateAI = async () => {
    if (!notesInput.trim()) {
      triggerToast("Please enter or dictate job notes first.");
      return;
    }
    const requestId = ++requestSerial.current;
    const startedEdit = editVersion.current;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/quote/generate", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          notes: notesInput.trim(),
          trade: profile.trade,
          photos: photos && photos.length > 0 ? photos : undefined,
          pricingMemory: { ...getPricingMemory(), remembered: await loadRememberedPrices() },
        }),
      });

      const data = await res.json();
      if (requestId !== requestSerial.current || startedEdit !== editVersion.current) {
        triggerToast("Kept the lines on screen. That suggestion was for an earlier version.");
        return;
      }
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
            usualPrice: Boolean((it as { usualPrice?: boolean }).usualPrice),
          })
        );

        setItems(mappedItems);
        setChoiceOptions(null);
        setChoiceIndex(0);
        setIsAiDraft(true);
        setEstimateOnly(!data.aiPowered);
        if (data.title && !quoteTitle) setQuoteTitle(data.title);
        if (data.scopeOfWork) setNotesInput(data.scopeOfWork);
        if (data.suggestedDepositPercent) setDepositPercent(data.suggestedDepositPercent);

        triggerToast(
          data.aiPowered
            ? "Suggested prices are in. Change anything that does not look right before you send it."
            : data.notice ||
                "Rough estimate. Change every price before you send it."
        );
      } else {
        triggerToast(data.error || "Could not generate quote items.");
      }
    } catch {
      triggerToast("Could not reach the quote helper. Try again.");
    } finally {
      if (requestId === requestSerial.current) setIsGenerating(false);
    }
  };

  const handleAddItem = (type: "labor" | "material") => {
    markDraftEdited();
    const memory = getPricingMemory();
    const newItem: LineItem = {
      id: `line-${++lineSerial.current}`,
      type,
      description: type === "labor" ? "Labour hours" : "Materials / Fixtures",
      quantity: 1,
      unit: type === "labor" ? "hrs" : "unit",
      rate: type === "labor" ? memory.laborHourlyRate || 50 : 25,
    };
    setItems((current) => [...current, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: string | number) => {
    markDraftEdited();
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [field]: value, usualPrice: field === "rate" ? false : item.usualPrice };
        if (field === "rate" && user) rememberLinePrice(next);
        return next;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    markDraftEdited();
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const openQuote = activeQuoteId ? savedQuotes.find((quote) => quote.id === activeQuoteId) : undefined;
  const quoteInvoice = openQuote ? invoices.find((invoice) => invoice.quoteId === openQuote.id) : undefined;

  const handleCreateInvoice = () => {
    if (!openQuote || !canCreateInvoiceFromQuote(openQuote.status)) {
      triggerToast("Send the quote first, then create the invoice.");
      return;
    }
    try {
      const alreadyInvoiced = Boolean(quoteInvoice);
      const invoice = quoteInvoice ?? convertQuoteToInvoice(openQuote, false);
      if (!alreadyInvoiced) captureEvent("invoice_created");
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Could not create the invoice.");
    }
  };

  const showChoice = (index: number) => {
    setChoiceOptions((current) => {
      if (!current) return current;
      const next = current.slice();
      next[choiceIndex] = {
        ...next[choiceIndex],
        items,
        ...recalculateQuoteTotals(items, vatEnabled, depositPercent),
      };
      setItems(next[index]?.items || items);
      return next;
    });
    setChoiceIndex(index);
  };

  const suggestChoices = () => {
    const source = draftRef.current.items;
    const next = source.length > 0
      ? buildChoiceOptions(source, draftRef.current.vatEnabled, draftRef.current.depositPercent)
      : [];
    if (next.length < 2) {
      triggerToast("Add a price or some job notes first.");
      return;
    }
    setChoiceOptions(next as QuoteOption[]);
    setChoiceIndex(0);
    triggerToast("Three options are ready. Check each price before you send it.");
  };

  // Currency Calculations (rounded to pence)
  const subtotal = roundMoney(items.reduce((acc, curr) => acc + curr.quantity * curr.rate, 0));
  const vat = roundMoney(vatEnabled ? subtotal * 0.2 : 0);
  const total = roundMoney(subtotal + vat);
  const deposit = roundMoney((total * depositPercent) / 100);

  const publishQuote = async (status: "Draft" | "Sent" = "Sent"): Promise<Quote | null> => {
    if (!hasBusinessName(profile.companyName)) {
      setShareNotice(BUSINESS_NAME_PROMPT);
      return null;
    }

    const draft = draftRef.current;
    const priced = quoteDraftForSave(draft);
    if (!draft.clientName.trim() && priced.items.length === 0) {
      setShareNotice("Add a customer name or some prices before you save.");
      return null;
    }

    const existing = draft.activeQuoteId ? getQuoteById(draft.activeQuoteId) : undefined;
    const created = !existing;
    const firstSend = status === "Sent" && existing?.status !== "Sent";
    const retireAutosaveId = autosaveRowToRetire(draft.cloudDraftId, draft.activeQuoteId);
    let saved = saveQuote({
      ...(draft.activeQuoteId ? { id: draft.activeQuoteId, token: draft.activeToken ?? undefined } : {}),
      sentAt: existing?.sentAt || (status === "Sent" ? new Date().toISOString() : undefined),
      viewCount: existing?.viewCount,
      firstViewedAt: existing?.firstViewedAt,
      lastViewedAt: existing?.lastViewedAt,
      reminderAfterDays: existing?.reminderAfterDays ?? 3,
      options: priced.options,
      selectedOptionId: existing?.selectedOptionId,
      customerId: draft.selectedCustomerId || undefined,
      clientName: draft.clientName.trim() || "Private Client",
      clientCompany: draft.clientCompany.trim() || undefined,
      clientAddress: draft.clientAddress.trim() || "Address to be confirmed",
      clientPhone: draft.clientPhone.trim() || undefined,
      clientEmail: draft.clientEmail.trim() || undefined,
      title: draft.quoteTitle.trim() || "Trade Works Specification",
      notes: draft.notesInput.trim(),
      photos: draft.photos,
      items: priced.items as LineItem[],
      subtotal: priced.subtotal,
      vatEnabled: draft.vatEnabled,
      vat: priced.vat,
      total: priced.total,
      depositPercent: draft.depositPercent,
      deposit: priced.deposit,
      status,
    });
    if (created) captureEvent("quote_created", { ai_used: isAiDraft && !estimateOnly });

    setActiveQuoteId(saved.id);
    setActiveToken(saved.token);
    clearWorkingDraft(window.localStorage);
    cloudIdentity.current = { id: "", token: "" };
    ignoreAutosave.current = true;
    if (retireAutosaveId) {
      deleteQuote(retireAutosaveId);
      deleteCloudQuote(retireAutosaveId).catch(() => {});
    }

    if (!user) {
      setShareNotice(
        "Sign in before you share. The quote is saved on this phone only, so a customer who opens the link will see Quote not found."
      );
      return null;
    }
    if (!isConfigured) {
      setShareNotice("Online save is not set up on this site yet, so the customer link will not work.");
      return null;
    }

    const cloud = await syncQuoteToCloud(saved);
    if (!cloud.ok) {
      setShareNotice(cloud.error);
      return null;
    }
    if (cloud.id && cloud.id !== saved.id) {
      const renamed = reassignStoredQuoteId(saved.id, cloud.id);
      if (renamed) {
        saved = renamed;
        setActiveQuoteId(saved.id);
      }
    }

    setShareNotice(null);
    if (firstSend) captureEvent("quote_sent");
    return saved;
  };

  const shareOnWhatsApp = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const saved = await publishQuote("Sent");
      if (!saved) return;
      const siteOrigin = window.location.origin;
      const params = {
        quoteId: saved.id,
        token: saved.token,
        clientName: saved.clientName || "there",
        clientPhone: saved.clientPhone,
        quoteTitle: saved.title,
        companyName: profile.companyName,
        contractorName: profile.ownerName,
        total: saved.total,
        deposit: saved.deposit,
        depositPercent: saved.depositPercent,
      };
      const waUrl = getWhatsAppShareUrl(params, siteOrigin);
      const shareText = formatWhatsAppQuoteMessage(params, siteOrigin);
      navigator.clipboard.writeText(shareText).catch(() => {});
      window.open(waUrl, "_blank", "noopener,noreferrer");
      triggerToast("WhatsApp is opening. The customer link is saved online.");
    } finally {
      setSharing(false);
    }
  };

  const openCustomerLink = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const saved = await publishQuote("Sent");
      if (!saved) return;
      window.open(`/q/${saved.token}`, "_blank", "noopener,noreferrer");
    } finally {
      setSharing(false);
    }
  };

  const sendFollowUp = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const saved = await publishQuote("Sent");
      if (!saved) return;
      const siteOrigin = window.location.origin;
      const params = {
        quoteId: saved.id,
        token: saved.token,
        clientName: saved.clientName || "there",
        clientPhone: saved.clientPhone,
        quoteTitle: saved.title,
        companyName: profile.companyName,
        contractorName: profile.ownerName,
        total: saved.total,
        deposit: saved.deposit,
        depositPercent: saved.depositPercent,
      };
      const waFollowUpUrl = getWhatsAppFollowUpUrl(params, siteOrigin);
      const followUpText = formatWhatsAppFollowUpMessage(params, siteOrigin);
      navigator.clipboard.writeText(followUpText).catch(() => {});
      window.open(waFollowUpUrl, "_blank", "noopener,noreferrer");
      triggerToast("WhatsApp is opening with a follow-up.");
    } finally {
      setSharing(false);
    }
  };

  const saveAndIssue = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const saved = await publishQuote("Sent");
      if (!saved) return;
      triggerToast("Quote saved online. The customer link is ready to share.");
    } finally {
      setSharing(false);
    }
  };

  const applyRecovery = () => {
    const draft = recoveryOffer;
    if (!draft) return;
    cloudIdentity.current = {
      id: draft.cloudDraftId ? String(draft.cloudDraftId) : "",
      token: draft.cloudDraftToken ? String(draft.cloudDraftToken) : "",
    };
    setSelectedCustomerId(String(draft.selectedCustomerId || ""));
    setClientName(String(draft.clientName || ""));
    setClientCompany(String(draft.clientCompany || ""));
    setClientAddress(String(draft.clientAddress || ""));
    setClientPhone(String(draft.clientPhone || ""));
    setClientEmail(String(draft.clientEmail || ""));
    setQuoteTitle(String(draft.quoteTitle || ""));
    setNotesInput(String(draft.notesInput || ""));
    setItems(Array.isArray(draft.items) ? (draft.items as LineItem[]) : []);
    setPhotos(Array.isArray(draft.photos) ? (draft.photos as string[]) : []);
    setChoiceOptions(Array.isArray(draft.choiceOptions) ? (draft.choiceOptions as QuoteOption[]) : null);
    setChoiceIndex(Number(draft.choiceIndex) || 0);
    setVatEnabled(Boolean(draft.vatEnabled));
    setDepositPercent(Number(draft.depositPercent) || 0);
    if (draft.activeQuoteId) {
      setActiveQuoteId(String(draft.activeQuoteId));
      setActiveToken(draft.activeToken ? String(draft.activeToken) : null);
    }
    ignoreAutosave.current = true;
    setRecoveryOffer(null);
    if (userRef.current) {
      const existing = draft.activeQuoteId ? getQuoteById(String(draft.activeQuoteId)) : undefined;
      const plan = cloudSyncPlan({
        online: navigator.onLine,
        signedIn: true,
        snapshot: draft,
        existingStatus: existing?.status,
      });
      if (plan === "sync") {
        const withId = ensureCloudIdentity(draft);
        const cloudQuote = toCloudDraftQuote(withId, new Date().toISOString().slice(0, 10));
        syncQuoteToCloud(cloudQuote as Quote).catch(() => {
          cloudPending.current = true;
        });
      } else if (plan === "wait") {
        cloudPending.current = true;
      }
    }
  };

  const discardRecovery = () => {
    const draft = recoveryOffer;
    clearWorkingDraft(window.localStorage);
    cloudIdentity.current = { id: "", token: "" };
    if (draft?.cloudDraftId) {
      const existing = getQuoteById(String(draft.cloudDraftId));
      if (!existing || existing.status === "Draft") {
        if (existing) deleteQuote(existing.id);
        deleteCloudQuote(String(draft.cloudDraftId)).catch(() => {});
      }
    }
    setRecoveryOffer(null);
    const pending = sessionStorage.getItem(HOME_NOTES_KEY);
    if (pending) {
      setNotesInput(pending.slice(0, 2000));
      setFromHome(true);
      sessionStorage.removeItem(HOME_NOTES_KEY);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 pb-44 sm:px-6 sm:py-10 lg:px-8 lg:pb-12">
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
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            <FileText className="h-7 w-7 shrink-0 text-clay-700" />
            <span>Quote Builder</span>
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Pick a customer, build line items with day rates or templates, and save active quotes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {activeToken || activeQuoteId ? (
            <button
              type="button"
              onClick={openCustomerLink}
              disabled={sharing}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Customer link ({activeQuoteId})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
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
          {openQuote && <QuoteFollowUp quote={openQuote} companyName={profile.companyName} />}
        </div>
      </div>

      {guestCarryNote && (
        <div className="mt-4 rounded-2xl border border-clay-200 bg-clay-50 p-4">
          <p className="text-sm font-semibold text-ink">
            Your try-it quote is in the builder. Add your business name, then save it and send the link.
          </p>
          <button
            type="button"
            onClick={() => setGuestCarryNote(false)}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-clay-700 px-4 font-bold text-white"
          >
            OK
          </button>
        </div>
      )}

      {recoveryOffer && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm font-semibold text-amber-950 flex-1">
            You have an unsaved quote
            {recoveryOffer.clientName ? ` for ${String(recoveryOffer.clientName)}` : ""} from{" "}
            {recoveryWhenLabel(recoveryOffer.savedAt ? String(recoveryOffer.savedAt) : "")}. Recover it?
            {recoveryOffer.photosOmitted ? " Photos were too large to keep. Add them again." : ""}
          </p>
          <button
            type="button"
            onClick={applyRecovery}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-clay-700 px-4 font-bold text-white"
          >
            Recover
          </button>
          <button
            type="button"
            onClick={discardRecovery}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-400 bg-white px-4 font-bold text-amber-950"
          >
            Discard
          </button>
        </div>
      )}

      {/* 1. Quick Quote Templates Selector Bar */}
      <QuoteTemplatesBar
        onSelectTemplate={handleSelectTemplate}
        savedTemplates={savedTemplates.map((template) => ({
          id: template.id,
          name: template.name,
          category: "Yours",
          title: template.title,
          notes: template.notes,
          items: template.items,
          vatEnabled: template.vatEnabled,
        }))}
        onDeleteSaved={deleteQuoteTemplate}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">
        {/* Left Column: Input, Voice & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Real Customer Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="customer-record" className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <User className="h-4 w-4 text-clay-700" />
                <span>Link to Customer Record</span>
              </label>
              <Link
                href="/customers"
                className="inline-flex min-h-11 items-center text-xs font-semibold text-clay-800 underline"
              >
                + New Customer
              </Link>
            </div>

            <select
              id="customer-record"
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-clay-700"
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
              <label htmlFor="job-notes" className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Sparkles className="h-4 w-4 text-clay-700" />
                <span>Job Notes & Van Voice Dictation</span>
              </label>

              {/* Voice Quoting Button (High-contrast, large touch area) */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 min-h-12 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-95 ${
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
                    <span>Tap and talk</span>
                  </>
                )}
              </button>
            </div>
            {fromHome && (
              <p className="mb-3 rounded-xl border border-clay-200 bg-white px-3 py-2 text-sm text-ink">
                Your notes are in the box. Tap Build the quote.
              </p>
            )}

            <textarea
              id="job-notes"
              rows={4}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Speak or type the job: brick garden wall, 10 metres, two days for two of us..."
              className="w-full min-w-0 p-3.5 text-base font-medium rounded-xl border-2 border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-clay-600 focus:border-transparent shadow-2xs text-slate-900"
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

            <div className="mt-3 flex flex-col gap-2 border-t border-clay-100/80 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleExpandDescription}
                  disabled={isExpanding || !notesInput.trim()}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-bold text-amber-950 transition hover:bg-amber-100 disabled:opacity-50 sm:w-auto"
                >
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <span>{isExpanding ? "Polishing..." : "Expand to professional scope"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotesInput("")}
                  className="inline-flex min-h-11 items-center justify-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
                >
                  <RotateCcw className="h-4 w-4" /> Clear notes
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-clay-700 px-4 py-2 text-base font-bold text-white shadow-md transition hover:bg-clay-800 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? "Building your quote…" : "Build the quote"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-stone-600">
            <Link href="/settings/prices" className="inline-flex min-h-11 items-center font-bold text-clay-800 underline">
              My price list
            </Link>
            <p>Your day rate in Settings is used as well. You still check every line before you send the quote.</p>
          </div>

          {/* Job Site & Inspection Photos Uploader */}
          <SitePhotosUploader photos={photos} onChange={setPhotos} />
          <p className="text-xs text-stone-600">
            Photos stay on this phone until you sign in.
            {photos.length > 0 ? ` ${photos.length} photo${photos.length > 1 ? "s" : ""} saved here.` : ""}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("items")}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                activeTab === "items"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Wrench className="h-4 w-4 shrink-0" />
              <span className="text-left leading-tight">
                Lines
                <span className="mt-0.5 block text-[11px] font-semibold opacity-80">{items.length} items</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                activeTab === "calculator"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Calculator className="h-4 w-4 shrink-0" />
              <span className="text-left leading-tight">Margin</span>
            </button>
          </div>

          {/* TAB 1: Itemised breakdown */}
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
                    <label htmlFor="project-title" className="mb-1 block text-xs font-semibold text-slate-700">
                      Project Title
                    </label>
                    <input
                      id="project-title"
                      type="text"
                      placeholder="e.g. Garden Wall Construction"
                      value={quoteTitle}
                      onChange={(e) => setQuoteTitle(e.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-clay-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-name" className="mb-1 block text-xs font-semibold text-slate-700">
                      Client Name
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-clay-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="client-address" className="mb-1 block text-xs font-semibold text-slate-700">
                      Site / Property Address
                    </label>
                    <input
                      id="client-address"
                      type="text"
                      placeholder="e.g. 15 High Street, Bristol"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-clay-700"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChoiceOptions(null);
                    }}
                    className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold ${
                      choiceOptions ? "bg-stone-100 text-stone-700" : "bg-clay-700 text-white"
                    }`}
                  >
                    One price
                  </button>
                  <button
                    type="button"
                    onClick={() => void suggestChoices()}
                    className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold ${
                      choiceOptions ? "bg-clay-700 text-white" : "bg-stone-100 text-stone-800"
                    }`}
                  >
                    Good, Better, Best
                  </button>
                </div>
                {choiceOptions && (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {choiceOptions.map((option, index) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => showChoice(index)}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-left ${
                          index === choiceIndex ? "border-clay-700 bg-clay-50" : "border-stone-200"
                        }`}
                      >
                        <span className="block text-sm font-bold">{option.label}</span>
                        <span className="text-xs text-stone-600">
                          £{money(recalculateQuoteTotals(index === choiceIndex ? items : option.items, vatEnabled, depositPercent).total)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modular Line Item Editor */}
              <LineItemEditor
                items={items}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                isAiDraft={isAiDraft}
                estimateOnly={estimateOnly}
                onAcknowledgeAiDraft={() => setIsAiDraft(false)}
              />
            </div>
          ) : (
            /* TAB 2: Modular Margin Calculator */
            <MarginCalculator onApply={handleApplyMarginFromCalc} />
          )}
        </div>

        {/* Right Column: Live Quote Card & Persistence Actions (5 cols) */}
        <div className="min-w-0 space-y-6 lg:sticky lg:top-20 lg:col-span-5">
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
                  <span className="font-semibold tabular-nums text-slate-900">£{money(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={vatEnabled}
                      onChange={(e) => setVatEnabled(e.target.checked)}
                      className="h-5 w-5 rounded text-clay-700 focus:ring-clay-600"
                    />
                    <span>Add 20% VAT</span>
                  </label>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {vatEnabled ? `£${money(vat)}` : "£0.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>Deposit on Signing</span>
                    <select
                      aria-label="Deposit percentage"
                      value={depositPercent}
                      onChange={(e) => setDepositPercent(parseInt(e.target.value))}
                      className="min-h-11 rounded-lg bg-slate-100 px-2 text-sm font-semibold"
                    >
                      <option value={0}>0% (No Deposit)</option>
                      <option value={10}>10%</option>
                      <option value={20}>20%</option>
                      <option value={25}>25%</option>
                      <option value={50}>50%</option>
                    </select>
                  </div>
                  <span className="font-semibold tabular-nums text-emerald-800">£{money(deposit)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs font-extrabold uppercase text-slate-500">
                    {vatEnabled ? "Total inc. VAT" : "Total"}
                  </span>
                  <p className="text-xs text-slate-600">Materials and labour</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black tabular-nums text-slate-900 sm:text-4xl">£{money(total)}</span>
                </div>
              </div>

              {/* Delivery & Persistence Actions */}
              <div id="quote-share" className="pt-4 space-y-2.5">
                {ready && !hasBusinessName(profile.companyName) && <BusinessNamePrompt />}
                <button
                  type="button"
                  onClick={saveAndIssue}
                  disabled={sharing}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-md transition hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{activeQuoteId ? "Update & Issue Quote" : "Save & Issue Quote to Client"}</span>
                </button>

                {openQuote && canCreateInvoiceFromQuote(openQuote.status) && (
                  <button
                    type="button"
                    onClick={handleCreateInvoice}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-clay-700 px-4 py-3 font-bold text-white"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>{quoteInvoice ? `Open invoice ${quoteInvoice.number}` : "Create invoice"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  disabled={sharing}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-extrabold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
                >
                  <Share2 className="h-4 w-4 text-emerald-700" />
                  <span>Share on WhatsApp</span>
                </button>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openCustomerLink}
                    disabled={sharing}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Customer link</span>
                  </button>

                  <button
                    type="button"
                    onClick={sendFollowUp}
                    disabled={sharing}
                    className="flex min-h-11 items-center justify-center gap-1.5 bg-clay-50 hover:bg-clay-100 text-clay-800 border border-clay-200 font-semibold py-2 px-3 rounded-xl text-xs transition sm:col-span-2 disabled:opacity-60"
                    title="Send a polite follow-up if the customer has not replied"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-clay-700" />
                    <span>Send a polite follow-up (WhatsApp)</span>
                  </button>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <label htmlFor="template-name" className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Save these lines as a template
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="template-name"
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="Template name, e.g. Boiler swap"
                      className="min-h-12 flex-1 rounded-xl border border-stone-300 bg-white px-3"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="inline-flex min-h-12 items-center justify-center rounded-xl border border-clay-200 bg-white px-4 text-sm font-bold text-clay-800"
                    >
                      Save template
                    </button>
                  </div>
                </div>

                {shareNotice && shareNotice !== BUSINESS_NAME_PROMPT && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    <p>{shareNotice}</p>
                    {!user && /sign in/i.test(shareNotice) && (
                      <Link href="/login" className="mt-2 inline-flex min-h-11 items-center font-bold text-clay-800 underline">
                        Sign in
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="p-3 bg-clay-50/70 border border-clay-200/60 rounded-xl flex items-start gap-2 text-xs text-clay-800">
                <HelpCircle className="w-4 h-4 text-clay-700 shrink-0 mt-0.5" />
                <span>
                  Sign in before you share. The customer then gets a private link they can open and sign on their phone.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {shareNotice && (
        <div className="fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-40 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 shadow-lg lg:hidden">
          {shareNotice === BUSINESS_NAME_PROMPT ? (
            <BusinessNamePrompt className="border-0 bg-transparent p-0" />
          ) : (
            <p>{shareNotice}</p>
          )}
          {shareNotice !== BUSINESS_NAME_PROMPT && !user && /sign in/i.test(shareNotice) && (
            <Link href="/login" className="mt-2 inline-flex min-h-11 items-center font-bold text-clay-800 underline">
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* Mobile Sticky Summary & Fast Action Bar (lg:hidden) */}
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-40 flex w-full max-w-[100vw] items-center justify-between gap-2 overflow-hidden border-t-2 border-slate-800 bg-slate-950/95 px-3 py-2.5 text-white shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
            {vatEnabled ? "Total inc. VAT" : "Total"}
          </span>
          <span className="text-xl font-black tabular-nums text-white">£{money(total)}</span>
          <span className="text-[11px] font-bold text-amber-200">
            Deposit £{money(deposit)} ({depositPercent}%)
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={saveAndIssue}
            disabled={sharing}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-xl bg-clay-700 px-3 text-sm font-extrabold text-white shadow-md transition hover:bg-clay-800 active:scale-95 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
          {(activeQuoteId || activeToken) && (
            <button
              type="button"
              onClick={shareOnWhatsApp}
              disabled={sharing}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              <span>Send</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              document.getElementById("quote-share")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 transition hover:bg-slate-700 hover:text-white"
            aria-label="Jump to save and share"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
