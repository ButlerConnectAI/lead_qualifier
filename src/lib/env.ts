/**
 * Environment validation.
 *
 * Each half of the app validates its own keys. The task must not demand
 * TRIGGER_SECRET_KEY, and the frontend must never see ANTHROPIC_API_KEY —
 * see CLAUDE.md, "The secret boundary".
 *
 * Validate up front, before any paid work. A lazy per-variable check only
 * fires when that variable is first touched, which can be after an Anthropic
 * call has already been paid for. (Learned the hard way in C:\trigger-builds.)
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validate(keys: readonly string[]): void {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

/** Call at the top of the Trigger.dev task, before the Anthropic call. */
export function validateTaskEnv(): void {
  validate(["ANTHROPIC_API_KEY"]);
}

/** Call in the Next.js server action, before triggering a run. */
export function validateWebEnv(): void {
  validate(["TRIGGER_SECRET_KEY"]);
}

export const env = {
  get ANTHROPIC_API_KEY() {
    return required("ANTHROPIC_API_KEY");
  },
  get TRIGGER_SECRET_KEY() {
    return required("TRIGGER_SECRET_KEY");
  },
};
