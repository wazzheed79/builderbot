"use client";

import { useState, useEffect } from "react";
import { Play, Sparkles, X } from "lucide-react";
import VanWalkthrough from "./VanWalkthrough";

interface VanWalkthroughModalProps {
  buttonText?: string;
  variant?: "hero" | "compact" | "banner";
}

export default function VanWalkthroughModal({
  buttonText = "Watch 45-second van walkthrough",
  variant = "hero",
}: VanWalkthroughModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Cancel any ongoing speech when modal closes
  const closeModal = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsOpen(false);
  };

  return (
    <>
      {variant === "hero" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group inline-flex items-center gap-2.5 rounded-2xl border-2 border-clay-300 bg-white/95 px-4 py-2.5 text-left text-sm font-bold text-ink shadow-sm transition hover:border-clay-600 hover:bg-white active:scale-98"
          aria-label="Open 45-second interactive van walkthrough video and narration"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-clay-700 text-white shadow-xs group-hover:bg-clay-800 transition">
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          </span>
          <span className="flex flex-col">
            <span className="leading-tight text-ink">{buttonText}</span>
            <span className="text-[11px] font-semibold text-clay-700 flex items-center gap-1">
              <span>Voice demo · Van to WhatsApp</span>
              <span className="rounded bg-emerald-100 text-emerald-800 px-1 py-0.2 text-[9px] font-extrabold uppercase">
                45s
              </span>
            </span>
          </span>
        </button>
      )}

      {variant === "compact" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-2xs hover:bg-stone-50 transition"
        >
          <Play className="h-3 w-3 fill-clay-700 text-clay-700" />
          <span>{buttonText}</span>
        </button>
      )}

      {/* Modal Backdrop & Container */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <VanWalkthrough onClose={closeModal} />
          </div>
        </div>
      )}
    </>
  );
}
