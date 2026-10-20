"use client";

import { Wrench, Plus, Sparkles, Trash2 } from "lucide-react";
import { LineItem, roundMoney } from "@/lib/storage";

interface LineItemEditorProps {
  items: LineItem[];
  onAddItem: (type: "material" | "labor") => void;
  onUpdateItem: (id: string, field: keyof LineItem, value: string | number) => void;
  onDeleteItem: (id: string) => void;
  isAiDraft: boolean;
  estimateOnly?: boolean;
  onAcknowledgeAiDraft: () => void;
}

export default function LineItemEditor({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isAiDraft,
  estimateOnly = false,
  onAcknowledgeAiDraft,
}: LineItemEditorProps) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-slate-500" />
          <span>Quote Line Items</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddItem("material")}
            className="min-h-[40px] px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl transition inline-flex items-center gap-1.5 active:scale-95 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Material
          </button>
          <button
            type="button"
            onClick={() => onAddItem("labor")}
            className="min-h-[40px] px-3.5 py-2 text-xs font-bold bg-clay-50 hover:bg-clay-100 active:bg-blue-200 text-clay-800 border border-clay-200 rounded-xl transition inline-flex items-center gap-1.5 active:scale-95 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Labour
          </button>
        </div>
      </div>

      {/* AI Draft Review Notice */}
      {isAiDraft && (
        <div className="p-3.5 mb-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {estimateOnly ? (
                <>
                  <strong>Rough estimate.</strong> Change every price before you send it.
                </>
              ) : (
                <>
                  <strong>AI suggestion.</strong> Check the quantities, materials, and rates before
                  you send this quote.
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={onAcknowledgeAiDraft}
            className="text-amber-700 hover:text-amber-900 font-bold underline shrink-0 text-left sm:text-right"
          >
            Acknowledge & Mark Checked
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm font-medium text-slate-500">
            No lines yet. Add materials or labour, pick a template, or load an example.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                  item.type === "labor"
                    ? "bg-clay-100 text-clay-800"
                    : item.type === "material"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {item.type === "labor" ? "Labour" : item.type === "material" ? "Material" : "Service"}
              </span>

              <input
                type="text"
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, "description", e.target.value)}
                className="flex-1 bg-white px-3 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                placeholder="Item description"
              />

              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                    }
                    className="w-16 min-h-[44px] bg-white px-2 py-2 text-xs sm:text-sm font-bold text-center rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                  <span className="text-xs text-slate-600 font-bold w-9">{item.unit}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 font-semibold">@ £</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) =>
                      onUpdateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                    }
                    className="w-24 min-h-[44px] bg-white px-2 py-2 text-xs sm:text-sm font-bold text-right rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>

                <span className="min-w-20 text-right text-xs font-extrabold text-slate-900 sm:text-sm">
                  £{roundMoney(item.quantity * item.rate).toFixed(2)}
                  {item.usualPrice ? (
                    <span className="mt-1 block text-[11px] font-semibold text-clay-800">Using your usual price</span>
                  ) : null}
                </span>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl transition active:scale-90"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
