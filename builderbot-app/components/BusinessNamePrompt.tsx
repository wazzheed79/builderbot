import Link from "next/link";
import { BUSINESS_NAME_PROMPT } from "@/lib/business-name.mjs";

const [beforeSettings, afterSettings] = BUSINESS_NAME_PROMPT.split("Settings");

export function BusinessNamePrompt({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 ${className}`}>
      <p>
        {beforeSettings}
        <Link href="/settings" className="font-bold text-clay-800 underline">
          Settings
        </Link>
        {afterSettings}
      </p>
      <Link
        href="/settings"
        className="mt-2 inline-flex min-h-11 items-center font-bold text-clay-800 underline"
      >
        Open Settings
      </Link>
    </div>
  );
}
