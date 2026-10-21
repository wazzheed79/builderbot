"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    try {
      Sentry.captureException(error);
    } catch {
      // The page still needs a way back when reporting itself fails.
    }
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="min-h-full bg-paper px-4 py-16 text-ink">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-black">Something went wrong</h1>
          <p className="mt-3 text-sm text-stone-600">
            This page hit a problem. Your quotes stay on this phone if you have not signed in.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-clay-700 px-5 font-bold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
