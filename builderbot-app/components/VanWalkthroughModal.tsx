"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Play } from "lucide-react";
import VanWalkthrough from "./VanWalkthrough";

interface VanWalkthroughModalProps {
  buttonText?: string;
  variant?: "hero" | "compact" | "banner";
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function VanWalkthroughModal({
  buttonText = "Quick van demo",
  variant = "hero",
}: VanWalkthroughModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = triggerRef.current ?? (document.activeElement as HTMLElement | null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.tabIndex !== -1 && !element.hasAttribute("disabled")
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  const open = (trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setIsOpen(true);
  };

  return (
    <>
      {variant === "hero" && (
        <button
          type="button"
          onClick={(event) => open(event.currentTarget)}
          className="group inline-flex min-h-11 w-full items-center gap-3 rounded-2xl border-2 border-clay-300 bg-white/95 px-3 py-1.5 text-left text-sm font-bold text-ink shadow-sm transition hover:border-clay-600 hover:bg-white sm:w-auto"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Open the quick van demo"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay-700 text-white group-hover:bg-clay-800">
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="leading-tight text-ink">{buttonText}</span>
            <span className="text-[11px] font-semibold leading-tight text-clay-700">
              Recorded voice. Tap to play.
            </span>
          </span>
        </button>
      )}

      {variant === "compact" && (
        <button
          type="button"
          onClick={(event) => open(event.currentTarget)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-ink shadow-2xs hover:bg-stone-50"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <Play className="h-4 w-4 fill-clay-700 text-clay-700" aria-hidden="true" />
          <span>{buttonText}</span>
        </button>
      )}

      {isOpen && (
        <div
          className="cq-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[min(100dvh-1.5rem,920px)] w-full max-w-2xl overflow-y-auto rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <VanWalkthrough
              titleId={titleId}
              closeButtonRef={closeButtonRef}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
