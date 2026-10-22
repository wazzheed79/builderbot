/**
 * 45-Second Van Walkthrough Scenes & Narration Data
 * Used by VanWalkthrough component and automated test suite.
 */

export const WALKTHROUGH_SCENES = [
  {
    id: 0,
    stepNumber: 1,
    title: "Speak Your Job Notes from the Van",
    shortTitle: "Speak",
    badge: "00:00 - The Van Cab",
    narration:
      "Sit in your van cab after looking at the job. Tap the mic and describe the work in plain English. No typing needed.",
  },
  {
    id: 1,
    stepNumber: 2,
    title: "30-Second UK Rate & Materials Breakdown",
    shortTitle: "Pricing",
    badge: "00:10 - Instant Estimate",
    narration:
      "In seconds, Chuffed Quotes calculates current UK merchant materials and trade labour, giving you Standard, Better, and Premium packages.",
  },
  {
    id: 2,
    stepNumber: 3,
    title: "Instant WhatsApp Delivery",
    shortTitle: "WhatsApp",
    badge: "00:20 - Customer Send",
    narration:
      "Send the interactive quote link straight to your customer's WhatsApp before you pull out of the driveway.",
  },
  {
    id: 3,
    stepNumber: 4,
    title: "Customer Accepts & Signs in 1 Tap",
    shortTitle: "Sign",
    badge: "00:30 - Customer Action",
    narration:
      "Your customer reviews the price options, taps Accept on their phone, and signs with their finger. You get notified immediately.",
  },
  {
    id: 4,
    stepNumber: 5,
    title: "1-Click Invoice Conversion",
    shortTitle: "Invoice",
    badge: "00:40 - Getting Paid",
    narration:
      "When the job is finished, convert the accepted quote straight into a professional invoice with your bank payment details.",
  },
];

export const WALKTHROUGH_TOTAL_DURATION_SEC = 45;
export const WALKTHROUGH_STEP_DURATION_MS = 8000;
