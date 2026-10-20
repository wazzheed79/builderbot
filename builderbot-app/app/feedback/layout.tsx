import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell us what got in the way while you were quoting.",
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
