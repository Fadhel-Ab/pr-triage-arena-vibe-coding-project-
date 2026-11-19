import { NextResponse } from "next/server";
import { startGuest } from "@/lib/auth/session";

// "Continue as guest": hands out an anonymous id so the guest's attempt has an
// owner (and nobody else can open it). Nothing is stored until they generate a PR.
export async function POST() {
  await startGuest();
  return NextResponse.json({ ok: true });
}
