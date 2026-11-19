import { NextResponse } from "next/server";
import { endLogin } from "@/lib/auth/session";

export async function POST() {
  await endLogin();
  return NextResponse.json({ ok: true });
}
