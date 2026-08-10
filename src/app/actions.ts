"use server";

import { tasks } from "@trigger.dev/sdk";

import { validateWebEnv } from "@/lib/env";
import { LeadSchema } from "@/lib/types";
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
