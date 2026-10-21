"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

/**
 * Signed-out visitors get a free-account link. Someone already signed in
 * goes to the quote builder. Auth itself is unchanged.
 */
export default function HomeCtas({ tone = "paper" }: { tone?: "paper" | "ink" }) {
  const { user, loading } = useAuth();
  const onInk = tone === "ink";
  const signedIn = !loading && Boolean(user);

  const primary = onInk
    ? "bg-white text-ink hover:bg-paper"
    : "bg-clay-700 text-white hover:bg-clay-800";
  const secondary = onInk
    ? "border border-white/40 text-white hover:bg-white/10"
    : "border border-stone-300 bg-white text-ink hover:bg-paper";

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      {signedIn ? (
        <>
          <Link
            href="/quotes"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800 ${primary}`}
          >
            Open the quote builder
          </Link>
          <Link
            href="/dashboard"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800 ${secondary}`}
          >
            Dashboard
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800 ${primary}`}
          >
            Create a free account
          </Link>
          <Link
            href="/quotes"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800 ${secondary}`}
          >
            Try a quote first
          </Link>
        </>
      )}
    </div>
  );
}
