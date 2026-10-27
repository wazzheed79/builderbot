"use client";

import { useState } from "react";
import { deleteQuote } from "@/lib/storage";
import { clearWorkingDraft, readWorkingDraft } from "@/lib/quote-autosave.mjs";
import { forgetWorkingDraftIfQuote } from "@/lib/quote-discard.mjs";

/** Remove a draft from the list, and forget it so sign-in does not offer it back. */
export function deleteDraftQuoteNow(id: string) {
  if (typeof window !== "undefined") {
    forgetWorkingDraftIfQuote(window.localStorage, id);
    const still = readWorkingDraft(window.localStorage);
    if (still && (still.activeQuoteId === id || still.cloudDraftId === id)) {
      clearWorkingDraft(window.localStorage);
    }
  }
  deleteQuote(id);
}

export default function DeleteDraftQuote({
  id,
  name,
  onDeleted,
}: {
  id: string;
  name?: string;
  onDeleted?: () => void;
}) {
  const [ask, setAsk] = useState(false);
  if (!ask) {
    return (
      <button
        type="button"
        onClick={() => setAsk(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-800"
      >
        Delete
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3" role="dialog" aria-label="Delete draft quote">
      <p className="text-sm font-semibold text-red-950">
        Delete this draft{name ? ` (${name})` : ""}? It will not come back when you sign in.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            deleteDraftQuoteNow(id);
            setAsk(false);
            onDeleted?.();
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-700 px-4 text-sm font-bold text-white"
        >
          Delete draft
        </button>
        <button
          type="button"
          onClick={() => setAsk(false)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-ink"
        >
          Keep
        </button>
      </div>
    </div>
  );
}
