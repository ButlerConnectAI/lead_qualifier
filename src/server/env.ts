import "server-only";

/**
 * Environment validation for the accounts half of the app.
 *
 * Deliberately separate from `src/lib/env.ts` rather than added to it. That
 * file is imported by the Trigger.dev task, so editing it means the task's
 * bundle changed and `npm run deploy:task` is owed — for a feature the task
 * knows nothing about. Keeping this here is what makes "accounts ship in one
 * push" true rather than nearly true. See CLAUDE.md, "Two deploys, one repo".
 */

const AUTH_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

/**
 * Whether accounts are configured at all.
 *
 * Checked before building a Supabase client rather than after. The client
 * constructor throws on a missing URL, and the proxy runs on every request —
 * so without this, a missing variable takes down every page including the
 * login page, with an error that names none of it. Which is precisely the
 * state this project is in the first time it's pulled, before the Supabase
 * project exists.
 */
export function hasAuthEnv(): boolean {
  return AUTH_KEYS.every((key) => Boolean(process.env[key]));
}

/** Call before anything that needs a signed-in user. */
export function validateAuthEnv(): void {
  const missing = AUTH_KEYS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
