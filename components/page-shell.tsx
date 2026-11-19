import Link from "next/link";
import { cn } from "@/lib/utils";

// Title block + centered column shared by the lobby, dashboard and /new.
export function PageShell({
  children,
  wide,
  aside,
}: {
  children: React.ReactNode;
  wide?: boolean; // dashboard needs room for the trials list
  aside?: React.ReactNode; // top-right slot, e.g. "Signed in as … · Sign out"
}) {
  return (
    <main className={cn("mx-auto flex min-h-dvh flex-col gap-6 p-4 sm:p-6", wide ? "max-w-3xl" : "max-w-md justify-center")}>
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <Link href="/" className="font-mono text-2xl font-semibold">
            PR Triage Arena
          </Link>
          <p className="text-sm text-muted-foreground">Timed code review against a hidden answer key.</p>
        </div>
        {aside}
      </header>
      {children}
    </main>
  );
}
