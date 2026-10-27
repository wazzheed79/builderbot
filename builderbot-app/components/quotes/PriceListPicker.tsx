"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { lineFromPriceList, linesFromPriceList, unitLabel } from "@/lib/price-memory.mjs";
import { loadPriceList, type RememberedPrice } from "@/lib/price-memory";

export interface PickedPriceLine {
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  usualPrice?: boolean;
  rateSource?: "list" | "settings";
}

function pounds(rate: number) {
  const amount = Number(rate);
  if (!Number.isFinite(amount)) return "£0.00";
  return `£${amount.toFixed(2)}`;
}

function asLine(row: RememberedPrice): PickedPriceLine | null {
  return lineFromPriceList(row) as PickedPriceLine | null;
}

/**
 * Saved prices for the quote that is open. Ticking or tapping Add puts them on
 * the quote. It does not open the page where the list is edited.
 */
export default function PriceListPicker({
  onAddLines,
  onClose,
}: {
  onAddLines: (lines: PickedPriceLine[]) => void;
  onClose: () => void;
}) {
  const [priceRows, setPriceRows] = useState<RememberedPrice[] | null>(null);
  const [pickerError, setPickerError] = useState("");
  const [pickerQuery, setPickerQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadPriceList().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setPriceRows([]);
        setPickerError(result.error);
        return;
      }
      setPriceRows(result.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shownPrices = useMemo(() => {
    const rows = priceRows ?? [];
    const query = pickerQuery.trim().toLowerCase();
    return [...rows]
      .filter((row) => {
        if (!query) return true;
        return (
          row.description.toLowerCase().includes(query) ||
          unitLabel(row.unit).toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.description.localeCompare(b.description, "en-GB"));
  }, [pickerQuery, priceRows]);

  const addRows = (rows: RememberedPrice[]) => {
    const lines = linesFromPriceList(rows) as PickedPriceLine[];
    if (!lines.length) return;
    onAddLines(lines);
    setPicked((current) => current.filter((key) => !rows.some((row) => row.key === key)));
  };

  const toggle = (key: string) => {
    setPicked((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const selectedRows = shownPrices.filter((row) => picked.includes(row.key));

  return (
    <div id="quote-price-picker" className="mt-3 rounded-2xl border border-clay-200 bg-paper/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-black text-ink">Add saved prices</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-clay-800 underline"
        >
          Close
        </button>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Tick the prices you want, or tap Add. This stays on the quote. It does not change your saved list.
      </p>
      <label className="mt-3 block text-sm font-bold text-ink" htmlFor="price-list-search">
        Search
        <input
          id="price-list-search"
          value={pickerQuery}
          onChange={(event) => setPickerQuery(event.target.value)}
          placeholder="Boiler, pipe, labour…"
          className="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base text-ink"
        />
      </label>
      {priceRows === null ? <p className="mt-3 text-sm font-medium text-stone-600">Loading your prices…</p> : null}
      {pickerError ? (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-950" role="alert">
          {pickerError}{" "}
          <Link href="/login?next=/quotes" className="underline">
            Sign in
          </Link>
        </p>
      ) : null}
      {priceRows && priceRows.length === 0 && !pickerError ? (
        <p className="mt-3 text-sm text-stone-700">
          No prices saved yet.{" "}
          <Link href="/settings/prices" className="font-bold text-clay-800 underline">
            Edit price list
          </Link>{" "}
          to add some, then come back to this quote.
        </p>
      ) : null}
      {priceRows && priceRows.length > 0 && shownPrices.length === 0 ? (
        <p className="mt-3 text-sm text-stone-700">Nothing matches that search.</p>
      ) : null}
      <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
        {shownPrices.map((row) => {
          const line = asLine(row);
          return (
            <li key={row.key} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2">
              <label className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-1">
                <input
                  type="checkbox"
                  className="h-6 w-6 shrink-0 accent-clay-700"
                  checked={picked.includes(row.key)}
                  onChange={() => toggle(row.key)}
                  aria-label={`Select ${row.description}`}
                />
                <span className="min-w-0">
                  <span className="block text-base font-bold text-ink break-words">{row.description}</span>
                  <span className="block text-sm font-medium text-stone-600">
                    {unitLabel(row.unit)} · {pounds(row.rate)}
                  </span>
                </span>
              </label>
              <button
                type="button"
                disabled={!line}
                onClick={() => addRows([row])}
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-clay-700 px-3 text-base font-bold text-white disabled:opacity-50"
              >
                Add
              </button>
            </li>
          );
        })}
      </ul>
      {selectedRows.length > 0 ? (
        <button
          type="button"
          onClick={() => addRows(selectedRows)}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-clay-700 px-4 text-base font-bold text-white"
        >
          {selectedRows.length === 1 ? "Add 1 selected price" : `Add ${selectedRows.length} selected prices`}
        </button>
      ) : null}
      <Link href="/settings/prices" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-clay-800 underline">
        Edit price list
      </Link>
    </div>
  );
}
