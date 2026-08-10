"use server";

import { runs, tasks } from "@trigger.dev/sdk";
import { revalidatePath } from "next/cache";

import { validateWebEnv } from "@/lib/env";
import { LeadSchema } from "@/lib/types";
import { getUser } from "@/server/dal";
import { validateAuthEnv } from "@/server/env";
import {
  ownsRun,
  recordRunOutcome,
  recordRunStarted,
  reconcilePending,
} from "@/server/history";
import { isRunId, readRun } from "@/server/run-read";
import type { qualifyLeadTask } from "@/trigger/qualify-lead";

export type { RunSnapshot } from "@/server/run-read";

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
 *
 * Every action in this file re-checks the session for itself. The proxy also
 * bounces signed-out visitors, but a server action is a public endpoint and is
 * reachable without ever loading a page.
 */

export type StartRunResult =
  | { ok: true; runId: string; publicAccessToken: string }
  | { ok: false; message: string };

export async function startQualifyRun(input: unknown): Promise<StartRunResult> {
  // Not `verifySession()`: redirecting out of an action invoked from a submit
  // handler would throw away a filled-in form. The page already knows how to
  // show a message.
  const user = await getUser();

  if (!user) {
    return {
      ok: false,
      message: "You've been signed out. Refresh the page, sign in, and score the lead again.",
    };
  }

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
    validateAuthEnv();
  } catch {
    return {
      ok: false,
      message:
        "The site can't reach the scorer: a key is missing. Run `npm run check-env` — it names what's missing and where it belongs.",
    };
  }

  let handle;
  try {
    handle = await tasks.trigger<typeof qualifyLeadTask>("qualify-lead", parsed.data, {
      // Not used by the app. It makes the Trigger.dev dashboard navigable per
      // person, which is the only way to find a run if its history row is ever
      // lost.
      tags: [`user:${user.id}`],
    });
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

  // Saving the run has to succeed, and this is the one place that's true.
  //
  // The page's polling fallback will only answer for runs the caller owns, and
  // ownership means "there's a row". A run with no row is one the fallback can
  // never speak for — so if the live subscription also went quiet, a verdict
  // that had already been paid for would have no way of being collected. That
  // is the exact failure this project added the fallback to prevent, so an
  // unsaveable run is stopped rather than started.
  const saved = await recordRunStarted(handle.id, parsed.data);

  if (!saved) {
    await runs.cancel(handle.id).catch((error) => {
      console.error("startQualifyRun: could not cancel orphaned run", handle.id, error);
    });

    return {
      ok: false,
      message:
        "Your lead couldn't be saved to your history, so the run was stopped rather than left where you'd never find it. Try again.",
    };
  }

  revalidatePath("/history");

  return {
    ok: true,
    runId: handle.id,
    publicAccessToken: handle.publicAccessToken,
  };
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
 * Ownership is checked before Trigger.dev is touched. Checking afterwards would
 * leave this a read oracle for any run of this task — the hole would have moved
 * rather than closed. Everything it can't answer for looks identical from
 * outside, so it never reveals whether a given run exists.
 */
export async function fetchRunSnapshot(runId: unknown) {
  if (!isRunId(runId)) return { state: "unreachable" as const };

  try {
    validateWebEnv();
  } catch {
    return { state: "unreachable" as const };
  }

  // Not `verifySession()`. This is polled every few seconds while a run is in
  // flight; a redirect fired mid-poll would tear someone off a live scoring
  // page. "unreachable" is a state the page already knows how to sit with.
  const user = await getUser();
  if (!user) return { state: "unreachable" as const };

  if (!(await ownsRun(runId))) return { state: "unreachable" as const };

  return readRun(runId);
}

/**
 * Write down how a run ended.
 *
 * Called from the page the moment it settles on an outcome, so history is
 * up to date without waiting for anyone to visit it. Takes a run id and
 * nothing else: the result is re-read from Trigger.dev server-side, because a
 * verdict posted by the browser is not evidence of anything.
 */
export async function recordOutcome(runId: unknown): Promise<void> {
  if (!isRunId(runId)) return;

  const user = await getUser();
  if (!user) return;

  if (!(await ownsRun(runId))) return;

  await recordRunOutcome(runId);

  revalidatePath("/history");
}

/**
 * Catch up anything that finished while the tab was closed.
 *
 * Triggered by the history page once it has rendered, rather than during the
 * render itself — writing to the database as a side effect of rendering makes
 * the page uncacheable and runs again on every React retry.
 */
export async function reconcileHistory(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  await reconcilePending();

  revalidatePath("/history");
}
