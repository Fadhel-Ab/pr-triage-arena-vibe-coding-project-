import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LobbyForm, type LobbyConfig } from "@/components/lobby/lobby-form";
import { SignedInAs } from "@/components/lobby/signed-in-as";
import { PageShell } from "@/components/page-shell";
import { DEFAULT_CONFIG } from "@/lib/arena/stack";
import { getViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// "Start a new trial" for signed-in users, pre-filled with their last settings.
// Guests pick settings on the home page instead.
export default async function NewTrialPage() {
  const { user } = await getViewer();
  if (!user) redirect("/");

  const initialConfig: LobbyConfig = {
    domain: user.prefDomain ?? DEFAULT_CONFIG.domain,
    stackMode: user.prefStackMode ?? DEFAULT_CONFIG.stackMode,
    pacing: user.prefPacing ?? DEFAULT_CONFIG.pacing,
    customStack: user.prefCustomStack,
  };

  return (
    <PageShell aside={<SignedInAs name={user.name} />}>
      <div className="space-y-1">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />
          Your trials
        </Link>
        <h2 className="text-lg font-semibold">New trial</h2>
        {user.prefDomain && <p className="text-xs text-muted-foreground">Pre-filled with your last settings.</p>}
      </div>
      <LobbyForm initialConfig={initialConfig} />
    </PageShell>
  );
}
