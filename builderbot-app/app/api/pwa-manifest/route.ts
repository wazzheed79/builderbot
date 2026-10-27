import { NextResponse } from "next/server";
import { appManifest } from "@/lib/pwa-manifest.mjs";

export function GET() {
  return NextResponse.json(appManifest());
}
