"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Mic,
  ArrowRight,
  Check,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  WALKTHROUGH_SCENES,
  WALKTHROUGH_STEP_DURATION_MS,
} from "@/lib/walkthrough-data.mjs";

export interface Scene {
  id: number;
  stepNumber: number;
  title: string;
  shortTitle: string;
  badge: string;
  narration: string;
}

const SCENES: Scene[] = WALKTHROUGH_SCENES;
const SCENE_DURATION = WALKTHROUGH_STEP_DURATION_MS;

interface VanWalkthroughProps {
  standalone?: boolean;
  onClose?: () => void;
}

export default function VanWalkthrough({ standalone = false, onClose }: VanWalkthroughProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioHintVisible, setAudioHintVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      if (!voiceEnabled) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const britishVoice = voices.find(
        (v) =>
          v.lang === "en-GB" ||
          v.lang === "en_GB" ||
          v.name.includes("UK English") ||
          v.name.includes("British") ||
          v.name.includes("George") ||
          v.name.includes("Hazel") ||
          v.name.includes("Oliver")
      );
      if (britishVoice) {
        utterance.voice = britishVoice;
      }

      utterance.onstart = () => {
        setAudioHintVisible(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis waiting for user activation", err);
      }
    },
    [voiceEnabled]
  );

  // Load voices when available
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Handle scene change & narration
  useEffect(() => {
    speak(SCENES[currentScene].narration);
  }, [currentScene, speak]);

  // Handle auto-play timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % SCENES.length);
    }, SCENE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentScene]);

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      } else if (next) {
        speak(SCENES[currentScene].narration);
      }
      return next;
    });
  };

  const toggleVoice = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      } else if (next) {
        speak(SCENES[currentScene].narration);
      }
      return next;
    });
  };

  const goToScene = (index: number) => {
    setCurrentScene(index);
    if (isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentScene((prev) => (prev + 1) % SCENES.length);
      }, SCENE_DURATION);
    }
  };

  const nextScene = () => {
    goToScene((currentScene + 1) % SCENES.length);
  };

  const prevScene = () => {
    goToScene((currentScene - 1 + SCENES.length) % SCENES.length);
  };

  const handleAudioHintClick = () => {
    setVoiceEnabled(true);
    setAudioHintVisible(false);
    speak(SCENES[currentScene].narration);
  };

  const scene = SCENES[currentScene];

  return (
    <div className={`w-full max-w-2xl mx-auto bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl flex flex-col gap-4 p-4 sm:p-6 ${standalone ? "my-6" : ""}`}>
      {/* Top Header & Voice Switch */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-700 text-white font-black text-sm">
            CQ
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                45-Second Van Walkthrough
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                Interactive
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate hidden sm:block">
              From driver's seat voice note to paid invoice
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleVoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition active:scale-95 shadow-sm"
            title="Toggle British Voice Narration"
            aria-label={voiceEnabled ? "Mute voice narration" : "Unmute voice narration"}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Voice: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Voice: OFF</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Close walkthrough"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {SCENES.map((s, idx) => {
          const active = idx === currentScene;
          return (
            <button
              key={s.id}
              onClick={() => goToScene(idx)}
              className={`flex flex-col items-center py-1.5 px-1 rounded-xl border transition text-center ${
                active
                  ? "bg-amber-600/20 border-amber-500 text-amber-400 font-bold shadow-xs"
                  : "bg-slate-900 border-slate-800 text-slate-400 font-medium hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <span className="text-[11px] opacity-75">{s.stepNumber}</span>
              <span className="text-[11px] sm:text-xs truncate w-full">
                {s.shortTitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage Frame */}
      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 min-h-[340px] flex flex-col justify-between overflow-hidden shadow-inner">
        <div>
          {/* Scene Title Bar */}
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-black">
                {scene.stepNumber}
              </span>
              <span>{scene.title}</span>
            </h3>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              {scene.badge}
            </span>
          </div>

          {/* Dynamic Scene Visuals */}
          {currentScene === 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Driver&apos;s Seat Voice Input
                </span>
                <span className="text-[11px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1.5 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  Recording...
                </span>
              </div>

              {/* Pulsing Waveform */}
              <div className="flex items-center justify-center gap-1.5 py-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="w-1.5 h-3 bg-amber-500 rounded-full animate-pulse" />
                <span className="w-1.5 h-6 bg-amber-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-8 bg-amber-500 rounded-full animate-pulse" />
                <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-7 bg-amber-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-5 bg-amber-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>

              {/* Spoken Transcription */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-500">Transcribed on device:</p>
                <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                  &ldquo;En-suite shower replacement. Supply and fit thermostatic bar shower kit, riser rail, and chrome heated towel rail. 1 day on site.&rdquo;
                </p>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Takes 15 seconds. Works on phone Safari or Chrome with zero typing.</span>
              </p>
            </div>
          )}

          {currentScene === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Automated UK Trade Scope
                </span>
                <span className="text-xs text-slate-400 font-mono">Job #CQ-1042</span>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 text-xs">
                <div className="p-2.5 flex justify-between items-center">
                  <span className="text-slate-200">Thermostatic Bar Shower Kit & Riser Rail</span>
                  <span className="font-bold text-white tabular-nums">£245.00</span>
                </div>
                <div className="p-2.5 flex justify-between items-center">
                  <span className="text-slate-200">Chrome Heated Towel Rail (1200x500mm)</span>
                  <span className="font-bold text-white tabular-nums">£165.00</span>
                </div>
                <div className="p-2.5 flex justify-between items-center">
                  <span className="text-slate-200">Certified Plumbing Labour (8 hrs @ £55)</span>
                  <span className="font-bold text-white tabular-nums">£440.00</span>
                </div>
              </div>

              {/* 3 Package Options */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Standard</p>
                  <p className="text-xs font-black text-slate-300">£890</p>
                </div>
                <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-500/60 ring-1 ring-amber-500/30">
                  <p className="text-[10px] text-amber-400 font-bold uppercase">Better (Pop)</p>
                  <p className="text-xs font-black text-amber-300">£1,020</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Premium</p>
                  <p className="text-xs font-black text-slate-300">£1,250</p>
                </div>
              </div>
            </div>
          )}

          {currentScene === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  WhatsApp Van Dispatch
                </span>
                <span className="text-[11px] text-slate-400">No login required for client</span>
              </div>

              {/* WhatsApp Message Bubble */}
              <div className="bg-[#0b141a] p-3 rounded-2xl border border-emerald-950/80 space-y-2">
                <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-xs space-y-2 shadow-md">
                  <p className="font-medium">
                    &ldquo;Hi Sarah, great to see you today! Here is your itemised quote for the en-suite shower replacement with 3 package options:&rdquo;
                  </p>
                  <div className="bg-[#025143] p-2 rounded-lg border border-emerald-400/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">Premier Trade Services</p>
                      <p className="text-[10px] text-emerald-200">chuffedquotes.co.uk/q/7x9k2</p>
                    </div>
                    <span className="bg-white text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded">
                      View Quote
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-300 text-right">10:42 AM ✓✓</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Homeowners open it in 1 tap on mobile. No PDF attachments or lost emails.</span>
              </p>
            </div>
          )}

          {currentScene === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Customer Mobile Screen
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  Client View
                </span>
              </div>

              {/* Customer Sign-Off Card */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Selected Option:</span>
                  <span className="text-xs font-bold text-amber-400">Better Package (£1,020.00)</span>
                </div>

                {/* Digital Signature */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-center relative">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Digital Signature</p>
                  <p className="font-serif italic text-lg text-emerald-400 tracking-wide">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-500">Signed 22/10/2026 · IP Verified</p>
                </div>

                <div className="w-full bg-emerald-600 text-white font-extrabold text-xs py-2 rounded-lg text-center shadow-lg flex items-center justify-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Quote Accepted &amp; Locked</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">Both parties receive an unchangeable timestamped contract copy.</p>
            </div>
          )}

          {currentScene === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Invoice Complete
                </span>
                <span className="text-xs text-emerald-400 font-bold">INV-0012</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white">Invoice to Sarah Jenkins</p>
                    <p className="text-[10px] text-slate-400">Due within 14 days · VAT registered</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Due</span>
                    <span className="text-base font-black text-white tabular-nums">£1,020.00</span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Bank Transfer (BACS)</p>
                    <p className="font-mono text-slate-300 text-[11px]">Sort: 20-40-60 · Acc: 83920194</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    Ready to Send
                  </span>
                </div>
              </div>

              <div className="bg-amber-600/10 border border-amber-500/30 p-2.5 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-300">
                  🎉 That&apos;s it! No paperwork, no lost evenings, paid on time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Voice Subtitles Banner */}
        <div
          onClick={handleAudioHintClick}
          className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2.5 bg-slate-950/80 rounded-xl p-3 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition"
        >
          <span className="text-base shrink-0">🎙️</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                British Voice Narration:
              </p>
              {audioHintVisible && (
                <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
                  Tap for sound 🔊
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed italic mt-0.5">
              &ldquo;{scene.narration}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={togglePlay}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm transition shadow-md active:scale-95"
            aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            onClick={prevScene}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            onClick={nextScene}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition"
            aria-label="Next step"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Step {currentScene + 1} of {SCENES.length}
          </span>
          <Link
            href="/try"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-md active:scale-95"
          >
            <span>Try Free</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
