"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Sparkles, ArrowRight } from "lucide-react";
import { HOME_NOTES_KEY } from "@/lib/home-notes";
import { useAuth } from "./AuthProvider";

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

const DEMO_JOBS = [
  {
    icon: "🚰",
    label: "Shower & Towel Rail",
    trade: "Plumbing",
    text: "En-suite shower replacement. Supply and fit thermostatic bar shower kit, riser rail, and chrome heated towel rail. Replace isolating valves and test. About 1 day on site.",
  },
  {
    icon: "⚡",
    label: "Fuse Board Swap",
    trade: "Electrical",
    text: "Replace old fuse box with 10-way dual RCD metal consumer unit with surge protection (SPD). Test all existing circuits and issue an Electrical Installation Certificate (EIC). 1 day labour.",
  },
  {
    icon: "🪚",
    label: "Garden Decking",
    trade: "Joinery",
    text: "Build 20m² treated timber decking in back garden. Dig out and set 6 concrete footings, 4x2 treated sub-frame, grooved decking boards, handrail on one side. 2 days for 2 of us.",
  },
  {
    icon: "🎨",
    label: "Decorate Room",
    trade: "Decorating",
    text: "Prep, line and paint 4x5m living room. Fill cracks, 2 coats vinyl matt on ceiling and walls, gloss skirting boards and door frame. 2 days labour including paint & materials.",
  },
];

export default function HomeVoice() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [notes, setNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const [hint, setHint] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

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
            setNotes((prev) => `${prev ? prev + " " : ""}${text}`.slice(0, 2000));
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
      setHint("Stopped. Read the notes, then build the quote.");
      return;
    }
    try {
      recognitionRef.current.start();
      setRecording(true);
      setHint("Listening. Talk about the job for about 30 seconds, then tap stop.");
    } catch {
      setRecording(false);
      setHint("Could not start the microphone. Type the job instead.");
    }
  };

  const buildQuote = (textOverride?: string) => {
    const text = (textOverride || notes).trim();
    if (text.length < 3) {
      setHint("Say or type a few words about the job first, or tap an example.");
      return;
    }
    sessionStorage.setItem(HOME_NOTES_KEY, text.slice(0, 2000));
    if (loading) {
      setHint("One moment…");
      return;
    }
    router.push(user ? "/quotes" : "/try");
  };

  const handleSelectDemo = (job: typeof DEMO_JOBS[0]) => {
    setSelectedDemo(job.label);
    setNotes(job.text);
    setHint(`Loaded ${job.trade} example. Tap "Build this quote" below to see it live!`);
  };

  return (
    <div className="mt-8 w-full rounded-2xl border-2 border-clay-200 bg-white p-4 text-left shadow-lg sm:p-5">
      <div className="flex items-center justify-between">
        <label htmlFor="home-notes" className="block text-sm font-black text-ink">
          Talk, type, or try a 1-tap example
        </label>
        <span className="text-[11px] font-bold text-clay-700 uppercase tracking-wider bg-clay-50 px-2 py-0.5 rounded-md border border-clay-200">
          Instant
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">
        Tap the mic to speak from the van, type rough notes, or tap an example below to test in 2 seconds.
      </p>

      {/* 1-Tap Quick Example Chips */}
      <div className="mt-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-clay-600" />
          <span>Quick 1-tap examples:</span>
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
          {DEMO_JOBS.map((job) => {
            const isSelected = selectedDemo === job.label;
            return (
              <button
                key={job.label}
                type="button"
                onClick={() => handleSelectDemo(job)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 text-left ${
                  isSelected
                    ? "border-clay-600 bg-clay-50 text-clay-900 shadow-xs ring-1 ring-clay-600"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:border-clay-400 hover:bg-clay-50 hover:text-clay-800"
                }`}
              >
                <span>{job.icon}</span>
                <span className="truncate">{job.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleVoice}
        className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold text-white shadow-md active:scale-[0.98] ${
          recording ? "animate-pulse bg-red-600" : "bg-clay-700 hover:bg-clay-800"
        }`}
      >
        {recording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        <span>{recording ? "Stop talking" : "Tap and talk from the van"}</span>
      </button>

      <textarea
        id="home-notes"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value.slice(0, 2000));
          setSelectedDemo(null);
        }}
        rows={4}
        placeholder="Or type notes here: e.g. Replace consumer unit, 10 ways with SPD, test and certify, 1 day on site."
        className="mt-3 w-full min-w-0 rounded-xl border border-stone-300 bg-paper px-3 py-3 text-base text-ink focus:border-clay-600 focus:outline-hidden focus:ring-1 focus:ring-clay-600"
      />

      {hint && (
        <p className="mt-2 text-sm font-medium text-clay-800 bg-clay-50/80 p-2 rounded-lg border border-clay-200">
          💡 {hint}
        </p>
      )}

      <button
        type="button"
        onClick={() => buildQuote()}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-base font-extrabold text-white transition hover:bg-stone-800 active:scale-[0.98] shadow-md"
      >
        <span>Build this quote</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
