"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wrench,
  LayoutDashboard,
  FileText,
  Users,
  PlusCircle,
  Home,
  Sparkles,
  Settings,
} from "lucide-react";

export default function AppNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Quotes", href: "/quotes", icon: FileText },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  if (pathname.startsWith("/q/")) {
    return null;
  }

  return (
    <>
      {/* Top Desktop & Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                BuilderBot
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-blue-600" />
                  AI Trade
                </span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 -mt-1 hidden sm:block">
                Quotes in &lt; 2 minutes
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/quotes"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quote</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb friendly for site work) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 pb-safe">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition ${
              pathname === "/"
                ? "text-blue-600 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </Link>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
