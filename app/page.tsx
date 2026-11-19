import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestButton, SignOutButton } from "@/components/lobby/auth-buttons";
import { LobbyForm, type LobbyConfig } from "@/components/lobby/lobby-form";
import { getViewer } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// Depends on the login cookie, so it can't be prerendered.
export const dynamic = "force-dynamic";

const DEFAULT_CONFIG: LobbyConfig = { domain: "BACKEND_API", stackMode: "CORE", pacing: "SPRINT", customStack: [] };

export default async function Home() {
  const viewer = await getViewer();

  // Nobody yet: pick sign in, sign up, or guest.
  if (!viewer.user && !viewer.guestId) {
    return (
      <Shell>
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href="/sign-up">Create an account</Link>
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or just try it
            <span className="h-px flex-1 bg-border" />
          </div>
          <GuestButton />
          <p className="text-xs text-muted-foreground">
            Guests see their score once, at the end of the attempt. An account keeps your history and remembers your
            settings and stack.
          </p>
        </div>
      </Shell>
    );
  }

  // Guest: fresh defaults every time + the warning.
  if (!viewer.user) {
    return (
      <Shell>
        <p role="note" className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            You&apos;re playing as a guest. You&apos;ll see your score at the end, but{" "}
            <strong>you can&apos;t come back to it later</strong>. <Link href="/sign-up" className="font-medium underline">Create an account</Link>{" "}
            to keep your scores, or <Link href="/sign-in" className="underline">sign in</Link>.
          </span>
        </p>
        <LobbyForm initialConfig={DEFAULT_CONFIG} />
      </Shell>
    );
  }

  // Signed in: last-used settings + recent scores.
  const { user } = viewer;
  const initialConfig: LobbyConfig = {
    domain: user.prefDomain ?? DEFAULT_CONFIG.domain,
    stackMode: user.prefStackMode ?? DEFAULT_CONFIG.stackMode,
    pacing: user.prefPacing ?? DEFAULT_CONFIG.pacing,
    customStack: user.prefCustomStack,
  };
  const recent = await prisma.gradeReport.findMany({
    where: { session: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { sessionId: true, totalScore: true, maxScore: true, createdAt: true, session: { select: { title: true } } },
  });

  return (
    <Shell>
      <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          Signed in as <span className="font-medium">{user.name}</span>
        </span>
        <SignOutButton />
      </p>
      <LobbyForm initialConfig={initialConfig} />

      {recent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground">Your recent attempts</h2>
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {recent.map((r) => (
              <li key={r.sessionId}>
                <Link href={`/session/${r.sessionId}/results`} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/40">
                  <span className="min-w-0 truncate">{r.session.title}</span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {r.maxScore > 0 ? Math.round((Math.max(0, r.totalScore) / r.maxScore) * 100) : 0}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      <div>
        <h1 className="font-mono text-2xl font-semibold">PR Triage Arena</h1>
        <p className="text-sm text-muted-foreground">Timed code review against a hidden answer key.</p>
      </div>
      {children}
    </main>
  );
}
