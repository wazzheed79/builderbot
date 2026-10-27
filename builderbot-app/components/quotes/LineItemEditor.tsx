"use client";

import { useState } from "react";
import { ListPlus, Plus, Sparkles, Trash2, Wrench } from "lucide-react";
import NumberField from "@/components/NumberField";
import PriceListPicker, { type PickedPriceLine } from "@/components/quotes/PriceListPicker";
import { LineItem, roundMoney } from "@/lib/storage";

interface LineItemEditorProps {
  items: LineItem[];
  onAddItem: (type: "material" | "labor") => void;
  onAddPrice?: (item: PickedPriceLine) => void;
  /** When set, the price button opens the picker on the quote page instead of a second one here. */
  onBrowsePrices?: () => void;
  onUpdateItem: (id: string, field: keyof LineItem, value: string | number) => void;
  onDeleteItem: (id: string) => void;
  isAiDraft: boolean;
  estimateOnly?: boolean;
  onAcknowledgeAiDraft: () => void;
  heading?: string;
}

export default function LineItemEditor({
  items,
  onAddItem,
  onAddPrice,
  onBrowsePrices,
  onUpdateItem,
  onDeleteItem,
  isAiDraft,
  estimateOnly = false,
  onAcknowledgeAiDraft,
  heading = "Quote Line Items",
}: LineItemEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const fromList = items.filter((item) => item.usualPrice).length;

  const openPicker = () => {
    if (onBrowsePrices) {
      onBrowsePrices();
      return;
    }
    setPickerOpen(true);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs min-w-0 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
          <Wrench className="w-4 h-4 text-slate-500 shrink-0" />
          <span>{heading}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAddItem("material")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-200 active:scale-95 active:bg-slate-300"
          >
            <Plus className="w-3.5 h-3.5" /> Material
          </button>
          <button
            type="button"
            onClick={() => onAddItem("labor")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-clay-200 bg-clay-50 px-3.5 text-sm font-bold text-clay-800 shadow-2xs transition hover:bg-clay-100 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Labour
          </button>
        </div>
      </div>

      {onAddPrice ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={openPicker}
            aria-expanded={pickerOpen}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-clay-700 px-3.5 text-base font-bold text-white shadow-sm transition hover:bg-clay-800 active:scale-[0.99]"
          >
            <ListPlus className="h-5 w-5" aria-hidden="true" />
            Add from my price list
          </button>
          {pickerOpen && !onBrowsePrices && onAddPrice ? (
            <PriceListPicker
              onClose={() => setPickerOpen(false)}
              onAddLines={(lines) => {
                for (const line of lines) onAddPrice(line);
              }}
            />
          ) : null}
        </div>
      ) : null}

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
              ) : fromList > 0 ? (
                <>
                  <strong>
                    {fromList === 1 ? "1 line is from your price list." : `${fromList} lines are from your price list.`}
                  </strong>{" "}
                  Check the quantities and any other lines before you send this quote.
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
            className="inline-flex min-h-11 shrink-0 items-center text-left font-bold text-amber-800 underline sm:text-right"
          >
            Acknowledge & Mark Checked
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm font-medium text-slate-500">
            No lines yet. Add a price from your list, or add materials or labour.
          </p>
        </div>
      ) : (
        <div className="space-y-3 min-w-0">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 min-w-0"
            >
              <span
                className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  item.type === "labor"
                    ? "bg-clay-100 text-clay-800"
                    : item.type === "material"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {item.type === "labor" ? "Labour" : item.type === "material" ? "Material" : "Service"}
              </span>

              <label className="sr-only" htmlFor={`line-desc-${item.id}`}>
                Description
              </label>
              <input
                id={`line-desc-${item.id}`}
                type="text"
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, "description", e.target.value)}
                className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-semibold text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-clay-700"
                placeholder="Item description"
              />

              <div className="grid grid-cols-2 gap-2 min-w-0">
                <label className="min-w-0">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">Qty</span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <NumberField
                      value={item.quantity}
                      aria-label={`Quantity for ${item.description || "line"}`}
                      onValue={(next) => onUpdateItem(item.id, "quantity", next ?? 0)}
                      className="min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2 py-2 text-center text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-clay-700"
                    />
                    <span className="text-xs text-slate-600 font-bold shrink-0 max-w-16 truncate">{item.unit}</span>
                  </span>
                </label>

                <label className="min-w-0">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">Rate</span>
                  <span className="flex items-center gap-1 min-w-0">
                    <span className="text-xs text-slate-500 font-semibold shrink-0">£</span>
                    <NumberField
                      value={item.rate}
                      aria-label={`Rate for ${item.description || "line"}`}
                      onValue={(next) => onUpdateItem(item.id, "rate", next ?? 0)}
                      className="min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2 py-2 text-right text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-clay-700"
                    />
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <span className="text-base font-extrabold tabular-nums text-slate-900">
                    £{roundMoney(item.quantity * item.rate).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {item.usualPrice ? (
                    <span className="mt-1 flex w-fit rounded-full bg-clay-100 px-2 py-1 text-xs font-bold text-clay-900">
                      From your price list
                    </span>
                  ) : item.rateSource === "settings" ? (
                    <span className="mt-1 flex w-fit rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-800">
                      Your rate from Settings
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-700 active:scale-90 active:bg-red-100"
                  aria-label={`Delete ${item.description || "line"}`}
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
