import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { IDEAL_CUSTOMER_PROFILE } from "./icp";
import { LEAD_FIELDS, VerdictSchema, type Lead, type Verdict } from "./types";

/**
 * The scoring call.
 *
 * This file imports nothing from @trigger.dev/*. Keeping the scoring separable
 * from the task means retry behaviour, logging, and run metadata never tangle
 * with the prompt, and the rubric can be reasoned about on its own.
 */

const MODEL = "claude-sonnet-5";

/**
 * Covers adaptive thinking plus the verdict. Thinking is on by default on this
 * model and counts against max_tokens, so this is not just the answer's size.
 */
const MAX_TOKENS = 16000;

/**
 * The cost/quality dial. "medium" is the step-down if scoring gets expensive;
 * lower than that risks under-thinking a genuinely ambiguous lead.
 */
const EFFORT = "high" as const;

const SYSTEM_PROMPT = `You are the qualification filter for a one-person AI-automation agency. \
You are given a written profile of the ideal customer and the information the operator collected \
about one lead. Judge the lead against the profile and return a structured verdict.

Judge only what you are given. You have no ability to look anything up, so do not assume facts \
that aren't in the lead, and do not penalise a lead for something you merely suspect. Where the \
lead is silent, say so rather than guessing.

Be decisive. A verdict that hedges on every criterion is useless to someone deciding how to spend \
their week.

--- IDEAL CUSTOMER PROFILE ---

${IDEAL_CUSTOMER_PROFILE}`;

/** Human labels for the lead fields, so the model reads prose rather than keys. */
const FIELD_LABELS: Record<(typeof LEAD_FIELDS)[number], string> = {
  company: "Company",
  ask: "What they asked for",
  website: "Website",
  industry: "Industry",
  companySize: "Company size",
  contactName: "Contact name",
  contactRole: "Contact role",
  budgetSignal: "Budget signal",
  timeline: "Timeline",
  source: "Lead source",
  notes: "Notes",
};

/**
 * Absent fields are rendered as an explicit "not provided" rather than omitted.
 * The rubric treats missing information as a signal, so the model has to see
 * the gap instead of inferring it from the shape of the message.
 */
function renderLead(lead: Lead): string {
  return LEAD_FIELDS.map((field) => {
    const value = lead[field]?.trim();
    return `${FIELD_LABELS[field]}: ${value ? value : "(not provided)"}`;
  }).join("\n");
}

export class QualifyError extends Error {
  constructor(
    message: string,
    readonly reason: "refused" | "truncated" | "unparseable",
  ) {
    super(message);
    this.name = "QualifyError";
  }
}

export async function qualify(lead: Lead): Promise<Verdict> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: EFFORT,
      format: zodOutputFormat(VerdictSchema),
    },
    messages: [
      {
        role: "user",
        content: `Qualify this lead.\n\n${renderLead(lead)}`,
      },
    ],
  });

  // Check stop_reason before touching content: a refusal returns HTTP 200 with
  // empty or partial content, so reading it first would surface as a confusing
  // parse failure rather than what actually happened.
  if (response.stop_reason === "refusal") {
    throw new QualifyError(
      `Claude declined to score this lead${
        response.stop_details?.category ? ` (${response.stop_details.category})` : ""
      }.`,
      "refused",
    );
  }

  if (response.stop_reason === "max_tokens") {
    throw new QualifyError(
      `The verdict was cut off at ${MAX_TOKENS} tokens. Raise MAX_TOKENS or lower EFFORT.`,
      "truncated",
    );
  }

  if (!response.parsed_output) {
    throw new QualifyError(
      "Claude returned a response that didn't match the verdict schema.",
      "unparseable",
    );
  }

  return response.parsed_output;
}
