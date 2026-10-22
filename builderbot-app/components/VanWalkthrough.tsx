"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  ArrowRight,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import {
  WALKTHROUGH_CLIP_FALLBACK_MS,
  WALKTHROUGH_CLIP_SRC,
  WALKTHROUGH_SCENES,
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
const LAST_INDEX = SCENES.length - 1;

interface VanWalkthroughProps {
  standalone?: boolean;
  onClose?: () => void;
  titleId?: string;
  closeButtonRef?: Ref<HTMLButtonElement>;
}

interface WalkthroughPlayerHooks {
  isPlaying: () => boolean;
  onEnded: (index: number) => void;
  onBlocked: () => void;
  onAudible: () => void;
}

interface WalkthroughPlayer {
  start: (index: number, voiceOn: boolean) => void;
  resume: (index: number) => void;
  canResume: (index: number) => boolean;
  remaining: (index: number) => number;
  pause: () => void;
  holdFor: (index: number, ms: number) => void;
  stop: () => void;
}

function clipMatches(audio: HTMLAudioElement, index: number) {
  return audio.src.includes(`step-${index + 1}.mp3`);
}

function fallbackMs(index: number) {
  return WALKTHROUGH_CLIP_FALLBACK_MS[index] ?? 7000;
}

/** Browser audio for the demo. Kept outside the component so timers stay out of render. */
function createWalkthroughPlayer(hooks: WalkthroughPlayerHooks): WalkthroughPlayer {
  let audio: HTMLAudioElement | null = null;
  let timer: number | null = null;
  let token = 0;

  const ensure = () => {
    if (!audio) audio = new Audio();
    return audio;
  };

  const clearTimer = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const detach = (element: HTMLAudioElement | null) => {
    if (!element) return;
    element.onended = null;
    element.onerror = null;
    element.onloadedmetadata = null;
  };

  const arm = (index: number, ms: number, my: number) => {
    clearTimer();
    timer = window.setTimeout(() => {
      if (my !== token || !hooks.isPlaying()) return;
      hooks.onEnded(index);
    }, ms);
  };

  const start = (index: number, voiceOn: boolean) => {
    const element = ensure();
    detach(element);
    element.pause();
    clearTimer();
    const my = ++token;
    element.preload = "auto";

    if (!voiceOn) {
      const started = performance.now();
      element.onloadedmetadata = () => {
        if (my !== token || !hooks.isPlaying()) return;
        if (!Number.isFinite(element.duration) || element.duration <= 0) return;
        const remaining = Math.max(300, Math.round(element.duration * 1000 - (performance.now() - started)));
        arm(index, remaining, my);
      };
      element.onerror = () => {
        if (my !== token || !hooks.isPlaying()) return;
        arm(index, fallbackMs(index), my);
      };
      element.src = WALKTHROUGH_CLIP_SRC[index];
      arm(index, fallbackMs(index), my);
      return;
    }

    element.onended = () => {
      if (my !== token || !hooks.isPlaying()) return;
      hooks.onEnded(index);
    };
    element.onerror = () => {
      if (my !== token || !hooks.isPlaying()) return;
      element.onended = null;
      arm(index, fallbackMs(index), my);
    };
    element.src = WALKTHROUGH_CLIP_SRC[index];
    try {
      element.currentTime = 0;
    } catch {
      // Some browsers reject currentTime before the clip has loaded.
    }
    const pending = element.play();
    pending
      ?.then(() => {
        if (my === token) hooks.onAudible();
      })
      .catch(() => {
        if (my !== token || !hooks.isPlaying()) return;
        element.onended = null;
        hooks.onBlocked();
        arm(index, fallbackMs(index), my);
      });
  };

  return {
    start,
    canResume(index) {
      return Boolean(
        audio && clipMatches(audio, index) && audio.paused && audio.currentTime > 0 && !audio.ended
      );
    },
    resume(index) {
      if (!audio || !clipMatches(audio, index)) {
        start(index, true);
        return;
      }
      const element = audio;
      clearTimer();
      const my = ++token;
      element.onended = () => {
        if (my !== token || !hooks.isPlaying()) return;
        hooks.onEnded(index);
      };
      element.onerror = () => {
        if (my !== token || !hooks.isPlaying()) return;
        element.onended = null;
        arm(index, fallbackMs(index), my);
      };
      const pending = element.play();
      pending
        ?.then(() => {
          if (my === token) hooks.onAudible();
        })
        .catch(() => {
          if (my !== token || !hooks.isPlaying()) return;
          element.onended = null;
          hooks.onBlocked();
          arm(index, fallbackMs(index), my);
        });
    },
    remaining(index) {
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        return Math.max(800, Math.round((audio.duration - audio.currentTime) * 1000));
      }
      return fallbackMs(index);
    },
    pause() {
      token += 1;
      clearTimer();
      if (!audio) return;
      detach(audio);
      audio.pause();
    },
    holdFor(index, ms) {
      token += 1;
      clearTimer();
      if (audio) {
        detach(audio);
        audio.pause();
      }
      arm(index, ms, token);
    },
    stop() {
      token += 1;
      clearTimer();
      if (!audio) return;
      detach(audio);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}

export default function VanWalkthrough({
  standalone = false,
  onClose,
  titleId,
  closeButtonRef,
}: VanWalkthroughProps) {
  const ownTitleId = useId();
  const headingId = titleId || ownTitleId;
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioHintVisible, setAudioHintVisible] = useState(true);

  const playerRef = useRef<WalkthroughPlayer | null>(null);
  const playingRef = useRef(false);
  const voiceRef = useRef(true);
  const sceneRef = useRef(0);
  const finishedRef = useRef(false);
  const onEndedRef = useRef<(index: number) => void>(() => {});

  const getPlayer = () => {
    if (!playerRef.current) {
      playerRef.current = createWalkthroughPlayer({
        isPlaying: () => playingRef.current,
        onEnded: (index) => onEndedRef.current(index),
        onBlocked: () => setAudioHintVisible(true),
        onAudible: () => setAudioHintVisible(false),
      });
    }
    return playerRef.current;
  };

  useEffect(() => {
    onEndedRef.current = (fromIndex: number) => {
      if (!playingRef.current) return;
      if (fromIndex >= LAST_INDEX) {
        playingRef.current = false;
        finishedRef.current = true;
        setIsPlaying(false);
        playerRef.current?.stop();
        return;
      }
      const next = fromIndex + 1;
      sceneRef.current = next;
      setCurrentScene(next);
      playerRef.current?.start(next, voiceRef.current);
    };
    return () => {
      playingRef.current = false;
      playerRef.current?.stop();
    };
  }, []);

  const playFrom = (index: number) => {
    playingRef.current = true;
    finishedRef.current = false;
    setIsPlaying(true);
    setAudioHintVisible(false);
    sceneRef.current = index;
    setCurrentScene(index);
    const engine = getPlayer();
    if (voiceRef.current && engine.canResume(index)) engine.resume(index);
    else engine.start(index, voiceRef.current);
  };

  const togglePlay = () => {
    if (playingRef.current) {
      playingRef.current = false;
      setIsPlaying(false);
      getPlayer().pause();
      return;
    }
    playFrom(finishedRef.current ? 0 : sceneRef.current);
  };

  const toggleVoice = () => {
    const next = !voiceRef.current;
    voiceRef.current = next;
    setVoiceEnabled(next);
    if (!playingRef.current) return;
    const engine = getPlayer();
    const index = sceneRef.current;
    if (!next) {
      engine.holdFor(index, engine.remaining(index));
      return;
    }
    if (engine.canResume(index)) engine.resume(index);
    else engine.start(index, true);
  };

  const goToScene = (index: number) => {
    const wrapped = (index + SCENES.length) % SCENES.length;
    finishedRef.current = false;
    sceneRef.current = wrapped;
    setCurrentScene(wrapped);
    const engine = playerRef.current;
    if (!engine) return;
    if (playingRef.current) engine.start(wrapped, voiceRef.current);
    else engine.pause();
  };

  const scene = SCENES[currentScene];

  return (
    <div
      className={`mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-2xl sm:p-6 ${standalone ? "my-6" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-clay-700 text-sm font-black text-white">
            CQ
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={headingId} className="truncate text-sm font-extrabold text-white sm:text-base">
                Quick van demo
              </h2>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Interactive
              </span>
            </div>
            <p className="hidden truncate text-xs text-slate-400 sm:block">From the van to an invoice</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleVoice}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? "Mute narration" : "Unmute narration"}
          >
            {voiceEnabled ? (
              <Volume2 className="h-5 w-5 text-amber-400" aria-hidden="true" />
            ) : (
              <VolumeX className="h-5 w-5 text-slate-400" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{voiceEnabled ? "Voice on" : "Voice off"}</span>
          </button>

          {onClose && (
            <button
              type="button"
              ref={closeButtonRef}
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
              aria-label="Close walkthrough"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs leading-snug text-amber-100/90">
        Sample data, not a real business. The names, prices, and bank details are made up.
      </p>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {SCENES.map((item, index) => {
          const active = index === currentScene;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goToScene(index)}
              aria-current={active ? "step" : undefined}
              className={`flex min-h-11 flex-col items-center justify-center rounded-xl border px-1 py-1 text-center ${
                active
                  ? "border-amber-500 bg-amber-600/20 font-bold text-amber-400"
                  : "border-slate-800 bg-slate-900 font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <span className="text-[11px] opacity-75">{item.stepNumber}</span>
              <span className="w-full truncate text-[11px] sm:text-xs">{item.shortTitle}</span>
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-900 p-4 shadow-inner sm:p-5">
        <div>
          <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
            <h3 className="flex items-center gap-2 text-xs font-bold text-white sm:text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-black text-amber-400">
                {scene.stepNumber}
              </span>
              <span>{scene.title}</span>
            </h3>
            <span className="shrink-0 rounded border border-amber-500/30 bg-amber-950/60 px-2 py-0.5 font-mono text-[10px] text-amber-400">
              {scene.badge}
            </span>
          </div>

          {currentScene === 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Voice notes in the van
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-ping" />
                  Example
                </span>
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 py-3" aria-hidden="true">
                <span className="h-3 w-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />
                <span className="h-6 w-1.5 rounded-full bg-amber-400 motion-safe:animate-bounce" />
                <span className="h-8 w-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />
                <span className="h-4 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-bounce" />
                <span className="h-7 w-1.5 rounded-full bg-amber-400 motion-safe:animate-pulse" />
                <span className="h-5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-bounce" />
                <span className="h-3 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
              </div>

              <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <p className="text-[10px] font-bold uppercase text-slate-500">Example of what you might say</p>
                <p className="text-xs font-semibold leading-relaxed text-white sm:text-sm">
                  &ldquo;En-suite shower replacement. Supply and fit thermostatic bar shower kit, riser rail, and chrome heated towel rail. 1 day on site.&rdquo;
                </p>
              </div>

              <p className="flex items-start gap-1 text-xs text-slate-400">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                <span>Talk or type, in Safari or Chrome on your phone. You read the result before anyone else does.</span>
              </p>
            </div>
          )}

          {currentScene === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Example prices you can edit
                </span>
                <span className="font-mono text-xs text-slate-400">Sample</span>
              </div>

              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950 text-xs">
                <div className="flex items-center justify-between gap-3 p-2.5">
                  <span className="text-slate-200">Thermostatic bar shower kit and riser rail</span>
                  <span className="font-bold tabular-nums text-white">£245.00</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-2.5">
                  <span className="text-slate-200">Chrome heated towel rail</span>
                  <span className="font-bold tabular-nums text-white">£165.00</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-2.5">
                  <span className="text-slate-200">Plumbing labour, 8 hours at £55</span>
                  <span className="font-bold tabular-nums text-white">£440.00</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                These figures are an example. A real quote uses an AI draft or a rough estimate, and you change any price before it is sent.
              </p>

              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Standard</p>
                  <p className="text-xs font-black text-slate-300">£890</p>
                </div>
                <div className="rounded-lg border border-amber-500/60 bg-amber-950/40 p-2 ring-1 ring-amber-500/30">
                  <p className="text-[10px] font-bold uppercase text-amber-400">Better</p>
                  <p className="text-xs font-black text-amber-300">£1,020</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Premium</p>
                  <p className="text-xs font-black text-slate-300">£1,250</p>
                </div>
              </div>
            </div>
          )}

          {currentScene === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  WhatsApp, after you save
                </span>
                <span className="text-[11px] text-slate-400">No account for them</span>
              </div>

              <div className="space-y-2 rounded-2xl border border-emerald-950/80 bg-[#0b141a] p-3">
                <div className="space-y-2 rounded-2xl rounded-tr-none bg-[#005c4b] p-3 text-xs text-white shadow-md">
                  <p className="font-medium">
                    &ldquo;Hi Sarah, here is the quote for the en-suite shower, with Standard, Better, and Premium:&rdquo;
                  </p>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-400/30 bg-[#025143] p-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Your business name</p>
                      <p className="truncate text-[10px] text-emerald-200">A link like chuffedquotes.co.uk/q/…</p>
                    </div>
                    <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      View quote
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                The customer opens the link on their phone. No app, and no login. The link is only offered after the quote is saved online.
              </p>
            </div>
          )}

          {currentScene === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Customer&apos;s phone
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  Their view
                </span>
              </div>

              <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Option they picked:</span>
                  <span className="text-xs font-bold text-amber-400">Better (£1,020.00)</span>
                </div>

                <div className="relative rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Name they type</p>
                  <p className="text-lg font-semibold tracking-wide text-white">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-500">Sample name</p>
                </div>

                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-center text-xs font-extrabold text-white">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Accepted</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                The name is saved on the quote. You see it when you next open the app. Nothing is emailed as a contract.
              </p>
            </div>
          )}

          {currentScene === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Invoice from the quote
                </span>
                <span className="text-xs font-bold text-emerald-400">Sample</span>
              </div>

              <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white">Invoice to Sarah Jenkins</p>
                    <p className="text-[10px] text-slate-400">Payment terms come from Settings</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Total</span>
                    <span className="text-base font-black tabular-nums text-white">£1,020.00</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/90 p-2.5 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Sample bank details</p>
                    <p className="font-mono text-[11px] text-slate-300">Sort 00-00-00 · Account 12345678</p>
                  </div>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                    Sample
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-600/10 p-2.5 text-center">
                <p className="text-xs font-bold text-amber-300">
                  A sent or accepted quote can become an invoice you share or print. Card payments are off in the beta.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Narration</p>
          {audioHintVisible && (
            <button
              type="button"
              onClick={() => playFrom(sceneRef.current)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-600 px-3 text-sm font-bold text-white hover:bg-amber-500"
            >
              Tap for sound
            </button>
          )}
          <p className="text-xs font-medium italic leading-relaxed text-slate-200 sm:text-sm">
            &ldquo;{scene.narration}&rdquo;
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-500"
            aria-pressed={isPlaying}
            aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => goToScene(currentScene - 1)}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-300 hover:bg-slate-800"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            type="button"
            onClick={() => goToScene(currentScene + 1)}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-300 hover:bg-slate-800"
            aria-label="Next step"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">
            Step {currentScene + 1} of {SCENES.length}
          </span>
          <Link
            href="/try"
            onClick={onClose}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500"
          >
            <span>Try free</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
