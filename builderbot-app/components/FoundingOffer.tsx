import { brand } from "@/lib/brand.mjs";

export default function FoundingOffer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-clay-200 bg-clay-50 px-4 py-3 text-left shadow-xs">
      <p className="text-xs font-extrabold uppercase tracking-wider text-clay-800">
        {brand.foundingTitle}
      </p>
      <p className={`mt-1 font-semibold text-ink ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
        {brand.foundingDetail}
      </p>
      <p className="mt-1 text-xs text-stone-600">
        No card needed. The free period is 12 months from sign-up. There is no live counter on this page.
      </p>
    </div>
  );
}
