/**
 * Van demo scenes and narration.
 * The spoken lines match public/audio/walkthrough/step-1.mp3 … step-5.mp3.
 * Keep those filenames. Steps 3 and 4 may be replaced with new recordings
 * of the same lines without a code change.
 */

export const WALKTHROUGH_SCENES = [
  {
    id: 0,
    stepNumber: 1,
    title: "Speak your job notes from the van",
    shortTitle: "Speak",
    badge: "Step 1",
    narration:
      "Sat in your van after looking at the job? Just tap the mic and describe the work in plain English. No typing needed.",
  },
  {
    id: 1,
    stepNumber: 2,
    title: "A priced quote, with three options",
    shortTitle: "Pricing",
    badge: "Step 2",
    narration:
      "In seconds, Chuffed Quotes turns that into a priced quote, with materials and labour, and gives you Standard, Better and Premium options.",
  },
  {
    id: 2,
    stepNumber: 3,
    title: "Send the quote link on WhatsApp",
    shortTitle: "Send",
    badge: "Step 3",
    narration:
      "Then send the quote link straight to your customer on WhatsApp, before you've even pulled off the drive.",
  },
  {
    id: 3,
    stepNumber: 4,
    title: "They pick an option and type their name",
    shortTitle: "Sign",
    badge: "Step 4",
    narration:
      "Your customer picks an option, taps Accept on their phone, and types their name to sign.",
  },
  {
    id: 4,
    stepNumber: 5,
    title: "Turn the accepted quote into an invoice",
    shortTitle: "Invoice",
    badge: "Step 5",
    narration:
      "And when the job's done, turn the accepted quote into a proper invoice in one tap.",
  },
];

/** Public URLs. The file names are part of the demo and should stay stable. */
export const WALKTHROUGH_CLIP_SRC = [
  "/audio/walkthrough/step-1.mp3",
  "/audio/walkthrough/step-2.mp3",
  "/audio/walkthrough/step-3.mp3",
  "/audio/walkthrough/step-4.mp3",
  "/audio/walkthrough/step-5.mp3",
];

/**
 * Length of the provisional clips, in milliseconds.
 * Used only when the browser cannot read the file duration.
 * The five clips together are about 31 seconds.
 */
export const WALKTHROUGH_CLIP_FALLBACK_MS = [6888, 8832, 5184, 4920, 5424];
