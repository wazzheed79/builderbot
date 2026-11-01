import { Loader2 } from "lucide-react";

export default function CustomerQuoteLoading() {
  return (
    <div className="min-h-screen bg-paper px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 pt-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" aria-hidden="true" />
        <p className="text-base font-bold text-ink">Opening customer link…</p>
        <div className="mt-2 w-full space-y-3" aria-hidden="true">
          <div className="h-24 animate-pulse rounded-2xl border border-stone-200 bg-white" />
          <div className="h-40 animate-pulse rounded-2xl border border-stone-200 bg-white" />
          <div className="h-64 animate-pulse rounded-2xl border border-stone-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
