import * as z from "zod";

/**
 * The lead and the verdict, defined once.
 *
 * The form validates against these, the task validates against these, and
 * Claude's output is constrained by these. One definition, three uses — which
 * is the reason the frontend and the backend share a repo at all.
 *
 * The `.describe()` calls are not documentation. They are converted to JSON
 * Schema in qualify.ts and handed to Claude as part of the tool definition, so
 * they instruct the model directly. Edit them like prompt text, because they
 * are prompt text.
 */

// --- Lead ---------------------------------------------------------------
// Only company and ask are required. Everything else is deliberately
// optional: a lead that arrives with eight blank fields is a real signal
// about lead quality, and the rubric is told to treat it as one.

export const LeadSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(200),
  ask: z
    .string()
    .trim()
    .min(1, "What they asked for is required")
    .max(4000)
    .describe("What the lead asked for, or the problem they described."),

  website: z.string().trim().max(500).optional(),
  industry: z.string().trim().max(200).optional(),
  companySize: z.string().trim().max(200).optional(),

  contactName: z.string().trim().max(200).optional(),
  contactRole: z.string().trim().max(200).optional(),

  // Free text, not a dropdown of bands. "said they've got budget approved for
  // Q3" carries far more signal than a number, and the model reads it fine.
  budgetSignal: z.string().trim().max(1000).optional(),
  timeline: z.string().trim().max(1000).optional(),

  source: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export type Lead = z.infer<typeof LeadSchema>;

/** Field order for the form and for rendering a lead into the prompt. */
export const LEAD_FIELDS = [
  "company",
  "ask",
  "website",
  "industry",
  "companySize",
  "contactName",
  "contactRole",
  "budgetSignal",
  "timeline",
  "source",
  "notes",
] as const satisfies readonly (keyof Lead)[];

// --- Verdict ------------------------------------------------------------

export const TIERS = ["qualified", "nurture", "disqualified"] as const;
export type Tier = (typeof TIERS)[number];

export const CRITERION_VERDICTS = ["strong", "adequate", "weak", "unknown"] as const;

export const CriterionSchema = z.object({
  name: z.string().describe("The criterion being judged, e.g. 'Budget signal'."),
  verdict: z
    .enum(CRITERION_VERDICTS)
    .describe("Use 'unknown' when the lead simply doesn't say — do not guess."),
  reason: z.string().describe("One sentence. Cite what in the lead led you here."),
});

export type Criterion = z.infer<typeof CriterionSchema>;

export const VerdictSchema = z.object({
  score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Overall fit, 0-100. The tier boundaries are defined in the criteria you were given."),
  tier: z.enum(TIERS),
  headline: z
    .string()
    .describe("One sentence a busy person could read aloud. No preamble, no hedging."),
  criteria: z
    .array(CriterionSchema)
    .min(1)
    .describe("One entry per criterion in the profile you were given."),
  biggestRisk: z
    .string()
    .describe("The single thing most likely to make this lead a waste of time."),
  missingInfo: z
    .array(z.string())
    .describe(
      "Questions to ask before committing time. Empty array if the lead genuinely covers everything.",
    ),
  protectYourself: z
    .array(z.string())
    .describe(
      "What to agree in writing before starting, given how engagements of this shape go wrong. Not doubts about the lead — terms. Include for qualified leads too. Empty array only if the lead genuinely raises nothing.",
    ),
  nextAction: z.string().describe("One concrete next step. Not a list."),
});

export type Verdict = z.infer<typeof VerdictSchema>;

// --- Run status ---------------------------------------------------------
// Phases the task writes to run metadata so the frontend can show something
// specific while it waits, rather than a bare spinner.

export const RUN_PHASES = {
  validating: "Checking the lead…",
  scoring: "Scoring against your criteria…",
  done: "Done",
} as const;

export type RunPhase = keyof typeof RUN_PHASES;

/**
 * Terminal states that are not success. Read by both the live subscription and
 * the server-side fallback lookup, so the two can't disagree about what
 * counts as a failure.
 */
export const RUN_FAILED_STATUSES = [
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "CANCELED",
  "EXPIRED",
  "TIMED_OUT",
] as const;

export function isFailedRunStatus(status: string): boolean {
  return (RUN_FAILED_STATUSES as readonly string[]).includes(status);
}

export function isRunPhase(value: unknown): value is RunPhase {
  return typeof value === "string" && value in RUN_PHASES;
}
