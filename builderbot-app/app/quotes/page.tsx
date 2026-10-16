"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Trash2,
  FileText,
  Send,
  Download,
  Share2,
  CheckCircle2,
  RotateCcw,
  Wrench,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Mic,
  MicOff,
  Calculator,
  Sliders,
  Eye,
  ArrowRight,
  TrendingUp,
  Percent,
} from "lucide-react";

interface LineItem {
  id: string;
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

interface QuoteTemplate {
  name: string;
  category: string;
  title: string;
  notes: string;
  items: LineItem[];
}

export default function QuotesPage() {
  // 1. High Priority Quote Templates
  const templates: QuoteTemplate[] = [
    {
      name: "Bathroom Installation",
      category: "Plumbing",
      title: "En-suite Bathroom Renovation",
      notes:
        "Strip existing bathroom suite. Supply and fit thermostatic bar shower, 1200x500mm heated towel rail, low-profile resin tray, and modern vanity basin. Full pipework rerouting and pressure test.",
      items: [
        {
          id: "t1-1",
          type: "material",
          description: "Thermostatic Bar Shower Kit & Riser Rail",
          quantity: 1,
          unit: "unit",
          rate: 245.0,
        },
        {
          id: "t1-2",
          type: "material",
          description: "Chrome Heated Towel Rail (1200x500mm) + Valves",
          quantity: 1,
          unit: "unit",
          rate: 165.0,
        },
        {
          id: "t1-3",
          type: "material",
          description: "Low Profile Stone Resin Shower Tray (1200x800mm) + Fast-flow Waste",
          quantity: 1,
          unit: "unit",
          rate: 195.0,
        },
        {
          id: "t1-4",
          type: "labor",
          description: "Plumbing installation, sanitaryware fitment & pressure testing",
          quantity: 16,
          unit: "hrs",
          rate: 55.0,
        },
        {
          id: "t1-5",
          type: "service",
          description: "Rip-out, tile removal & licensed trade waste disposal",
          quantity: 1,
          unit: "job",
          rate: 180.0,
        },
      ],
    },
    {
      name: "Kitchen Renovation",
      category: "Building & Joinery",
      title: "Fitted Kitchen & Appliance Installation",
      notes:
        "Remove old kitchen cabinetry. Assemble and install 10 base & wall units, template and fit solid oak worktops, install ceramic Belfast sink with mixer tap, connect integrated dishwasher and induction hob.",
      items: [
        {
          id: "t2-1",
          type: "material",
          description: "Solid Oak 40mm Stave Worktops (3x 3m lengths) + Danish Oil Sealant",
          quantity: 3,
          unit: "lengths",
          rate: 220.0,
        },
        {
          id: "t2-2",
          type: "material",
          description: "Worktop jig joinery bolts, colour-fill sealant & fixing packs",
          quantity: 1,
          unit: "pack",
          rate: 75.0,
        },
        {
          id: "t2-3",
          type: "labor",
          description: "Kitchen cabinet assembly, scribing end panels & worktop jointing",
          quantity: 24,
          unit: "hrs",
          rate: 52.0,
        },
        {
          id: "t2-4",
          type: "labor",
          description: "Plumbing sink wastes, trap and appliance inlet feeds",
          quantity: 4,
          unit: "hrs",
          rate: 55.0,
        },
        {
          id: "t2-5",
          type: "service",
          description: "4-yard midi skip hire for old kitchen disposal",
          quantity: 1,
          unit: "skip",
          rate: 240.0,
        },
      ],
    },
    {
      name: "Roof Repair",
      category: "Roofing",
      title: "Slate Roof Overhaul & Ridge Re-pointing",
      notes:
        "Erect tower scaffold. Strip back 15 cracked natural slates, inspect batten timber, install breathable waterproof membrane patch, replace with matching Spanish slates using copper nails, and re-bed 6 ridge tiles in mortar.",
      items: [
        {
          id: "t3-1",
          type: "material",
          description: "Natural Roofing Slates (500x250mm) + Copper Disc Rivets",
          quantity: 20,
          unit: "slates",
          rate: 6.5,
        },
        {
          id: "t3-2",
          type: "material",
          description: "Class A sand and cement mortar + plasticiser + breathable membrane",
          quantity: 1,
          unit: "set",
          rate: 85.0,
        },
        {
          id: "t3-3",
          type: "labor",
          description: "Roofing repairs, slate fixing, and re-pointing ridge crests",
          quantity: 10,
          unit: "hrs",
          rate: 60.0,
        },
        {
          id: "t3-4",
          type: "service",
          description: "Safety tower scaffolding hire and delivery",
          quantity: 1,
          unit: "hire",
          rate: 220.0,
        },
      ],
    },
    {
      name: "Driveway Installation",
      category: "Groundworks",
      title: "Block Paved Driveway (45m²)",
      notes:
        "Excavate existing ground to 200mm depth. Lay and mechanically compact MOT Type 1 aggregate sub-base, sharp sand screed bed, lay 50mm charcoal block paving with herringbone pattern, and brush in kiln-dried sand.",
      items: [
        {
          id: "t4-1",
          type: "material",
          description: "Standard 50mm Charcoal Block Paving (45 square metres)",
          quantity: 45,
          unit: "m²",
          rate: 24.0,
        },
        {
          id: "t4-2",
          type: "material",
          description: "MOT Type 1 Roadstone Sub-base (6 Bulk Bags) + Heavy Geotextile Membrane",
          quantity: 6,
          unit: "bags",
          rate: 68.0,
        },
        {
          id: "t4-3",
          type: "material",
          description: "Sharp Screeding Sand (2 Bulk Bags) + Kiln Dried Jointing Sand",
          quantity: 2,
          unit: "bags",
          rate: 62.0,
        },
        {
          id: "t4-4",
          type: "labor",
          description: "Groundworks team excavation, sub-base compaction & block laying",
          quantity: 32,
          unit: "hrs",
          rate: 48.0,
        },
        {
          id: "t4-5",
          type: "service",
          description: "Grab wagon soil removal & compactor plate machinery hire",
          quantity: 1,
          unit: "hire",
          rate: 360.0,
        },
      ],
    },
    {
      name: "Boiler Replacement",
      category: "Heating",
      title: "Combi Boiler Upgrade & Power Flush",
      notes:
        "Decommission existing inefficient boiler. Supply and fit Worcester Bosch Greenstar 30kW combi boiler with horizontal flue, inline magnetic filter, full chemical powerflush of 8 radiators, and digital wireless thermostat.",
      items: [
        {
          id: "t5-1",
          type: "material",
          description: "Worcester Bosch 30kW Condensing Combi Boiler + Telescopic Flue Kit",
          quantity: 1,
          unit: "unit",
          rate: 1150.0,
        },
        {
          id: "t5-2",
          type: "material",
          description: "MagnaClean Professional 22mm Magnetic Filter + Scale Reducer",
          quantity: 1,
          unit: "set",
          rate: 140.0,
        },
        {
          id: "t5-3",
          type: "material",
          description: "Fernox F1 Protector & F3 Cleaner chemical packs",
          quantity: 2,
          unit: "bottles",
          rate: 32.0,
        },
        {
          id: "t5-4",
          type: "labor",
          description: "Gas Safe registered boiler swap, pipe alterations & heating flush",
          quantity: 14,
          unit: "hrs",
          rate: 65.0,
        },
        {
          id: "t5-5",
          type: "service",
          description: "Gas Safe building control registration & benchmark certification",
          quantity: 1,
          unit: "cert",
          rate: 60.0,
        },
      ],
    },
  ];

  // Client Details
  const [clientName, setClientName] = useState("Sarah Jenkins");
  const [clientAddress, setClientAddress] = useState("24 Orchard Way, Bristol, BS8 4EJ");
  const [quoteTitle, setQuoteTitle] = useState("En-suite Bathroom Renovation");
  const [notesInput, setNotesInput] = useState(
    "Replace old electric shower with thermostatic mixer shower, replace radiator with chrome heated towel rail, fit low profile tray and test."
  );

  // Active Tab: "items" vs "margin_calculator"
  const [activeTab, setActiveTab] = useState<"items" | "calculator">("items");

  // Margin Calculator States
  const [calcMaterialCost, setCalcMaterialCost] = useState(1250);
  const [calcMaterialMarkup, setCalcMaterialMarkup] = useState(15); // 15% markup
  const [calcDays, setCalcDays] = useState(5);
  const [calcDayRate, setCalcDayRate] = useState(250);
  const [calcTradespeople, setCalcTradespeople] = useState(1);
  const [calcDisposalCost, setCalcDisposalCost] = useState(200);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(true);
  const [depositPercent, setDepositPercent] = useState(20);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<LineItem[]>(templates[0].items);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-GB";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setNotesInput((prev) => `${prev ? prev + " " : ""}${currentTranscript.trim()}`);
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle Voice Recording
  const handleToggleVoice = () => {
    if (!speechSupported || !recognitionRef.current) {
      // Browser doesn't support Web Speech or user blocked it — simulate voice transcription demo
      setIsRecording(true);
      triggerToast("Simulating voice dictation... speak your quote notes.");
      setTimeout(() => {
        setNotesInput(
          "New quote for Mrs Smith. Supply and install 6 lap fence panels on rear garden border with concrete post spurs and one day labour for two men."
        );
        setIsRecording(false);
        triggerToast("Voice memo transcribed!");
      }, 2500);
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
        triggerToast("Listening... speak your job details now.");
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  // AI Description Expander
  const handleExpandDescription = () => {
    if (!notesInput.trim()) return;
    setIsExpanding(true);

    setTimeout(() => {
      const lower = notesInput.toLowerCase();
      let expanded = "";

      if (lower.includes("garden wall") || lower.includes("wall") || lower.includes("brick")) {
        expanded =
          "Supply and construct 9-inch brick garden retaining wall including 600mm deep concrete strip foundations, damp-proof course (DPC), weep holes, mortar bedding, and full site cleanup.";
        setQuoteTitle("Brick Garden Wall Construction");
      } else if (lower.includes("fence") || lower.includes("panel")) {
        expanded =
          "Supply and install heavy-duty pressure-treated featheredge fence panels. Excavate post holes to 600mm, set slotted concrete posts in Postcrete, fit 6-inch gravel boards, and remove all old timber fencing from site.";
        setQuoteTitle("Timber Fencing Installation");
      } else if (lower.includes("boiler") || lower.includes("heat")) {
        expanded =
          "Supply and fit high-efficiency condensing combi boiler. Includes chemical system flush, magnetic central heating filter, smart wireless thermostat, all copper pipe adaptations, and Gas Safe registration.";
        setQuoteTitle("High-Efficiency Boiler Installation");
      } else {
        expanded = `Comprehensive trade works: ${notesInput.trim()}. Includes all required primary trade materials, sub-surface preparation, compliance with building standards, skilled labor, and registered waste disposal.`;
      }

      setNotesInput(expanded);
      setIsExpanding(false);
      triggerToast("Scope expanded into professional trade specification!");
    }, 700);
  };

  // Apply Template
  const handleSelectTemplate = (template: QuoteTemplate) => {
    setQuoteTitle(template.title);
    setNotesInput(template.notes);
    setItems(template.items);
    triggerToast(`Loaded "${template.name}" template with itemized pricing!`);
  };

  // Apply Margin Calculator Values to Quote
  const handleApplyMarginCalc = () => {
    const materialWithMarkup = calcMaterialCost * (1 + calcMaterialMarkup / 100);
    const totalLaborCost = calcDays * calcDayRate * calcTradespeople;

    const newItems: LineItem[] = [
      {
        id: "calc-mat",
        type: "material",
        description: `Trade materials & sundries (Includes ${calcMaterialMarkup}% procurement markup)`,
        quantity: 1,
        unit: "pkg",
        rate: Math.round(materialWithMarkup * 100) / 100,
      },
      {
        id: "calc-lab",
        type: "labor",
        description: `Skilled labor (${calcDays} days x ${calcTradespeople} operative${
          calcTradespeople > 1 ? "s" : ""
        } @ £${calcDayRate}/day)`,
        quantity: calcDays * calcTradespeople,
        unit: "days",
        rate: calcDayRate,
      },
    ];

    if (calcDisposalCost > 0) {
      newItems.push({
        id: "calc-disp",
        type: "service",
        description: "Site waste clearance, transport & licensed skip disposal",
        quantity: 1,
        unit: "service",
        rate: calcDisposalCost,
      });
    }

    setItems(newItems);
    setActiveTab("items");
    triggerToast("Calculated labor, materials & markup applied to quote!");
  };

  // AI Generator Simulation (extracts line items from notes)
  const handleGenerateAI = () => {
    if (!notesInput.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const lower = notesInput.toLowerCase();
      const generated: LineItem[] = [];

      if (lower.includes("fence") || lower.includes("panel")) {
        generated.push(
          {
            id: Date.now().toString() + "-1",
            type: "material",
            description: "Heavy Duty 6x5ft Pressure Treated Lap Fence Panels",
            quantity: 6,
            unit: "panels",
            rate: 38.0,
          },
          {
            id: Date.now().toString() + "-2",
            type: "material",
            description: "Concrete Morticed Posts & Concrete Gravel Boards + Postcrete",
            quantity: 7,
            unit: "sets",
            rate: 26.0,
          },
          {
            id: Date.now().toString() + "-3",
            type: "labor",
            description: "Post hole excavation, concrete setting, panel fitting & old fence removal",
            quantity: 12,
            unit: "hrs",
            rate: 45.0,
          }
        );
      } else if (lower.includes("wall") || lower.includes("brick")) {
        generated.push(
          {
            id: Date.now().toString() + "-1",
            type: "material",
            description: "Engineering Face Bricks & Building Sand + Blue Circle Cement",
            quantity: 1,
            unit: "pallet",
            rate: 420.0,
          },
          {
            id: Date.now().toString() + "-2",
            type: "material",
            description: "Ready-mix foundation concrete & DPC damp proof membrane",
            quantity: 1,
            unit: "pack",
            rate: 160.0,
          },
          {
            id: Date.now().toString() + "-3",
            type: "labor",
            description: "Trench excavation, foundation pour & bricklaying to damp line",
            quantity: 16,
            unit: "hrs",
            rate: 55.0,
          }
        );
      } else {
        generated.push(
          {
            id: Date.now().toString() + "-1",
            type: "material",
            description: "Trade materials & fixtures as per job scope",
            quantity: 1,
            unit: "lot",
            rate: 450.0,
          },
          {
            id: Date.now().toString() + "-2",
            type: "labor",
            description: "Certified trade labor and installation works",
            quantity: 10,
            unit: "hrs",
            rate: 55.0,
          },
          {
            id: Date.now().toString() + "-3",
            type: "service",
            description: "Disposal of trade waste & site cleanup",
            quantity: 1,
            unit: "job",
            rate: 140.0,
          }
        );
      }

      setItems(generated);
      setIsGenerating(false);
      triggerToast("AI extracted line items & updated calculations!");
    }, 850);
  };

  const handleAddItem = (type: "labor" | "material" | "service") => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      type,
      description: type === "labor" ? "Labor hours" : "Materials / Fixtures",
      quantity: 1,
      unit: type === "labor" ? "hrs" : "unit",
      rate: type === "labor" ? 50 : 25,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.rate, 0);
  const vat = vatEnabled ? subtotal * 0.2 : 0;
  const total = subtotal + vat;
  const deposit = (total * depositPercent) / 100;

  // Margin Calculator live stats
  const calcGrossMaterial = calcMaterialCost * (1 + calcMaterialMarkup / 100);
  const calcMaterialProfit = calcGrossMaterial - calcMaterialCost;
  const calcTotalLabor = calcDays * calcDayRate * calcTradespeople;
  const calcNetCost = calcMaterialCost + calcTotalLabor + calcDisposalCost;
  const calcGrossTotal = calcGrossMaterial + calcTotalLabor + calcDisposalCost;
  const calcTotalProfit = calcMaterialProfit; // additional markup profit on top of day rate wages

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            <FileText className="w-8 h-8 text-blue-600" />
            AI Quote Generator
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Dictate with your voice, pick a template, or calculate day rates & materials in seconds.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/q/BB-1042"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Customer View</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Drafting #BB-1042
          </span>
        </div>
      </div>

      {/* 1. Quick Quote Templates Selector Bar */}
      <div className="mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            1-Click Job Templates (High Priority)
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Loads pre-itemized materials & labor
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {templates.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => handleSelectTemplate(tpl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition shadow-2xs active:scale-[0.98]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{tpl.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input, Voice & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Voice & Text Prompt Box */}
          <div className="bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-5 sm:p-6 rounded-2xl border-2 border-blue-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Job Notes & Voice Dictation</span>
              </label>

              {/* Voice Quoting Button (The Killer Feature) */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 ${
                  isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                title="Speak your quote from your van"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Listening... (Tap to Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Speak Quote (Voice)</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Speak or type: 'New quote for Mrs Smith. Build garden wall 10 meters long. 2 days labor for two men...'"
              className="w-full p-3.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-2xs font-normal"
            />

            {/* Quick Actions below textarea */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-100/80">
              <div className="flex items-center gap-2">
                {/* AI Polish & Expand Button */}
                <button
                  type="button"
                  onClick={handleExpandDescription}
                  disabled={isExpanding || !notesInput.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition disabled:opacity-50"
                  title="Expand simple notes like 'Build garden wall' into a contract-grade specification"
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

              {/* Generate AI line items */}
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating || !notesInput.trim()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md transition active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? "Itemizing..." : "Generate Items"}</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs: Detailed Items vs Margin Calculator */}
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
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">
                Fast
              </span>
            </button>
          </div>

          {/* TAB 1: Itemized Breakdown */}
          {activeTab === "items" ? (
            <div className="space-y-6">
              {/* Client & Project Details */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Client & Project Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
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
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    Quote Line Items
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem("material")}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Material
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem("labor")}
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Labor
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
                    >
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                          item.type === "labor"
                            ? "bg-blue-100 text-blue-800"
                            : item.type === "material"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.type}
                      </span>

                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                        className="flex-1 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        placeholder="Item description"
                      />

                      <div className="flex items-center gap-2 justify-between sm:justify-start">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-14 bg-white px-2 py-1.5 text-xs sm:text-sm text-center rounded-lg border border-slate-300 focus:outline-none"
                          />
                          <span className="text-xs text-slate-500 font-medium w-8">{item.unit}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">@ £</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-white px-2 py-1.5 text-xs sm:text-sm text-right rounded-lg border border-slate-300 focus:outline-none"
                          />
                        </div>

                        <span className="text-xs font-bold text-slate-800 w-16 text-right">
                          £{(item.quantity * item.rate).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: Labour & Margin Calculator (Feature #2) */
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span>Materials & Labour Margin Calculator</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  How real tradesprice jobs: Add net material cost, markup %, and days on site to protect your profit margin.
                </p>
              </div>

              {/* Calculator Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Materials Cost */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Trade Materials Net Cost (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">£</span>
                    <input
                      type="number"
                      value={calcMaterialCost}
                      onChange={(e) => setCalcMaterialCost(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Trade supplier cost (Screwfix, merchant, etc.)
                  </span>
                </div>

                {/* Material Markup */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700">
                      Material Markup (%)
                    </label>
                    <span className="text-xs font-extrabold text-blue-600">
                      +{calcMaterialMarkup}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={calcMaterialMarkup}
                    onChange={(e) => setCalcMaterialMarkup(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>0% (Cost)</span>
                    <span>15% (Standard)</span>
                    <span>30%+ (Small parts)</span>
                  </div>
                </div>

                {/* Days on Site */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Estimated Days on Site
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={calcDays}
                    onChange={(e) => setCalcDays(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Working days to finish the job
                  </span>
                </div>

                {/* Day Rate */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Day Rate per Operative (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">£</span>
                    <input
                      type="number"
                      value={calcDayRate}
                      onChange={(e) => setCalcDayRate(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block">Standard £250–£350/day</span>
                </div>

                {/* Number of Tradespeople */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Team Size (Operatives)
                  </label>
                  <select
                    value={calcTradespeople}
                    onChange={(e) => setCalcTradespeople(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                  >
                    <option value={1}>1 Tradesperson (Solo)</option>
                    <option value={2}>2 Operatives (Pair / with Mate)</option>
                    <option value={3}>3 Operatives</option>
                  </select>
                </div>

                {/* Disposal / Skip */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Waste Disposal / Skip (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">£</span>
                    <input
                      type="number"
                      value={calcDisposalCost}
                      onChange={(e) => setCalcDisposalCost(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Live Margin Calculation Summary Card */}
              <div className="bg-blue-50/70 p-5 rounded-xl border border-blue-200 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                  Margin Breakdown & Cost Analysis
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Materials (billed):</span>
                    <p className="text-base font-black text-slate-900">
                      £{calcGrossMaterial.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      +£{calcMaterialProfit.toFixed(2)} profit
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">Labour Total:</span>
                    <p className="text-base font-black text-slate-900">
                      £{calcTotalLabor.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {calcDays}d @ £{calcDayRate}/day
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">Waste / Skip:</span>
                    <p className="text-base font-black text-slate-900">
                      £{calcDisposalCost.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Net Job Total:</span>
                    <p className="text-lg font-black text-blue-900">
                      £{calcGrossTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-200/80 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    Ready to populate your quote?
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyMarginCalc}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
                  >
                    <span>Apply These Figures to Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Quote Card & Pricing (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-6">
          <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
                  Quote Summary
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  16 Oct 2026
                </span>
              </div>
              <h3 className="text-xl font-black mt-1 text-white">{quoteTitle || "Untitled Quote"}</h3>
              <p className="text-xs text-slate-400 mt-1">Prepared for {clientName || "Client"}</p>
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
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
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

              {/* Delivery Actions */}
              <div className="pt-4 space-y-2.5">
                <Link
                  href="/q/BB-1042"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>Preview & Send to Customer</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/q/BB-1042`
                      );
                      triggerToast("Quote link copied! Ready to paste into WhatsApp/SMS.");
                    }}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-start gap-2 text-xs text-blue-800">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  The customer will see a branded acceptance page with your terms where they can tap "Accept" and sign digitally.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}