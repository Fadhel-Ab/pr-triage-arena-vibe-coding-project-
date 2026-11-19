import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { startLogin } from "@/lib/auth/session";

const bodyZ = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

// Same message for "no such email" and "wrong password", so the form can't be
// used to find out who has an account.
const BAD_LOGIN = { error: "Email or password is incorrect." };

export async function POST(request: Request) {
  const body = bodyZ.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json(BAD_LOGIN, { status: 401 });
  const { email, password } = body.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  if (!user) {
    await hashPassword(password); // spend the same time as a real check, so timing doesn't leak it either
    return NextResponse.json(BAD_LOGIN, { status: 401 });
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(BAD_LOGIN, { status: 401 });
  }

  await startLogin(user.id);
  return NextResponse.json({ ok: true });
}
