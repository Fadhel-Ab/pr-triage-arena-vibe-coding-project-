"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_CUSTOM_STACK, STACK_SUGGESTIONS, stackItemZ } from "@/lib/arena/stack";
import { cn } from "@/lib/utils";

const OPTIONS = {
  domain: [
    ["FULL_STACK", "Full-Stack"],
    ["BACKEND_API", "Backend API"],
    ["FRONTEND_STATE_UI", "Frontend State / UI"],
    ["DATABASE_SECURITY", "Database / Security"],
    ["MOBILE_FLUTTER", "Mobile (Flutter / Dart)"],
  ],
  stackMode: [
    ["CORE", "Author's stack · Next.js, NestJS, Prisma, PostgreSQL"],
    ["CURVEBALL", "Curveball · an unfamiliar stack"],
    ["CUSTOM", "Custom · pick your own"],
  ],
  pacing: [
    ["SPRINT", "Sprint · 15 min · 2 files"],
    ["FULL_SIMULATION", "Full Simulation · 38 min · 4 files"],
  ],
} as const;

const LABELS = { domain: "Domain", stackMode: "Stack", pacing: "Difficulty & pacing" } as const;

export type LobbyConfig = { domain: string; stackMode: string; pacing: string; customStack: string[] };

export function LobbyForm({ initialConfig }: { initialConfig: LobbyConfig }) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = config.stackMode === "CUSTOM";
  const customMissing = isCustom && config.customStack.length === 0;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      // A crash or platform timeout returns a non-JSON body, so don't assume JSON.
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Server error (HTTP ${res.status})`);
      router.push(`/session/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map((key) => (
        <div key={key} className="space-y-1">
          <label htmlFor={key} className="text-xs font-medium text-muted-foreground">
            {LABELS[key]}
          </label>
          <Select value={config[key]} onValueChange={(v) => setConfig((c) => ({ ...c, [key]: v }))}>
            <SelectTrigger id={key} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS[key].map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {key === "stackMode" && isCustom && (
            <StackPicker
              value={config.customStack}
              onChange={(customStack) => setConfig((c) => ({ ...c, customStack }))}
            />
          )}
        </div>
      ))}

      <Button size="lg" className="w-full" onClick={generate} disabled={loading || customMissing}>
        {loading ? "Generating scenario… (up to a minute)" : "Generate PR"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function StackPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const full = value.length >= MAX_CUSTOM_STACK;
  const has = (item: string) => value.some((v) => v.toLowerCase() === item.toLowerCase());

  function add(raw: string) {
    const parsed = stackItemZ.safeParse(raw);
    if (!parsed.success) return setHint(parsed.error.issues[0]?.message ?? "Invalid name");
    if (has(parsed.data)) return setHint(`${parsed.data} is already in your stack`);
    if (full) return setHint(`Up to ${MAX_CUSTOM_STACK} technologies`);
    onChange([...value, parsed.data]);
    setDraft("");
    setHint(null);
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item));
    setHint(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (draft.trim()) add(draft);
    }
  }

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-border bg-card p-3">
      <div aria-live="polite">
        <p className="mb-1.5 text-xs text-muted-foreground">
          Your stack ({value.length}/{MAX_CUSTOM_STACK})
        </p>
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Pick at least one technology below.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {value.map((item) => (
              <li key={item}>
                <Badge variant="secondary" className="gap-1 pr-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="rounded-sm p-0.5 hover:bg-background/40"
                    aria-label={`Remove ${item}`}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STACK_SUGGESTIONS.filter((s) => !has(s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            disabled={full}
            className={cn(
              "rounded-md border border-border px-2 py-0.5 text-xs transition-colors",
              full ? "cursor-not-allowed opacity-40" : "hover:border-ring hover:bg-muted",
            )}
          >
            + {s}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label htmlFor="stack-other" className="text-xs text-muted-foreground">
          Something else? Type it and press Enter
        </label>
        <Input
          id="stack-other"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. Elixir Phoenix"
          maxLength={30}
          disabled={full}
          aria-invalid={hint ? true : undefined}
          aria-describedby={hint ? "stack-hint" : undefined}
        />
        {hint && (
          <p id="stack-hint" className="text-xs text-amber-300">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
