"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  canonicalUnit,
  OWN_PRICES_LINE,
  PRICE_UNITS,
  unitLabel,
} from "@/lib/price-memory.mjs";
import {
  deletePriceListEntry,
  loadPriceList,
  savePriceListEntry,
  type RememberedPrice,
} from "@/lib/price-memory";

const EXAMPLE_NAME = "15mm copper pipe";
const EXAMPLE_RATE = "4.50";

function pounds(rate: number) {
  const amount = Number(rate);
  if (!Number.isFinite(amount)) return "£0.00";
  return `£${amount.toFixed(2)}`;
}

function PriceRow({
  name,
  unit,
  rate,
  example = false,
  pendingDelete = false,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  name: string;
  unit: string;
  rate: string;
  example?: boolean;
  pendingDelete?: boolean;
  onEdit?: () => void;
  onAskDelete?: () => void;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}) {
  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {example ? (
            <p className="text-[11px] font-bold uppercase tracking-wider text-clay-800">Example. Not saved.</p>
          ) : null}
          <p className="text-base font-bold text-ink break-words">{name}</p>
          <p className="mt-1 text-sm font-medium text-stone-600">{unit}</p>
        </div>
        <p className="text-lg font-black tabular-nums text-ink">{rate}</p>
      </div>
      {example ? null : pendingDelete ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onConfirmDelete}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-700 px-3 text-base font-bold text-white"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-base font-bold text-ink"
          >
            Keep
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 text-base font-bold text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={onAskDelete}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-base font-bold text-red-800"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function PriceListClient() {
  const { user, loading } = useAuth();
  const signedIn = Boolean(user);
  const userId = user?.id ?? "";
  const [items, setItems] = useState<RememberedPrice[]>([]);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadedFor, setLoadedFor] = useState("");
  const [busy, setBusy] = useState(false);
  const loadingList = signedIn && loadedFor !== userId;
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("each");
  const [rate, setRate] = useState("");
  const [editingKey, setEditingKey] = useState("");
  const [pendingDelete, setPendingDelete] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadPriceList().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setItems([]);
        setListError(result.error);
      } else {
        setItems(result.items);
        setListError("");
      }
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const shown = useMemo(
    () => [...items].sort((a, b) => a.description.localeCompare(b.description, "en-GB")),
    [items]
  );

  const unitChoices = useMemo(() => {
    const choices = PRICE_UNITS.map((option) => ({ id: option.id, label: option.label }));
    if (unit && !choices.some((option) => option.id === unit)) {
      choices.push({ id: unit, label: unitLabel(unit) });
    }
    return choices;
  }, [unit]);

  const resetForm = () => {
    setDescription("");
    setUnit("each");
    setRate("");
    setEditingKey("");
  };

  const onSave = async () => {
    setNotice("");
    setListError("");
    if (!signedIn) return;
    setBusy(true);
    const result = await savePriceListEntry(
      items,
      { description, unit, rate, itemType: items.find((row) => row.key === editingKey)?.itemType },
      editingKey
    );
    setBusy(false);
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    setItems(result.items);
    setNotice(editingKey ? "Price updated." : "Price saved. New quotes will use it.");
    resetForm();
  };

  const onDelete = async (key: string) => {
    setNotice("");
    setListError("");
    setBusy(true);
    const result = await deletePriceListEntry(items, key);
    setBusy(false);
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    setItems(result.items);
    setPendingDelete("");
    if (editingKey === key) resetForm();
    setNotice("Price deleted.");
  };

  const startEdit = (item: RememberedPrice) => {
    setDescription(item.description);
    setUnit(canonicalUnit(item.unit) || item.unit || "each");
    setRate(String(item.rate));
    setEditingKey(item.key);
    setPendingDelete("");
    setNotice("");
    setListError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/settings" className="inline-flex min-h-11 items-center text-sm font-bold text-clay-800 underline">
        Back to settings
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">My price list</h1>
      <p className="mt-3 text-base leading-relaxed text-stone-700">{OWN_PRICES_LINE}</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Add materials and jobs you price often. Prices you type on a quote are kept here too. You still check every line before you send it.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Your day rate, hourly rate, and material markup stay in{" "}
        <Link href="/settings" className="font-bold text-clay-800 underline">
          Settings
        </Link>
        .
      </p>

      {loading ? <p className="mt-6 text-base font-medium text-stone-600">Loading your price list…</p> : null}

      {!loading && !signedIn ? (
        <div className="mt-6 space-y-4">
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-950">
            Example only. Nothing is saved until you sign in.
          </p>
          <fieldset disabled className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
            <legend className="px-1 text-sm font-black text-ink">Add a price</legend>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <label className="block text-sm font-bold text-ink" htmlFor="example-price-name">
                Name
                <input
                  id="example-price-name"
                  value={EXAMPLE_NAME}
                  readOnly
                  className="mt-1 w-full min-h-11 rounded-xl border border-stone-300 bg-stone-50 px-3 text-base text-ink"
                />
              </label>
              <label className="block text-sm font-bold text-ink" htmlFor="example-price-unit">
                Unit
                <select
                  id="example-price-unit"
                  value="m"
                  className="mt-1 w-full min-h-11 rounded-xl border border-stone-300 bg-stone-50 px-3 text-base text-ink"
                >
                  <option value="m">per metre</option>
                </select>
              </label>
              <label className="block text-sm font-bold text-ink" htmlFor="example-price-rate">
                Price (£)
                <input
                  id="example-price-rate"
                  value={EXAMPLE_RATE}
                  readOnly
                  className="mt-1 w-full min-h-11 rounded-xl border border-stone-300 bg-stone-50 px-3 text-base text-ink"
                />
              </label>
              <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-300 px-4 text-base font-bold text-stone-700">
                <Plus className="h-5 w-5" aria-hidden="true" />
                Add price
              </span>
            </div>
          </fieldset>
          <ul className="space-y-3">
            <PriceRow name={EXAMPLE_NAME} unit="per metre" rate="£4.50" example />
          </ul>
          <Link
            href="/login?next=/settings/prices"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-clay-700 px-4 text-base font-extrabold text-white"
          >
            Sign in to save your prices
          </Link>
        </div>
      ) : null}

      {!loading && signedIn ? (
        <form
          className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <h2 className="text-lg font-black text-ink">{editingKey ? "Edit price" : "Add a price"}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="block text-sm font-bold text-ink" htmlFor="price-name">
              Name
              <input
                id="price-name"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={180}
                required
                placeholder="15mm copper pipe"
                className="mt-1 w-full min-h-11 rounded-xl border border-stone-300 px-3 text-base text-ink"
              />
            </label>
            <label className="block text-sm font-bold text-ink" htmlFor="price-unit">
              Unit
              <select
                id="price-unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="mt-1 w-full min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-base text-ink"
              >
                {unitChoices.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-ink" htmlFor="price-rate">
              Price (£)
              <input
                id="price-rate"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                placeholder="4.50"
                className="mt-1 w-full min-h-11 rounded-xl border border-stone-300 px-3 text-base text-ink"
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={busy || loadingList}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-clay-700 px-4 text-base font-extrabold text-white disabled:opacity-60"
            >
              {editingKey ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
              {busy ? "Saving…" : editingKey ? "Save changes" : "Add price"}
            </button>
            {editingKey ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-base font-bold text-ink"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-950" role="status">
          {notice}
        </p>
      ) : null}
      {listError ? (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-950" role="alert">
          {listError}
        </p>
      ) : null}

      {!loading && signedIn ? (
        <section className="mt-6" aria-labelledby="saved-prices-heading">
          <h2 id="saved-prices-heading" className="text-lg font-black text-ink">
            Saved prices
            {shown.length > 0 ? <span className="ml-2 text-sm font-bold text-stone-500">{shown.length}</span> : null}
          </h2>
          {loadingList ? <p className="mt-3 text-sm font-medium text-stone-600">Loading…</p> : null}
          {!loadingList && shown.length === 0 && !listError ? (
            <p className="mt-3 text-base text-stone-700">
              No prices yet. Add one above, or type a price on a quote and it will show up here.
            </p>
          ) : null}
          <ul className="mt-3 space-y-3">
            {shown.map((item) => (
              <PriceRow
                key={item.key}
                name={item.description || item.key}
                unit={unitLabel(item.unit)}
                rate={pounds(item.rate)}
                pendingDelete={pendingDelete === item.key}
                onEdit={() => startEdit(item)}
                onAskDelete={() => setPendingDelete(item.key)}
                onCancelDelete={() => setPendingDelete("")}
                onConfirmDelete={() => void onDelete(item.key)}
              />
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            You can save 80 prices. The latest 40 are named in an AI draft. Every saved price can still replace a matching line.
          </p>
        </section>
      ) : null}
    </div>
  );
}
