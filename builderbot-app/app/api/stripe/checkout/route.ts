import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Card payments are not available in the free beta." },
    { status: 403 }
  );
}
