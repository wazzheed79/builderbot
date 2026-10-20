import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page is not here. Start again from the home page.",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-start justify-center px-4 py-16">
      <p className="text-sm font-bold uppercase tracking-wide text-clay-700">Page not found</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">That page is not here</h1>
      <p className="mt-3 text-base leading-relaxed text-stone-700">
        The link may be old, or the page may have moved. {brand.name} is still here if you want to
        start a quote.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-clay-700 px-4 py-2 text-sm font-bold text-white hover:bg-clay-800"
      >
        Back to {brand.name}
      </Link>
    </div>
  );
}
