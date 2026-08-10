"use server";

import { runs, tasks } from "@trigger.dev/sdk";

import { validateWebEnv } from "@/lib/env";
import {
  isFailedRunStatus,
  isRunPhase,
  LeadSchema,
  VerdictSchema,
  type RunPhase,
  type Verdict,
} from "@/lib/types";
import type { qualifyLeadTask } from "@/trigger/qualify-lead";

/**
 * The only server-side step in a scoring run.
 *
 * It triggers the task and hands back a run ID plus a token scoped to that one
 * run, then it's finished — the browser subscribes to Trigger.dev directly and
 * waits there instead. Nothing here awaits Claude, which is the whole reason
 * scoring can take as long as it needs without a function timeout.
 *
 * `qualifyLeadTask` is imported as a type only. A real import would pull the
 * task and the Anthropic SDK into the Next.js bundle, which is exactly the
 * boundary this architecture exists to keep.
 */

export type StartRunResult =
  | { ok: true; runId: string; publicAccessToken: string }
  | { ok: false; message: string };

export async function startQualifyRun(input: unknown): Promise<StartRunResult> {
  // Validated in the browser too. That one is a convenience; this one is the
  // boundary, because a server action is a public endpoint.
  const parsed = LeadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "That lead didn't look right. Check the company and the ask, then try again.",
    };
  }

  try {
    validateWebEnv();
  } catch {
    return {
      ok: false,
      message:
        "The site can't reach the scorer: TRIGGER_SECRET_KEY isn't set. Run `npm run check-env` — it names what's missing and where it belongs.",
    };
  }

  try {
    const handle = await tasks.trigger<typeof qualifyLeadTask>("qualify-lead", parsed.data);

    return {
      ok: true,
      runId: handle.id,
      publicAccessToken: handle.publicAccessToken,
    };
  } catch (error) {
    // Overwhelmingly the local worker not running, or a key for the wrong
    // environment. Name both, because the raw error names neither.
    console.error("startQualifyRun: could not trigger qualify-lead", error);

    return {
      ok: false,
      message:
        "Couldn't start the scorer. If you're running locally, check `npm run dev:task` is running and shows `Local worker ready`.",
    };
  }
}

/**
 * The fallback the waiting page uses to ask "is it done yet?".
 *
 * The browser's live subscription to Trigger.dev is the fast path, but it can
 * go quiet without reporting an error — a proxy that buffers the stream or an
 * extension that blocks the connection both look like a run that never
 * finishes. When that happens the verdict exists and is simply never
 * collected, which is a bad way to lose a paid run. So the page also asks
 * this, over the same ordinary connection that served the page itself.
 *
 * This goes through the server rather than the browser's per-run token because
 * the whole point is to not depend on the browser reaching Trigger.dev.
 *
 * It is a public endpoint, so it answers only for this one task's runs and
 * returns only the fields the page renders. The run ID is the capability: it's
 * unguessable, and it's already in the browser of whoever started the run.
 */
export type RunSnapshot =
  | { state: "pending"; phase: RunPhase | null; awaitingWorker: boolean }
  | { state: "done"; verdict: Verdict }
  | { state: "failed" }
  | { state: "malformed" }
  | { state: "unreachable" };

export async function fetchRunSnapshot(runId: unknown): Promise<RunSnapshot> {
  if (typeof runId !== "string" || !runId.startsWith("run_") || runId.length > 100) {
    return { state: "unreachable" };
  }

  try {
    validateWebEnv();
  } catch {
    return { state: "unreachable" };
  }

  try {
    const run = await runs.retrieve<typeof qualifyLeadTask>(runId);

    if (run.taskIdentifier !== "qualify-lead") return { state: "unreachable" };

    if (isFailedRunStatus(run.status)) return { state: "failed" };

    if (run.status === "COMPLETED") {
      const parsed = VerdictSchema.safeParse(run.output);

      return parsed.success ? { state: "done", verdict: parsed.data } : { state: "malformed" };
    }

    const phase = (run.metadata as Record<string, unknown> | undefined)?.phase;

    return {
      state: "pending",
      phase: isRunPhase(phase) ? phase : null,
      awaitingWorker: run.status === "PENDING_VERSION",
    };
  } catch (error) {
    console.error("fetchRunSnapshot: could not read run", runId, error);

    return { state: "unreachable" };
  }
}
