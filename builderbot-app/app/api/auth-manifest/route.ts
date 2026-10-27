import { NextResponse } from "next/server";
import { authManifest } from "@/lib/pwa-manifest.mjs";

export function GET() {
  return NextResponse.json(authManifest());
}
