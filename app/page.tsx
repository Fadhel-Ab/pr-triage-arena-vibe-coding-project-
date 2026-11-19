import Link from "next/link";
import { CircleAlert, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GuestButton } from "@/components/lobby/auth-buttons";
import { LobbyForm } from "@/components/lobby/lobby-form";
import { SignedInAs } from "@/components/lobby/signed-in-as";
import { PageShell } from "@/components/page-shell";
import { DOMAIN_LABEL, PACING_LABEL, TRIAL_STATE, scorePercent } from "@/lib/arena/labels";
import { DEFAULT_CONFIG } from "@/lib/arena/stack";
import { getViewer, type ViewerUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

// Depends on the login cookie, so it can't be prerendered.
export const dynamic = "force-dynamic";

const TRIALS_SHOWN = 50;

export default async function Home() {
  const viewer = await getViewer();
  if (viewer.user) return <Dashboard user={viewer.user} />;

  // Nobody yet: pick sign in, sign up, or guest.
  if (!viewer.guestId) {
    return (
      <PageShell>
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
      </PageShell>
    );
  }

  // Guest: fresh defaults every time + the warning.
  return (
    <PageShell>
      <p role="note" className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          You&apos;re playing as a guest. You&apos;ll see your score at the end, but{" "}
          <strong>you can&apos;t come back to it later</strong>.{" "}
          <Link href="/sign-up" className="font-medium underline">Create an account</Link> to keep your scores, or{" "}
          <Link href="/sign-in" className="underline">sign in</Link>.
        </span>
      </p>
      <LobbyForm initialConfig={DEFAULT_CONFIG} />
    </PageShell>
  );
}

// Signed in: start a new trial, or go back to an old one.
async function Dashboard({ user }: { user: ViewerUser }) {
  const trials = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: TRIALS_SHOWN,
    select: {
      id: true,
      title: true,
      status: true,
      domain: true,
      pacing: true,
      stackLabel: true,
      createdAt: true,
      grade: { select: { totalScore: true, maxScore: true } },
    },
  });

  // Stats over graded trials only; an unfinished one has no score yet.
  const scores = trials.flatMap((t) => (t.grade ? [scorePercent(t.grade.totalScore, t.grade.maxScore)] : []));
  const stats = [
    { label: "Trials", value: String(trials.length) },
    { label: "Average", value: scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : "—" },
    { label: "Best", value: scores.length ? `${Math.max(...scores)}%` : "—" },
  ];

  return (
    <PageShell wide aside={<SignedInAs name={user.name} />}>
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready for another PR?</h2>
          <p className="text-sm text-muted-foreground">
            {user.prefDomain
              ? `Last time: ${DOMAIN_LABEL[user.prefDomain]} · ${PACING_LABEL[user.prefPacing ?? "SPRINT"]}. Your settings are saved.`
              : "Pick a domain, stack and pace, then review against the clock."}
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/new">
            <Plus aria-hidden />
            Start a new trial
          </Link>
        </Button>
      </section>

      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Your trials</h2>
        {trials.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No trials yet. <Link href="/new" className="font-medium text-foreground underline">Start your first one</Link>.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {trials.map((t) => {
              const state = TRIAL_STATE[t.status];
              const href = state.to === "results" ? `/session/${t.id}/results` : `/session/${t.id}`;
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                  <div className="min-w-0 flex-1 basis-60">
                    <Link href={href} className="block truncate font-medium hover:underline">
                      {t.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {DOMAIN_LABEL[t.domain]} · {PACING_LABEL[t.pacing]} · {t.stackLabel} ·{" "}
                      {t.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {t.grade ? (
                    <span className="font-mono text-lg font-semibold tabular-nums">
                      {scorePercent(t.grade.totalScore, t.grade.maxScore)}%
                    </span>
                  ) : (
                    <Badge variant="outline" className={cn(t.status === "GRADING_FAILED" && "border-red-500/50 text-red-300")}>
                      {state.label}
                    </Badge>
                  )}
                  <Button asChild variant={t.grade ? "outline" : "secondary"} size="sm">
                    <Link href={href}>{state.action}</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {trials.length === TRIALS_SHOWN && (
          <p className="text-xs text-muted-foreground">Showing your {TRIALS_SHOWN} most recent trials.</p>
        )}
      </section>
    </PageShell>
  );
}
