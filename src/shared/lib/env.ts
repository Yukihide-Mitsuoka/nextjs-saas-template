import { z } from "zod";

/**
 * Typed, validated access to server-side environment variables (fail fast — COD-010:
 * validate at the boundary, never deep inside business logic).
 *
 * Server-only: importing this from client code must fail the build, because secrets
 * would otherwise leak into the bundle. Client-visible variables are the NEXT_PUBLIC_*
 * ones only, read directly where needed.
 */
const envSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
  CLOUD_TASKS_QUEUE: z.string().min(1).optional(),
  CLOUD_TASKS_INVOKER_SA: z.string().email().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Parse once, reuse; throws a readable error listing every invalid variable. */
export function env(): Env {
  if (cached === undefined) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid environment configuration — ${details}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Test seam: clear the cache so each test can vary process.env. */
export function resetEnvCache(): void {
  cached = undefined;
}
