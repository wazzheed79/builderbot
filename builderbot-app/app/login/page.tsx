"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { brand } from "@/lib/brand.mjs";
import { pathAfterAuth, readGuestDemoQuote } from "@/lib/guest-demo.mjs";
import {
  Wrench,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithOtp, verifyEmailCode, signInWithPassword, signUp, isConfigured } = useAuth();

  const [mode, setMode] = useState<"code" | "password">("code");
  const [passwordMode, setPasswordMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [accountNote, setAccountNote] = useState(false);
  const guestWaiting =
    useSyncExternalStore(
      () => () => {},
      () => {
        try {
          return readGuestDemoQuote(window.localStorage) ? "1" : "0";
        } catch {
          return "0";
        }
      },
      () => "0"
    ) === "1";

  const continueAfterAuth = () => {
    const requested = new URLSearchParams(window.location.search).get("next");
    router.push(pathAfterAuth(requested, window.localStorage));
  };

  // If already logged in, show redirect CTA
  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">You are already signed in</h2>
          <p className="text-sm text-slate-600 mb-6">
            Signed in as <span className="font-semibold text-slate-900">{user.email}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(guestWaiting ? "/quotes" : "/dashboard")}
              className="w-full bg-clay-700 hover:bg-clay-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm transition"
            >
              {guestWaiting ? "Open your try-it quote" : "Go to Trade Dashboard"}
            </button>
            <button
              onClick={() => router.push("/quotes")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition"
            >
              Open Quotes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setCodeSent(true);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const { error } = await verifyEmailCode(email, code);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      continueAfterAuth();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    if (passwordMode === "signin") {
      const { error } = await signInWithPassword(email, password);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        continueAfterAuth();
      }
    } else {
      const { error } = await signUp(email, password);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        setAccountNote(true);
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-clay-700 text-white flex items-center justify-center shadow-lg shadow-clay-700/25">
            <Wrench className="w-7 h-7" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to {brand.name}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
          Fast quoting, customer CRM, and live quote acceptance tracking across your phone, tablet, and van.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-200 sm:px-10">
          {/* Supabase unconfigured environment warning */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 mb-1">Supabase Credentials Not Set</h4>
                  <p className="text-amber-800 leading-relaxed mb-3">
                    Add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> file to enable cloud authentication.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 font-bold text-clay-800 hover:text-clay-800 underline"
                  >
                    <span>Continue in Free Demo Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode("code");
                setErrorMsg(null);
                setCodeSent(false);
                setShowCode(false);
                setAccountNote(false);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === "code"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-clay-700" />
              <span>Email link</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setErrorMsg(null);
                setCodeSent(false);
                setShowCode(false);
                setAccountNote(false);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Password</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {accountNote ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Check your inbox</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                If this site asks you to confirm the new account, tap the link in the email for{" "}
                <strong className="text-slate-900">{email}</strong>. It brings you back signed in.
              </p>
              <button
                type="button"
                onClick={() => setAccountNote(false)}
                className="text-xs font-semibold text-clay-700 hover:text-clay-800 underline"
              >
                Back
              </button>
            </div>
          ) : codeSent ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Check your inbox</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tap the link in the email we sent to <strong className="text-slate-900">{email}</strong>.
                  That link signs you in on this phone. The email does not include a code.
                </p>
              </div>
              {showCode ? (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label htmlFor="email-code" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Code
                    </label>
                    <input
                      id="email-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="block w-full px-3 py-3 border border-slate-300 rounded-xl text-center tracking-[0.4em] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clay-700 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full min-h-11 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-clay-700 hover:bg-clay-800 transition disabled:opacity-50"
                  >
                    {loading ? "Checking the code..." : "Sign in"}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCode(true)}
                  className="mx-auto block min-h-11 px-2 text-sm font-semibold text-clay-800 underline"
                >
                  Got a 6-digit code instead?
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setShowCode(false);
                  setCode("");
                }}
                className="w-full min-h-11 text-xs font-semibold text-clay-700 hover:text-clay-800 underline"
              >
                Use a different email address
              </button>
            </div>
          ) : mode === "code" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Trade Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="magic-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@smithbuilding.co.uk"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1.5">
                  We email you a link. Tap it on this phone and you are signed in.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-clay-700 hover:bg-clay-800 active:scale-[0.99] transition shadow-md shadow-clay-700/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending the email...
                  </span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-blue-200" />
                    <span>Email me a sign-in link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Password Form */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="pwd-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="pwd-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@smithbuilding.co.uk"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pwd-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="pwd-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600">
                  {passwordMode === "signin" ? "Need a new account?" : "Already registered?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode(passwordMode === "signin" ? "signup" : "signin");
                    setErrorMsg(null);
                  }}
                  className="text-xs font-bold text-clay-700 hover:text-clay-800 underline"
                >
                  {passwordMode === "signin" ? "Create Account" : "Sign In Instead"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-clay-700 hover:bg-clay-800 active:scale-[0.99] transition shadow-md shadow-clay-700/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : (
                  <>
                    <span>{passwordMode === "signin" ? "Sign In" : "Create Trade Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Demo Link */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1.5"
            >
              <span>Want to explore first?</span>
              <span className="text-clay-700 underline">Continue as Guest in Demo Mode &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Security Assurance Footer */}
        <p className="mt-6 text-center text-xs text-stone-500">
          {brand.name} is free during the beta.{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
