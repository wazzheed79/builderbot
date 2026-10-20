import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with a 6-digit code from your email, or with a password.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
