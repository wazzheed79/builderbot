"use client";

import { useEffect } from "react";

/** Sends a short, cookieless note when the page hits a script error. */
export default function ClientErrorReporter() {
  useEffect(() => {
    const send = (detail: string) => {
      const body = JSON.stringify({
        name: "client_error",
        path: window.location.pathname,
        detail: detail.slice(0, 300),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
        return;
      }
      fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      send(event.message || "script error");
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || "");
      send(reason || "unhandled rejection");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
