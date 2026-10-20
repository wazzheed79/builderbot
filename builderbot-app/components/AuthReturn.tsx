"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { authCallbackTarget } from "@/lib/auth-callback";

/** Send an email-link landing (often the site home) to the callback page. */
export default function AuthReturn() {
  const pathname = usePathname();

  useEffect(() => {
    const target = authCallbackTarget(pathname || "/", window.location.search, window.location.hash);
    if (!target) return;
    window.location.replace(target);
  }, [pathname]);

  return null;
}
