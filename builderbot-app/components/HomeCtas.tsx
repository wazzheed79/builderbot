"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

/**
 * Signed-out visitors get a no-account try-out first, then a free-account
 * link. Someone already signed in goes to the quote builder.
 */
export default function HomeCtas({
  tone = "paper",
  className = "mt-6",
}: {
  tone?: "paper" | "ink";
  className?: string;
}) {
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
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
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
            href="/try"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800 ${primary}`}
          >
            Try it free – no sign-up
          </Link>
          <Link
            href="/login"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800 ${secondary}`}
          >
            Create a free account
          </Link>
        </>
      )}
    </div>
  );
}
