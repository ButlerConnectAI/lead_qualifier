import { logger, metadata, task } from "@trigger.dev/sdk";

import { validateTaskEnv } from "../lib/env";
import { qualify, QualifyError } from "../lib/qualify";
import { LeadSchema, RUN_PHASES, type Lead, type Verdict } from "../lib/types";

/**
 * Thin wrapper around qualify(). Logic that lives here instead of in
 * src/lib/qualify.ts is harder to reason about and can only be exercised
 * through a run — keep this file boring.
 */
export const qualifyLeadTask = task({
  id: "qualify-lead",
  maxDuration: 180,
  run: async (payload: Lead): Promise<Verdict> => {
    metadata.set("phase", "validating");
    validateTaskEnv();

    const lead = LeadSchema.parse(payload);

    logger.log("qualify-lead: starting", {
      company: lead.company,
      providedFields: Object.entries(lead).filter(([, v]) => v).length,
    });

    metadata.set("phase", "scoring");
    const startedAt = Date.now();

    let verdict: Verdict;
    try {
      verdict = await qualify(lead);
    } catch (error) {
      if (error instanceof QualifyError) {
        logger.error("qualify-lead: scoring failed", {
          reason: error.reason,
          message: error.message,
        });
      }
      throw error;
    }

    metadata.set("phase", "done");

    logger.log("qualify-lead: done", {
      tier: verdict.tier,
      score: verdict.score,
      elapsedMs: Date.now() - startedAt,
    });

    return verdict;
  },
});

export { RUN_PHASES };
