import { tierChangeHeading, visibleTierChanges } from "@/lib/tier-differences.mjs";

/**
 * Short points under a Standard, Better, or Premium price.
 * Rendered as lines inside a button, so the markup stays valid phrasing content.
 * Quotes saved before these points existed show the price alone.
 */
export default function TierChangeList({
  label,
  changes,
}: {
  label: string;
  changes?: unknown;
}) {
  const lines = visibleTierChanges({ label, changes });
  if (lines.length === 0) return null;
  return (
    <span className="mt-2 block border-t border-stone-200 pt-2">
      <span className="block text-[11px] font-bold uppercase tracking-wide text-stone-500">
        {tierChangeHeading(label)}
      </span>
      {lines.map((line) => (
        <span key={line} className="mt-1 block text-sm leading-snug text-stone-700">
          <span aria-hidden="true">• </span>
          {line}
        </span>
      ))}
    </span>
  );
}
