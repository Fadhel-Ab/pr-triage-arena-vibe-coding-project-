import { SignOutButton } from "@/components/lobby/auth-buttons";

export function SignedInAs({ name }: { name: string }) {
  return (
    <p className="flex items-baseline gap-2 text-sm">
      <span className="text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{name}</span>
      </span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <SignOutButton />
    </p>
  );
}
