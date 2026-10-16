"use client";

import { useState } from "react";
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
} from "lucide-react";

interface LineItem {
  id: string;
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

export default function QuotesPage() {
  // Preset templates for quick inspiration
  const presets = [
    {
      trade: "Electrician",
      title: "Consumer Unit & Downlights",
      notes:
        "Replace old fuseboard with 10-way dual RCD consumer unit, fit 6 fire-rated LED downlights in kitchen, provide full testing and issue EICR certificate.",
    },
    {
      trade: "Plumber",
      title: "Combi Boiler Replacement",
      notes:
        "Supply and fit 30kW high-efficiency combi boiler, install magnetic system filter, chemical power flush existing radiators, fit smart thermostat.",
    },
    {
      trade: "Carpenter",
      title: "Alcove Cabinets & Shelving",
      notes:
        "Build pair of custom shaker-style alcove cupboards with 3 tiers of floating shelves above, MDF primed ready for painter finish.",
    },
  ];

  // Client Details
  const [clientName, setClientName] = useState("Sarah Jenkins");
  const [clientAddress, setClientAddress] = useState("24 Orchard Way, Bristol, BS8 4EJ");
  const [quoteTitle, setQuoteTitle] = useState("En-suite Bathroom Renovation");
  const [notesInput, setNotesInput] = useState(
    "Replace old electric shower with thermostatic mixer shower, replace radiator with chrome heated towel rail, fit 4 downlights and test."
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(true);
  const [depositPercent, setDepositPercent] = useState(20);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "1",
      type: "material",
      description: "Thermostatic Bar Shower Kit & Riser Rail",
      quantity: 1,
      unit: "unit",
      rate: 245.0,
    },
    {
      id: "2",
      type: "material",
      description: "Chrome Heated Towel Rail (1200x500mm) + Angled Valves",
      quantity: 1,
      unit: "unit",
      rate: 165.0,
    },
    {
      id: "3",
      type: "labor",
      description: "Plumbing installation, pipe rerouting & pressure testing",
      quantity: 8,
      unit: "hrs",
      rate: 55.0,
    },
    {
      id: "4",
      type: "labor",
      description: "Electrical connection for downlights & testing",
      quantity: 3,
      unit: "hrs",
      rate: 60.0,
    },
  ]);

  // AI Generator Simulation (parses prompt intelligently into structured trade items)
  const handleGenerateAI = () => {
    if (!notesInput.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const lower = notesInput.toLowerCase();
      const generated: LineItem[] = [];

      if (lower.includes("boiler") || lower.includes("plumb") || lower.includes("radiator")) {
        generated.push(
          {
            id: Date.now().toString() + "-1",
            type: "material",
            description: "High-efficiency heating component & magnetic filter kit",
            quantity: 1,
            unit: "unit",
            rate: 780.0,
          },
          {
            id: Date.now().toString() + "-2",
            type: "material",
            description: "Copper pipework, compression fittings & inhibitor chemicals",
            quantity: 1,
            unit: "set",
            rate: 135.0,
          },
          {
            id: Date.now().toString() + "-3",
            type: "labor",
            description: "Gas Safe certified installation, system flush & commissioning",
            quantity: 12,
            unit: "hrs",
            rate: 60.0,
          }
        );
      } else if (lower.includes("electric") || lower.includes("socket") || lower.includes("light") || lower.includes("fuse")) {
        generated.push(
          {
            id: Date.now().toString() + "-1",
            type: "material",
            description: "18th Edition Consumer Unit / RCBO components",
            quantity: 1,
            unit: "unit",
            rate: 290.0,
          },
          {
            id: Date.now().toString() + "-2",
            type: "material",
            description: "Fire-rated LED fixtures, cabling & junction boxes",
            quantity: 6,
            unit: "units",
            rate: 28.0,
          },
          {
            id: Date.now().toString() + "-3",
            type: "labor",
            description: "Electrical installation, circuit wiring & EICR certification",
            quantity: 7,
            unit: "hrs",
            rate: 58.0,
          }
        );
      } else {
        generated.push(
          {
            id: Date.now().toString() + "-1",
            type: "material",
            description: "Primary trade materials & fixings as per site specification",
            quantity: 1,
            unit: "pkg",
            rate: 340.0,
          },
          {
            id: Date.now().toString() + "-2",
            type: "service",
            description: "Site waste clearance and registered skip disposal",
            quantity: 1,
            unit: "trip",
            rate: 180.0,
          },
          {
            id: Date.now().toString() + "-3",
            type: "labor",
            description: "Skilled trade execution and surface preparation",
            quantity: 14,
            unit: "hrs",
            rate: 50.0,
          }
        );
      }

      setItems(generated);
      setIsGenerating(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    }, 900);
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

  const handleUpdateItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.rate, 0);
  const vat = vatEnabled ? subtotal * 0.2 : 0;
  const total = subtotal + vat;
  const deposit = (total * depositPercent) / 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Toast Alert */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-semibold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>AI extracted items & updated quote calculation!</span>
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
            Dictate or type raw job notes. BuilderBot itemizes materials, labor, and calculates your client-ready price.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Drafting #BB-1043
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: AI Input & Form Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Prompt Box */}
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-slate-50 p-5 sm:p-6 rounded-2xl border-2 border-blue-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Job Notes & Description</span>
              </label>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Type rough notes or paste voice transcription
              </span>
            </div>

            <textarea
              rows={3}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Fit 6 spotlights in kitchen, replace consumer unit with 10-way board, run test cert..."
              className="w-full p-3.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-2xs font-normal"
            />

            {/* Quick Presets */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold mr-1">Try template:</span>
              {presets.map((p) => (
                <button
                  key={p.trade}
                  type="button"
                  onClick={() => {
                    setQuoteTitle(p.title);
                    setNotesInput(p.notes);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition shadow-2xs"
                >
                  {p.trade}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-blue-100">
              <button
                type="button"
                onClick={() => setNotesInput("")}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear notes
              </button>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating || !notesInput.trim()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? "Calculating Rates & Items..." : "Generate Itemized Quote"}</span>
              </button>
            </div>
          </div>

          {/* Client Details Section */}
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

          {/* Line Items Editor */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-500" />
                Itemized Breakdown
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

            {/* Items list */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
                >
                  {/* Badge */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.type === "labor"
                        ? "bg-blue-100 text-blue-800"
                        : item.type === "material"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.type}
                  </span>

                  {/* Description */}
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                    className="flex-1 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Item description"
                  />

                  {/* Quantity, Unit & Rate */}
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

            {/* Add More Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{items.length} line items total</span>
              <button
                type="button"
                onClick={() => handleAddItem("labor")}
                className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add custom item
              </button>
            </div>
          </div>
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
                <button
                  type="button"
                  onClick={() => {
                    alert(`Quote for ${clientName} ready! PDF generator & link sharing simulated.`);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Quote to Customer</span>
                </button>

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
                      navigator.clipboard.writeText(window.location.href);
                      alert("Quote acceptance link copied to clipboard!");
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
                  Customers can view this quote on their smartphone, sign digitally, and pay the £{deposit.toFixed(2)} deposit.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}