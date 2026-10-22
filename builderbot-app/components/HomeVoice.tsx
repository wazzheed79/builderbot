"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
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

export default function HomeVoice() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [notes, setNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const [hint, setHint] = useState("");

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

  const buildQuote = () => {
    const text = notes.trim();
    if (text.length < 3) {
      setHint("Say or type a few words about the job first.");
      return;
    }
    sessionStorage.setItem(HOME_NOTES_KEY, text.slice(0, 2000));
    if (loading) {
      setHint("One moment…");
      return;
    }
    router.push(user ? "/quotes" : "/try");
  };

  return (
    <div className="mt-8 w-full rounded-2xl border-2 border-clay-200 bg-white p-4 text-left shadow-lg sm:p-5">
      <label htmlFor="home-notes" className="block text-sm font-black text-ink">
        Talk, or type the job
      </label>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">
        Tap the button and describe the job, or type a few notes. With no account, this opens a free try-out.
      </p>
      <button
        type="button"
        onClick={toggleVoice}
        className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold text-white shadow-md active:scale-[0.98] ${
          recording ? "animate-pulse bg-red-600" : "bg-clay-700 hover:bg-clay-800"
        }`}
      >
        {recording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        <span>{recording ? "Stop talking" : "Tap and talk"}</span>
      </button>
      <textarea
        id="home-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value.slice(0, 2000))}
        rows={4}
        placeholder="Kitchen tap is leaking. Replace the tap, check the pipe, about an hour on site."
        className="mt-3 w-full min-w-0 rounded-xl border border-stone-300 bg-paper px-3 py-3 text-base text-ink"
      />
      {hint && <p className="mt-2 text-sm font-medium text-clay-800">{hint}</p>}
      <button
        type="button"
        onClick={buildQuote}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-ink px-4 text-base font-extrabold text-white active:scale-[0.98]"
      >
        Build this quote
      </button>
    </div>
  );
}
