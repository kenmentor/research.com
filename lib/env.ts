import { z } from "zod";

/**
 * Central environment contract.
 *
 * Only MONGODB_URI is required in V1. Vendor keys (Auth.js, Pusher,
 * Resend, storage) are optional until their tasks land — each feature
 * validates its own keys when first used.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z
    .string({
      error: "MONGODB_URI is required. Add it to .env.local (see .env.example).",
    })
    .min(1, "MONGODB_URI is required. Add it to .env.local (see .env.example)."),
  AUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Parse and cache the environment. Throws a descriptive error naming the
 * offending variable on first use — called at server startup
 * (instrumentation.ts) so boot halts before routes or DB init.
 */
export function getEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper: clear the cached parse. */
export function resetEnvCacheForTests(): void {
  cached = null;
}
