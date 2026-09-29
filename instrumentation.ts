export async function register() {
  // Fail fast at server startup (dev + production runtime) when required
  // env is missing — before routes or DB connections initialize.
  // Note: `next build` never executes this, so builds stay hermetic.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("./lib/env");
    getEnv();
  }
}
