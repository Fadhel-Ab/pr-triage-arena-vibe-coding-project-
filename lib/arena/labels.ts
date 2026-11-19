import type { Domain, PacingMode, SessionStatus } from "@prisma/client";

// Short display names for lists. (The lobby's dropdowns use longer ones.)

export const DOMAIN_LABEL: Record<Domain, string> = {
  FULL_STACK: "Full-Stack",
  BACKEND_API: "Backend API",
  FRONTEND_STATE_UI: "Frontend State / UI",
  DATABASE_SECURITY: "Database / Security",
  MOBILE_FLUTTER: "Mobile (Flutter)",
};

export const PACING_LABEL: Record<PacingMode, string> = {
  SPRINT: "Sprint",
  FULL_SIMULATION: "Full Simulation",
};

// What the player can do next with an attempt, by status.
export const TRIAL_STATE: Record<SessionStatus, { label: string; action: string; to: "arena" | "results" }> = {
  READY: { label: "Not started", action: "Start", to: "arena" },
  IN_PROGRESS: { label: "In progress", action: "Resume", to: "arena" },
  SUBMITTED: { label: "Not graded yet", action: "Get results", to: "results" },
  GRADING_FAILED: { label: "Grading failed", action: "Retry grading", to: "results" },
  GRADED: { label: "Graded", action: "View results", to: "results" },
};

export function scorePercent(totalScore: number, maxScore: number): number {
  return maxScore > 0 ? Math.round((Math.max(0, totalScore) / maxScore) * 100) : 0;
}
