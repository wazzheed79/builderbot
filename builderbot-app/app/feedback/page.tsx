"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand.mjs";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [note, setNote] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setNote("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          contact,
          page: typeof window !== "undefined" ? window.location.pathname : "/feedback",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setNote(data.error || "Could not send that. Please try again.");
        return;
      }
      setStatus("sent");
      setMessage("");
      setNote(
        data.stored
          ? "Thank you. The note has been saved."
          : "Thank you. The note has been recorded in the site logs."
      );
    } catch {
      setStatus("error");
      setNote("Could not reach the site. Check your connection and try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="text-sm font-semibold text-clay-800 hover:underline">
        Back
      </Link>
      <h1 className="mt-3 text-3xl font-black text-ink">Tell us what to fix</h1>
      <p className="mt-2 text-sm text-stone-600">
        {brand.name} is free while in testing. A short note about what confused you is the most
        useful thing you can send. Or email{" "}
        <a className="font-semibold text-clay-800 underline" href={`mailto:${brand.ownerEmail}`}>
          {brand.ownerEmail}
        </a>.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-ink">
          What happened?
          <textarea
            required
            minLength={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-1 w-full min-h-32 rounded-xl border border-stone-300 bg-white px-3 py-3 text-base"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Email or phone (optional)
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-clay-700 px-5 font-bold text-white hover:bg-clay-800 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send feedback"}
        </button>
        {note && <p className="text-sm text-stone-700">{note}</p>}
      </form>
    </div>
  );
}
