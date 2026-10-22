"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AlertCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { friendlyLinkError, readConfirmRequest } from "@/lib/auth-callback";
import { pathAfterAuth } from "@/lib/guest-demo.mjs";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const signIn = async () => {
    if (working) return;
    const parsed = readConfirmRequest(window.location.search);
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }

    setWorking(true);
    setMessage(null);
    const sb = getSupabase();
    if (!sb) {
      setWorking(false);
      setMessage("Sign-in is not set up on this site yet.");
      return;
    }

    const { data, error } = await sb.auth.verifyOtp({
      token_hash: parsed.tokenHash,
      type: parsed.type as EmailOtpType,
    });
    if (error || !data.session) {
      setWorking(false);
      setMessage(friendlyLinkError(error?.message, error?.code));
      return;
    }
    router.replace(pathAfterAuth(parsed.next, window.localStorage));
  };

  const failed = Boolean(message);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-[#fffdf8] border border-clay-200 shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
        {failed ? (
          <>
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-ink mb-2">Could not sign you in</h1>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>
            <Link
              href="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-clay-700 px-4 py-3 text-base font-bold text-white hover:bg-clay-800"
            >
              Send a new link
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-ink mb-2">Tap to sign in</h1>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Opening this page does not use the email link. Tap the button to open your dashboard.
            </p>
            <button
              type="button"
              onClick={() => void signIn()}
              disabled={working}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-clay-700 px-4 py-4 text-lg font-bold text-white hover:bg-clay-800 disabled:opacity-60"
            >
              {working ? "Signing you in…" : "Tap to sign in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
