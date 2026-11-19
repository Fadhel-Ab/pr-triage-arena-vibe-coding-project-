import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { startLogin } from "@/lib/auth/session";

const bodyZ = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(request: Request) {
  const body = bodyZ.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password } = body.data;

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
    await startLogin(user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    // Unique constraint on email. Catching it (instead of checking first) also
    // covers two sign-ups with the same email racing each other.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }
    console.error("sign-up failed", error);
    return NextResponse.json({ error: "Could not create the account. Try again." }, { status: 500 });
  }
}
