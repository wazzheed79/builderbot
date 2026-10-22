"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { readAuthCallback } from "@/lib/auth-callback";
import { pathAfterAuth } from "@/lib/guest-demo.mjs";
import { AlertCircle } from "lucide-react";

type FinishResult = { ok: true } | { ok: false; message: string };

async function finishSignIn(search: string, hash: string): Promise<FinishResult> {
  const parsed = readAuthCallback(search, hash);
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, message: "Sign-in is not set up on this site yet." };
  }

  if (parsed.kind === "error") {
    return { ok: false, message: parsed.message };
  }

  let errorMessage: string | null = null;
  if (parsed.kind === "code") {
    const { error } = await sb.auth.exchangeCodeForSession(parsed.code);
    errorMessage = error?.message ?? null;
  } else if (parsed.kind === "otp") {
    const { error } = await sb.auth.verifyOtp({
      token_hash: parsed.tokenHash,
      type: parsed.type as EmailOtpType,
    });
    errorMessage = error?.message ?? null;
  } else if (parsed.kind === "session") {
    const { error } = await sb.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
    errorMessage = error?.message ?? null;
  }

  const { data } = await sb.auth.getSession();
  if (data.session) return { ok: true };

  if (parsed.kind === "none") {
    return {
      ok: false,
      message: "This sign-in link is missing its details. Go back and ask for a new email.",
    };
  }

  return {
    ok: false,
    message: errorMessage || "This sign-in link has expired or was already used. Ask for a new email.",
  };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const search = window.location.search;
    const hash = window.location.hash;
    void finishSignIn(search, hash).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        router.replace(pathAfterAuth("/dashboard", window.localStorage));
        return;
      }
      setMessage(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 max-w-md w-full text-center" aria-live="polite">
        {message ? (
          <>
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Could not sign you in</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center w-full bg-clay-700 hover:bg-clay-800 text-white font-semibold py-3 px-4 rounded-xl"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-2 border-clay-200 border-t-clay-700 rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Signing you in</h1>
            <p className="text-sm text-slate-600">Opening your dashboard.</p>
          </>
        )}
      </div>
    </div>
  );
}
