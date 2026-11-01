type SpeechGhostFieldProps = {
  id: string;
  value: string;
  interim?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  textareaClassName?: string;
};

/**
 * Job notes, with the words still being recognised shown in grey inside
 * the same box. Those words are not part of the field value until they
 * are final.
 */
export default function SpeechGhostField({
  id,
  value,
  interim = "",
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  className,
  textareaClassName,
}: SpeechGhostFieldProps) {
  const hearing = interim.trim();
  return (
    <div className={className}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={hearing ? "" : placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hearing ? `${id}-hearing` : undefined}
        className={`block w-full resize-y bg-transparent text-inherit outline-none ${textareaClassName || ""}`}
      />
      {hearing ? (
        <p id={`${id}-hearing`} className="mt-1 text-base italic leading-snug text-stone-400" aria-live="polite">
          <span className="sr-only">Hearing: </span>
          <label htmlFor={id} className="cursor-text">
            {hearing}
          </label>
        </p>
      ) : null}
    </div>
  );
}
