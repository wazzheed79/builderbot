"use client";

import { Wrench, Plus, Sparkles, Trash2 } from "lucide-react";
import { LineItem, roundMoney } from "@/lib/storage";

interface LineItemEditorProps {
  items: LineItem[];
  onAddItem: (type: "material" | "labor") => void;
  onUpdateItem: (id: string, field: keyof LineItem, value: string | number) => void;
  onDeleteItem: (id: string) => void;
  isAiDraft: boolean;
  onAcknowledgeAiDraft: () => void;
}

export default function LineItemEditor({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isAiDraft,
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
            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Material
          </button>
          <button
            type="button"
            onClick={() => onAddItem("labor")}
            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Labor
          </button>
        </div>
      </div>

      {/* AI Draft Review Notice */}
      {isAiDraft && (
        <div className="p-3.5 mb-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>AI Estimate Draft:</strong> Please verify trade quantities, materials, and day rates for site accuracy before issuing.
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
            No line items yet. Add materials or labor above, select a template, or click &ldquo;Load Example Data&rdquo;.
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
                onChange={(e) => onUpdateItem(item.id, "description", e.target.value)}
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
                      onUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
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
                      onUpdateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                    }
                    className="w-20 bg-white px-2 py-1.5 text-xs sm:text-sm text-right rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <span className="text-xs font-bold text-slate-800 w-16 text-right">
                  £{roundMoney(item.quantity * item.rate).toFixed(2)}
                </span>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded transition"
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
