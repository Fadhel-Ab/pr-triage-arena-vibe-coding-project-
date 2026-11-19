"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "sign-in" | "sign-up";

const COPY = {
  "sign-in": { title: "Sign in", submit: "Sign in", busy: "Signing in…", switchText: "No account yet?", switchLink: "Create one", switchHref: "/sign-up" },
  "sign-up": { title: "Create an account", submit: "Create account", busy: "Creating account…", switchText: "Already have an account?", switchLink: "Sign in", switchHref: "/sign-in" },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return; // no double submit on a slow network
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Server error (HTTP ${res.status})`);
      // refresh() so server components re-read the new login cookie.
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-5 p-6">
      <div>
        <Link href="/" className="font-mono text-sm text-muted-foreground hover:underline">
          PR Triage Arena
        </Link>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        {mode === "sign-up" && (
          <p className="text-sm text-muted-foreground">Keep your scores and reuse your settings and stack next time.</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "sign-up" && <Field name="name" label="Name" autoComplete="name" />}
        <Field name="email" label="Email" type="email" autoComplete="email" />
        <Field
          name="password"
          label="Password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          minLength={mode === "sign-up" ? 8 : undefined}
          hint={mode === "sign-up" ? "At least 8 characters." : undefined}
        />

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? copy.busy : copy.submit}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="font-medium text-foreground underline">
          {copy.switchLink}
        </Link>
        {" · "}
        <Link href="/" className="underline">
          Play as a guest
        </Link>
      </p>
    </main>
  );
}

function Field({ name, label, hint, ...props }: { name: string; label: string; hint?: string } & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input id={name} name={name} required aria-describedby={hint ? `${name}-hint` : undefined} {...props} />
      {hint && (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
