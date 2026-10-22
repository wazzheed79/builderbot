"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import GuestQuotePreview, { type GuestPreviewQuote } from "@/components/demo/GuestQuotePreview";
import { captureEvent } from "@/lib/analytics";
import { CONSENT_EVENT } from "@/lib/analytics-rules.mjs";
import {
  GUEST_EXAMPLES,
  GUEST_NOTES_MAX,
  readGuestDemoQuote,
  writeGuestDemoQuote,
} from "@/lib/guest-demo.mjs";
import { HOME_NOTES_KEY } from "@/lib/home-notes";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: SpeechRecognitionResultItem;
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function isPreviewQuote(value: unknown): value is GuestPreviewQuote {
  if (!value || typeof value !== "object") return false;
  const row = value as GuestPreviewQuote;
  return row.previewOnly === true && Array.isArray(row.items) && row.items.length > 0;
}

export default function TryClient() {
  const { user, loading } = useAuth();
  const signedIn = !loading && Boolean(user);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const started = useRef(false);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [notes, setNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<GuestPreviewQuote | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (mounted && !hydrated) {
    setHydrated(true);
    try {
      const saved = readGuestDemoQuote(window.localStorage);
      if (isPreviewQuote(saved)) setQuote(saved);
      const pending = sessionStorage.getItem(HOME_NOTES_KEY);
      if (pending) {
        setNotes(pending.slice(0, GUEST_NOTES_MAX));
        sessionStorage.removeItem(HOME_NOTES_KEY);
      }
    } catch {
      // A private browser can refuse storage. The try-out still works.
    }
  }

  useEffect(() => {
    const trackStarted = () => {
      if (started.current) return;
      if (captureEvent("demo_started")) started.current = true;
    };
    trackStarted();
    window.addEventListener(CONSENT_EVENT, trackStarted);
    return () => window.removeEventListener(CONSENT_EVENT, trackStarted);
  }, []);

  useEffect(() => {
    const windowObj = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            setNotes((prev) => `${prev ? `${prev} ` : ""}${text}`.slice(0, GUEST_NOTES_MAX));
          }
        }
      }
    };
    recognition.onerror = () => {
      setRecording(false);
      setHint("The microphone stopped. You can type the job instead.");
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      setHint("This phone can't use the microphone here. Type a few notes instead.");
      return;
    }
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setRecording(true);
      setHint("Listening. Talk about the job, then tap stop.");
    } catch {
      setRecording(false);
      setHint("Could not start the microphone. Type the job instead.");
    }
  };

  const buildQuote = async (text: string) => {
    const notesText = text.trim().slice(0, GUEST_NOTES_MAX);
    setNotes(notesText);
    setError("");
    if (notesText.length < 3) {
      setError("Type a few words about the job.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/quote/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !isPreviewQuote(data)) {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Could not build that quote. Please try again."
        );
        return;
      }
      setQuote(data);
      writeGuestDemoQuote(window.localStorage, data, new Date().toISOString());
      captureEvent("demo_quote_generated", { ai_used: data.aiPowered === true });
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch {
      setError("Could not reach the quote helper. Check the signal and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-clay-800">
        Free try-out. No account.
      </p>
      <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">
        Try a quote before you sign up
      </h1>
      <p className="mt-3 text-base leading-relaxed text-stone-700">
        Type the job, or tap an example. You get an itemised quote with Standard, Better, and
        Premium, and a preview of the page your customer would open. Nothing is saved or sent.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {GUEST_EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            disabled={busy}
            onClick={() => void buildQuote(example.notes)}
            className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-base font-bold text-ink hover:bg-paper disabled:opacity-60"
          >
            {example.label}
          </button>
        ))}
      </div>

      <label htmlFor="try-notes" className="mt-6 block text-sm font-black text-ink">
        Job notes
      </label>
      <textarea
        id="try-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value.slice(0, GUEST_NOTES_MAX))}
        rows={5}
        maxLength={GUEST_NOTES_MAX}
        placeholder="Kitchen tap is leaking. Replace the tap and check the pipe. About an hour on site."
        className="mt-2 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-ink"
      />
      <p className="mt-1 text-xs text-stone-500">{notes.length}/{GUEST_NOTES_MAX}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
        <button
          type="button"
          onClick={toggleVoice}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-bold text-white ${
            recording ? "bg-red-600" : "bg-stone-800"
          }`}
        >
          {recording ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
          {recording ? "Stop" : "Talk"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void buildQuote(notes)}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-clay-700 px-4 text-base font-extrabold text-white hover:bg-clay-800 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-5 w-5" aria-hidden="true" />}
          {busy ? "Writing the quote…" : "Build my quote"}
        </button>
      </div>
      {hint && <p className="mt-2 text-sm font-medium text-clay-800">{hint}</p>}
      {error && (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-950" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm text-stone-600">
        A few free tries a day from this phone. Prices are a suggestion. You check them before anyone else sees them.
      </p>

      {quote && (
        <div ref={resultRef} className="mt-8 space-y-4">
          {quote.notice && (
            <p className="rounded-xl border border-clay-200 bg-clay-50 px-3 py-3 text-sm font-semibold text-clay-900">
              {quote.estimateOnly ? "Rough estimate. " : "AI draft. "}
              {quote.notice}
            </p>
          )}
          <GuestQuotePreview quote={quote} />
          <div className="rounded-2xl bg-ink p-5 text-white sm:p-6">
            <h2 className="text-2xl font-black tracking-tight">
              {signedIn ? "Save this in your account" : "Sign up free to send this"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              {signedIn
                ? "Open it in the quote builder, add your business name, then save it and send the link for your customer to sign."
                : "Create a free account and this quote will be waiting in the builder. Add your business name, check the prices, then send a link and get it signed. No card."}
            </p>
            <Link
              href={signedIn ? "/quotes" : "/login?next=/quotes"}
              onClick={() => {
                if (!signedIn) captureEvent("demo_signup_clicked");
              }}
              className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-white px-4 text-base font-extrabold text-ink"
            >
              {signedIn ? "Open it in the quote builder" : "Create a free account"}
            </Link>
            {!signedIn && (
              <p className="mt-3 text-xs leading-relaxed text-white/80">
                The try-out cannot email anyone or make a customer link. That starts after you save the quote in your account.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
