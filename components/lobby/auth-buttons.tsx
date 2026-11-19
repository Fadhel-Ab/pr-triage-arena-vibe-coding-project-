"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Small POST-then-refresh buttons. refresh() makes the server components
// re-read the cookies the route just changed.
function useAuthAction(path: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch {
      setError("That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, error };
}

export function GuestButton() {
  const { run, busy, error } = useAuthAction("/api/auth/guest");
  return (
    <div className="space-y-1">
      <Button variant="outline" size="lg" className="w-full" onClick={run} disabled={busy}>
        {busy ? "Starting…" : "Continue as guest"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function SignOutButton() {
  const { run, busy } = useAuthAction("/api/auth/sign-out");
  return (
    <Button variant="link" size="sm" className="h-auto p-0" onClick={run} disabled={busy}>
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}
