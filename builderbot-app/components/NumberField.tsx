"use client";

import { useState } from "react";
import { commitNumericDraft, formatNumericValue, nextNumericDraft } from "@/lib/number-draft.mjs";

interface NumberFieldProps {
  value: number | null;
  onValue: (value: number | null) => void;
  decimal?: boolean;
  /** Used when the box is left empty. Null keeps it empty. */
  emptyAs?: number | null;
  min?: number;
  max?: number;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * A price or quantity box. Empty is allowed while typing. A lone 0 can be deleted,
 * and the next digits replace that 0. The phone still gets a numeric keypad.
 */
export default function NumberField({
  value,
  onValue,
  decimal = true,
  emptyAs = 0,
  min,
  max,
  id,
  name,
  required = false,
  disabled = false,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : formatNumericValue(value);

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      enterKeyHint="done"
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={shown}
      className={className}
      onFocus={(event) => {
        const initial = formatNumericValue(value);
        setDraft(initial);
        if (initial === "0") {
          const el = event.currentTarget;
          requestAnimationFrame(() => el.select());
        }
      }}
      onChange={(event) => {
        const next = nextNumericDraft(draft ?? formatNumericValue(value), event.target.value, { decimal });
        setDraft(next);
        if (next === "" || next === "." || next.endsWith(".")) return;
        const live = commitNumericDraft(next, { decimal, emptyAs: null });
        if (live !== null) onValue(live);
      }}
      onBlur={() => {
        const committed = commitNumericDraft(draft ?? shown, { decimal, emptyAs, min, max });
        onValue(committed);
        setDraft(null);
      }}
    />
  );
}
