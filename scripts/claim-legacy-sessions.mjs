// One-off: give every attempt made before accounts existed (no user, no guest
// owner) to one account. Until claimed, those attempts are visible to nobody.
//
// 1. Sign up in the app with your email.
// 2. npm run claim-sessions -- you@example.com
//
// Safe to run twice: the second run finds nothing left to claim.
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run claim-sessions -- you@example.com");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) {
    console.error(`No account for ${email}. Sign up in the app first, then run this again.`);
    process.exitCode = 1;
  } else {
    const { count } = await prisma.session.updateMany({
      where: { userId: null, guestId: null },
      data: { userId: user.id },
    });
    console.log(`Assigned ${count} earlier attempt(s) to ${user.name} <${email}>.`);
  }
} finally {
  await prisma.$disconnect();
}
