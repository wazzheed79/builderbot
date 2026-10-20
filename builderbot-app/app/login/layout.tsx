import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with the link in your email, or with a password.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
