"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-clay-700 px-5 font-bold text-white hover:bg-clay-800 print:hidden"
    >
      <Printer className="h-5 w-5" aria-hidden="true" />
      Print or save as PDF
    </button>
  );
}
