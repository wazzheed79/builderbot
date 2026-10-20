import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Tap once to finish signing in from the email link.",
};

export default function AuthConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
