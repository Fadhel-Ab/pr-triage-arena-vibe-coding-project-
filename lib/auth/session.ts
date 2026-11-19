import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Domain, PacingMode, Prisma, StackMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Who is looking at the page: a signed-in user, a guest, or nobody yet.
// Server-only: reads httpOnly cookies the browser's JS can't touch.

const LOGIN_COOKIE = "pta_login";
const GUEST_COOKIE = "pta_guest";
const LOGIN_DAYS = 30;

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export type ViewerUser = {
  id: string;
  name: string;
  email: string;
  prefDomain: Domain | null;
  prefStackMode: StackMode | null;
  prefPacing: PacingMode | null;
  prefCustomStack: string[];
};

export type Viewer = { user: ViewerUser | null; guestId: string | null };

// cache() = one DB lookup per request, however many components ask.
export const getViewer = cache(async (): Promise<Viewer> => {
  const store = await cookies();

  const token = store.get(LOGIN_COOKIE)?.value;
  if (token) {
    const login = await prisma.authSession.findUnique({
      where: { id: sha256(token) },
      select: {
        expiresAt: true,
        // Never select passwordHash here; this object is passed to components.
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            prefDomain: true,
            prefStackMode: true,
            prefPacing: true,
            prefCustomStack: true,
          },
        },
      },
    });
    if (login && login.expiresAt > new Date()) return { user: login.user, guestId: null };
  }

  return { user: null, guestId: store.get(GUEST_COOKIE)?.value ?? null };
});

/** Route handlers only (cookies can't be set while rendering a page). */
export async function startLogin(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LOGIN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({ data: { id: sha256(token), userId, expiresAt } });

  const store = await cookies();
  store.set(LOGIN_COOKIE, token, { ...COOKIE_BASE, expires: expiresAt });
  store.delete(GUEST_COOKIE); // signing in ends guest mode
}

export async function endLogin() {
  const store = await cookies();
  const token = store.get(LOGIN_COOKIE)?.value;
  // Delete the row too, so a copied cookie stops working after sign-out.
  if (token) await prisma.authSession.deleteMany({ where: { id: sha256(token) } });
  store.delete(LOGIN_COOKIE);
}

export async function startGuest() {
  const store = await cookies();
  if (store.get(GUEST_COOKIE)) return;
  // No `expires` = a browser-session cookie. Closing the browser drops it, which
  // is exactly the "you can't see this score later" rule for guests.
  store.set(GUEST_COOKIE, randomBytes(24).toString("base64url"), COOKIE_BASE);
}

/**
 * Where-clause matching only the attempts this viewer owns, or null when the
 * viewer owns nothing. Attempts with no owner (made before accounts existed)
 * never match, so they stay private until claimed.
 */
export function ownedBy(viewer: Viewer): Prisma.SessionWhereInput | null {
  if (viewer.user) return { userId: viewer.user.id };
  if (viewer.guestId) return { guestId: viewer.guestId };
  return null;
}

/** True when the current viewer owns attempt `sessionId`. Callers answer 404 otherwise. */
export async function canAccessSession(sessionId: string): Promise<boolean> {
  const owner = ownedBy(await getViewer());
  if (!owner) return false;
  return (await prisma.session.count({ where: { id: sessionId, ...owner } })) > 0;
}
