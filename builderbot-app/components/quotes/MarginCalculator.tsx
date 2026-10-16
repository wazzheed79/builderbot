"use client";

import { useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";
import { LineItem, roundMoney } from "@/lib/storage";

interface MarginCalculatorProps {
  onApply: (items: LineItem[]) => void;
}

export default function MarginCalculator({ onApply }: MarginCalculatorProps) {
  const [materialCost, setMaterialCost] = useState(1250);
  const [materialMarkup, setMaterialMarkup] = useState(15);
  const [days, setDays] = useState(5);
  const [dayRate, setDayRate] = useState(250);
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
        description: `Skilled labor (${days} days x ${tradespeople} operative${
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

    onApply(newItems);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <span>Materials & Labour Margin Calculator</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Add net material cost, markup %, and days on site to protect your profit margin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Trade Materials Net Cost (£)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">£</span>
            <input
              type="number"
              value={materialCost}
              onChange={(e) => setMaterialCost(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-700">
              Material Markup (%)
            </label>
            <span className="text-xs font-extrabold text-blue-600">
              +{materialMarkup}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={materialMarkup}
            onChange={(e) => setMaterialMarkup(parseInt(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>0% (Cost)</span>
            <span>15% (Standard)</span>
            <span>30%+ (Small parts)</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Estimated Days on Site
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={days}
            onChange={(e) => setDays(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Day Rate per Operative (£)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">£</span>
            <input
              type="number"
              value={dayRate}
              onChange={(e) => setDayRate(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Team Size (Operatives)
          </label>
          <select
            value={tradespeople}
            onChange={(e) => setTradespeople(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
          >
            <option value={1}>1 Tradesperson (Solo)</option>
            <option value={2}>2 Operatives (Pair / with Mate)</option>
            <option value={3}>3 Operatives</option>
          </select>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Waste Disposal / Skip (£)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">£</span>
            <input
              type="number"
              value={disposalCost}
              onChange={(e) => setDisposalCost(parseFloat(e.target.value) || 0)}
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
            <p className="text-lg font-black text-blue-900">
              £{grossTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-blue-200/80 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">
            Ready to populate your quote?
          </span>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
          >
            <span>Apply These Figures to Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
