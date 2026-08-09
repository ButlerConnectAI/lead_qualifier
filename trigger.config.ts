import { defineConfig } from "@trigger.dev/sdk";

/**
 * No `syncVercelEnvVars` extension, deliberately. It pulls Vercel's env vars
 * into Trigger.dev, which encourages putting ANTHROPIC_API_KEY in Vercel where
 * it has no business being — the frontend never calls Claude. Set Trigger.dev's
 * env vars in the Trigger.dev dashboard. See CLAUDE.md.
 */
export default defineConfig({
  project: "proj_kvcjxigyooqcdqgjiyef",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
});
