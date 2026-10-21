"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wrench,
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  PlusCircle,
  Settings,
  LogIn,
  LogOut,
  CloudCheck,
  CreditCard,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import DemoBanner from "./DemoBanner";
import { brand } from "@/lib/brand.mjs";

export default function AppNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Quotes", href: "/quotes", icon: FileText },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  if (pathname.startsWith("/q/") || pathname.startsWith("/i/")) {
    return null;
  }

  return (
    <>
      {/* Top Desktop & Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 min-w-0">
          {/* Logo & Brand. The graphic has no wordmark, so a rename stays in brand.mjs. */}
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-clay-700 text-white flex items-center justify-center shadow-md shadow-clay-700/20 group-hover:bg-clay-800 transition">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-lg tracking-tight text-ink flex items-center gap-1.5 min-w-0">
                <span className="sm:hidden truncate">{brand.shortName}</span>
                <span className="hidden sm:inline truncate">{brand.name}</span>
                <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-clay-50 text-clay-800 border border-clay-200">
                  Free beta
                </span>
              </span>
              <span className="text-[11px] font-medium text-stone-500 -mt-1 hidden xl:block">
                {brand.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links — tablet keeps the bottom bar so this row does not overflow. */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? "bg-clay-50 text-clay-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-clay-700" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs & Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cloud Synced</span>
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-clay-100 text-clay-800 font-bold text-xs flex items-center justify-center border border-clay-200"
                  title={user.email || "Trade Account"}
                >
                  {user.email ? user.email.slice(0, 2).toUpperCase() : "TB"}
                </div>
                <button
                  onClick={() => signOut()}
                  title="Sign out of trade account"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Demo Mode</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}

            <Link
              href="/quotes"
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-clay-700 hover:bg-clay-800 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition active:scale-[0.98] shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Quote</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Cross-App Demo Mode Banner */}
      <DemoBanner />

      {/* Mobile Bottom Navigation Bar (High-Contrast, 48px+ touch targets for van/site work) */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 w-full max-w-[100vw] overflow-x-clip bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-1 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
        <div className="grid w-full min-w-0 grid-cols-6 gap-0.5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 w-full flex-col items-center justify-center min-h-[52px] py-1 px-0.5 rounded-xl text-[11px] transition-all duration-75 active:scale-90 select-none relative ${
                  isActive
                    ? "bg-clay-50 text-clay-800 font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 active:bg-slate-100 font-medium"
                }`}
              >
                {isActive && (
                  <span className="absolute top-1 w-5 h-1 bg-clay-700 rounded-full" />
                )}
                <Icon className={`w-6 h-6 mt-1 transition-transform ${isActive ? "text-clay-700 scale-105" : "text-slate-500"}`} />
                <span className="mt-0.5 w-full truncate text-center text-[10px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
