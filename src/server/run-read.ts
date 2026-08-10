import "server-only";

import { runs } from "@trigger.dev/sdk";

import {
  isFailedRunStatus,
  isRunPhase,
  VerdictSchema,
  type RunPhase,
  type Verdict,
} from "@/lib/types";
import type { qualifyLeadTask } from "@/trigger/qualify-lead";

/**
 * Reading one scoring run from Trigger.dev, server-side.
 *
 * Three callers need this and they must agree on what a run's state means: the
 * page's polling fallback, saving a finished verdict to history, and filling in
 * history rows whose run finished after the tab was closed. Written once so a
 * verdict can't be judged "done" by one and "malformed" by another.
 *
 * `qualifyLeadTask` is imported as a type only. A real import pulls the task and
 * the Anthropic SDK into the Next.js bundle — the boundary this architecture
 * exists to keep.
 *
 * Web-only. The Trigger.dev task never imports this, so changing it needs a
 * push but not `npm run deploy:task`.
 */

export type RunSnapshot =
  | { state: "pending"; phase: RunPhase | null; awaitingWorker: boolean }
  | { state: "done"; verdict: Verdict }
  | { state: "failed" }
  | { state: "malformed" }
  | { state: "unreachable" };

/** Cheap shape check before spending a network call on it. */
export function isRunId(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("run_") && value.length <= 100;
}

export async function readRun(runId: string): Promise<RunSnapshot> {
  try {
    const run = await runs.retrieve<typeof qualifyLeadTask>(runId);

    if (run.taskIdentifier !== "qualify-lead") return { state: "unreachable" };

    if (isFailedRunStatus(run.status)) return { state: "failed" };

    if (run.status === "COMPLETED") {
      // The deployed task could be an older version returning an older shape,
      // so the output is checked rather than trusted.
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
    console.error("readRun: could not read run", runId, error);

    return { state: "unreachable" };
  }
}
