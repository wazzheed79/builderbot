"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { brand } from "@/lib/brand.mjs";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        Sentry.captureException(error);
      } catch {
        // The on-page message still has to render.
      }
    }
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "render_error",
        path: typeof window !== "undefined" ? window.location.pathname : "",
        detail: (error.message || "page error").slice(0, 300),
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl font-black text-ink">Something went wrong</h1>
      <p className="text-sm text-stone-600">
        {brand.name} hit a problem on this page. Your quotes are still stored in this browser
        if you have not signed in.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center justify-center bg-clay-700 hover:bg-clay-800 text-white font-bold px-5 py-3 rounded-xl"
      >
        Try again
      </button>
    </div>
  );
}
