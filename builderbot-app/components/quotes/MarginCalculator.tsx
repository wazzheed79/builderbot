"use client";

import { useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";
import { LineItem, roundMoney, getPricingMemory, savePricingMemory } from "@/lib/storage";

interface MarginCalculatorProps {
  onApply: (items: LineItem[]) => void;
}

export default function MarginCalculator({ onApply }: MarginCalculatorProps) {
  const [materialCost, setMaterialCost] = useState(1250);
  const [materialMarkup, setMaterialMarkup] = useState(() => getPricingMemory().preferredMarkupPercent || 15);
  const [days, setDays] = useState(5);
  const [dayRate, setDayRate] = useState(() => getPricingMemory().laborDayRate || 280);
  const [tradespeople, setTradespeople] = useState(1);
  const [disposalCost, setDisposalCost] = useState(200);

  // Derived live stats
  const grossMaterial = roundMoney(materialCost * (1 + materialMarkup / 100));
  const materialProfit = roundMoney(grossMaterial - materialCost);
  const totalLabor = roundMoney(days * dayRate * tradespeople);
  const grossTotal = roundMoney(grossMaterial + totalLabor + disposalCost);

  const handleApply = () => {
    const newItems: LineItem[] = [
      {
        id: "calc-mat",
        type: "material",
        description: `Trade materials & sundries (Includes ${materialMarkup}% markup)`,
        quantity: 1,
        unit: "pkg",
        rate: grossMaterial,
      },
      {
        id: "calc-lab",
        type: "labor",
        description: `Skilled labour (${days} days x ${tradespeople} operative${
          tradespeople > 1 ? "s" : ""
        } @ £${dayRate}/day)`,
        quantity: days * tradespeople,
        unit: "days",
        rate: dayRate,
      },
    ];

    if (disposalCost > 0) {
      newItems.push({
        id: "calc-disp",
        type: "service",
        description: "Waste disposal & licensed skip hire",
        quantity: 1,
        unit: "item",
        rate: roundMoney(disposalCost),
      });
    }

    try {
      const mem = getPricingMemory();
      savePricingMemory({
        ...mem,
        laborDayRate: dayRate,
        preferredMarkupPercent: materialMarkup,
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    onApply(newItems);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-clay-700" />
          <span>Materials & Labour Margin Calculator</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Add net material cost, markup %, and days on site to protect your profit margin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label htmlFor="material-cost" className="block text-xs font-bold text-slate-700">
            Trade Materials Net Cost (£)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">£</span>
            <input
              id="material-cost"
              type="number"
              value={materialCost}
              onChange={(e) => setMaterialCost(parseFloat(e.target.value) || 0)}
              className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-base font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="material-markup" className="block text-xs font-bold text-slate-700">
              Material Markup (%)
            </label>
            <span className="text-xs font-extrabold text-clay-700">
              +{materialMarkup}%
            </span>
          </div>
          <input
            id="material-markup"
            type="range"
            min="0"
            max="50"
            step="5"
            value={materialMarkup}
            onChange={(e) => setMaterialMarkup(parseInt(e.target.value))}
            className="min-h-11 w-full accent-clay-700"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>0% (Cost)</span>
            <span>15% (Standard)</span>
            <span>30%+ (Small parts)</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label htmlFor="days-on-site" className="block text-xs font-bold text-slate-700">
            Estimated Days on Site
          </label>
          <input
            id="days-on-site"
            type="number"
            min="0.5"
            step="0.5"
            value={days}
            onChange={(e) => setDays(parseFloat(e.target.value) || 0)}
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-900"
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label htmlFor="day-rate" className="block text-xs font-bold text-slate-700">
            Day Rate per Operative (£)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">£</span>
            <input
              id="day-rate"
              type="number"
              value={dayRate}
              onChange={(e) => setDayRate(parseFloat(e.target.value) || 0)}
              className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-base font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label htmlFor="team-size" className="block text-xs font-bold text-slate-700">
            Team Size (Operatives)
          </label>
          <select
            id="team-size"
            value={tradespeople}
            onChange={(e) => setTradespeople(parseInt(e.target.value))}
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-900"
          >
            <option value={1}>1 Tradesperson (Solo)</option>
            <option value={2}>2 Operatives (Pair / with Mate)</option>
            <option value={3}>3 Operatives</option>
          </select>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label htmlFor="disposal-cost" className="block text-xs font-bold text-slate-700">
            Waste Disposal / Skip (£)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">£</span>
            <input
              id="disposal-cost"
              type="number"
              value={disposalCost}
              onChange={(e) => setDisposalCost(parseFloat(e.target.value) || 0)}
              className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-base font-bold text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Live Margin Calculation Summary Card */}
      <div className="bg-clay-50/70 p-5 rounded-xl border border-clay-200 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">
          Margin breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Materials (billed):</span>
            <p className="text-base font-black text-slate-900">
              £{grossMaterial.toFixed(2)}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              +£{materialProfit.toFixed(2)} profit
            </span>
          </div>

          <div>
            <span className="text-slate-500">Labour Total:</span>
            <p className="text-base font-black text-slate-900">
              £{totalLabor.toFixed(2)}
            </p>
          </div>

          <div>
            <span className="text-slate-500">Waste / Skip:</span>
            <p className="text-base font-black text-slate-900">
              £{disposalCost.toFixed(2)}
            </p>
          </div>

          <div>
            <span className="text-slate-500">Net Job Total:</span>
            <p className="text-lg font-black tabular-nums text-ink">
              £{grossTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-clay-200/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-slate-700">
            Ready to add these figures to the quote?
          </span>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-clay-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-clay-800 active:scale-95 sm:w-auto"
          >
            <span>Apply These Figures to Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
