import { z } from "zod";

// Shared by the lobby (client) and the generate route (server).

export const MAX_CUSTOM_STACK = 6;

export const STACK_SUGGESTIONS = [
  "React",
  "Next.js",
  "Angular",
  "Vue",
  "Svelte",
  "React Native",
  "Flutter",
  "Node.js",
  "Express",
  "NestJS",
  "Fastify",
  "Django",
  "FastAPI",
  "Spring Boot",
  "ASP.NET Core",
  "Go",
  "Laravel",
  "Ruby on Rails",
  "GraphQL",
  "tRPC",
  "Prisma",
  "Drizzle",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Supabase",
  "Firebase",
] as const;

// Technology names only. The value goes into the model prompt, so the charset is
// kept tight: no newlines or quotes to smuggle extra instructions in.
export const stackItemZ = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .regex(/^[\w .+#/-]+$/, "Letters, numbers, spaces and . + # / - only");

export const customStackZ = z
  .array(stackItemZ)
  .max(MAX_CUSTOM_STACK)
  // Drop case-insensitive duplicates ("react" + "React").
  .transform((items) => items.filter((v, i) => items.findIndex((w) => w.toLowerCase() === v.toLowerCase()) === i));
