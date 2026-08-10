import type { Verdict } from "@/lib/types";

/**
 * Hardcoded verdicts for building and checking the UI without a run.
 *
 * Stage 03 scaffolding. These are shaped like real output — the criteria names
 * come from `src/lib/icp.ts`, the scores from the runs Jake did in session 3 —
 * but nothing here is generated. Delete this file once stage 04 has been signed
 * off and the real thing has been seen in all three tiers.
 */

const QUALIFIED: Verdict = {
  score: 92,
  tier: "qualified",
  headline:
    "Owner-run supplier re-typing 60 quotes a week between three systems that all have APIs, already paying $1,200/month to do it by hand.",
  criteria: [
    {
      name: "Problem fit",
      verdict: "strong",
      reason:
        "A named, repetitive transcription task between email, a quoting sheet, QuickBooks and a job board — the exact shape automation removes.",
    },
    {
      name: "Volume and frequency",
      verdict: "strong",
      reason: "Roughly 60 quotes a week, every week, three touches each.",
    },
    {
      name: "Budget signal",
      verdict: "strong",
      reason:
        "$1,200/month already being spent on a part-time admin to do this, and Ruth would rather redirect it than add to it.",
    },
    {
      name: "Decision authority",
      verdict: "strong",
      reason: "Ruth is the owner and signs off on spend herself.",
    },
    {
      name: "Timeline and urgency",
      verdict: "strong",
      reason: "Busy season in about 10 weeks gives a real deadline that isn't invented pressure.",
    },
    {
      name: "Scope realism for one person",
      verdict: "adequate",
      reason: "Three integrations is two weeks of work, not a platform, but the job board is a Google Sheet and will need a schema before anything can write to it.",
    },
    {
      name: "Can the process be written down?",
      verdict: "adequate",
      reason:
        "The happy path is clear from the inquiry; the exceptions — part-availability, custom pricing — are not, and those are where the rules live.",
    },
    {
      name: "What happens when the AI is wrong?",
      verdict: "unknown",
      reason:
        "A mis-parsed quote reaching QuickBooks is a money error, and the lead doesn't say who checks before it lands.",
    },
    {
      name: "Systems and data readiness",
      verdict: "strong",
      reason: "QuickBooks, Gmail and Google Sheets all have stable APIs and no procurement process.",
    },
  ],
  biggestRisk:
    "Quote parsing is only as good as the emails, and contractor emails are messy — the failure mode is a wrong number reaching an accounting system unnoticed.",
  missingInfo: [
    "What does a quote email actually look like — can I see ten real ones, including the awkward ones?",
    "Who checks a quote before it goes to QuickBooks today, and should that check survive?",
    "What happens when a part is out of stock or priced specially?",
    "Is the Google Sheet job board the real record, or does something else own job status?",
  ],
  protectYourself: [
    "Define done as: quotes from the ten sample emails land correctly in all three systems. Not \"quoting is automated\" — the reopened-project failure starts with a vague finish line.",
    "Agree in writing that a human approves each quote before it writes to QuickBooks, so a parsing error is a caught error rather than an accounting one.",
    "Name the three systems in the quote. Adding a fourth later is a scope change with its own price.",
    "State that email formats change and re-tuning after go-live is chargeable, at an agreed rate.",
    "Set where support ends — a fixed handover window, then a support arrangement or nothing.",
  ],
  nextAction:
    "Ask Ruth for ten real quote emails including the awkward ones, then send a fixed-price proposal against those.",
};

const NURTURE: Verdict = {
  score: 47,
  tier: "nurture",
  headline:
    "A real 30-person CPA firm with a slow onboarding process and no detail yet — worth one call, not a proposal.",
  criteria: [
    {
      name: "Problem fit",
      verdict: "adequate",
      reason:
        "Client onboarding at a CPA firm is document collection, chasing and checks — reliably automatable, even though no steps are named yet.",
    },
    {
      name: "Volume and frequency",
      verdict: "unknown",
      reason: "The lead doesn't say how many clients they onboard, and 30 employees could mean anything from 5 a month to 50.",
    },
    {
      name: "Budget signal",
      verdict: "unknown",
      reason:
        "Money isn't mentioned. A 30-person firm with a paid contact form is not a company without money.",
    },
    {
      name: "Decision authority",
      verdict: "unknown",
      reason: "No name or role attached to the inquiry.",
    },
    {
      name: "Timeline and urgency",
      verdict: "unknown",
      reason: "Nothing stated. \"Takes too long\" is a complaint, not a deadline.",
    },
    {
      name: "Scope realism for one person",
      verdict: "adequate",
      reason:
        "Onboarding at this size is normally a few weeks of work, though it can't be sized until the steps are known.",
    },
    {
      name: "Can the process be written down?",
      verdict: "unknown",
      reason:
        "Almost certainly yes — firms run to a checklist — but nobody has written it down here yet.",
    },
    {
      name: "What happens when the AI is wrong?",
      verdict: "unknown",
      reason: "Client data at a CPA firm raises a confidentiality question nobody has asked.",
    },
    {
      name: "Systems and data readiness",
      verdict: "unknown",
      reason: "No practice management software named.",
    },
  ],
  biggestRisk:
    "They've gone quiet once already. The risk isn't that this is a bad lead — it's that it never becomes a conversation.",
  missingInfo: [
    "What does onboarding actually involve, step by step, from signed engagement letter to first piece of work?",
    "How many new clients a month?",
    "Which practice management system are you on?",
    "Where does it get stuck most often — chasing documents, or the checks?",
    "Who feels the pain of this most — and who would sign off on fixing it?",
  ],
  protectYourself: [
    "This is a scoping call, not a proposal. Don't put a number on it before the steps are written down.",
    "If they can't name the steps on the call, the first paid piece of work is writing them down — priced separately from building anything.",
  ],
  nextAction:
    "Send one short follow-up asking what onboarding involves step by step, and offer a 20-minute call rather than a written reply.",
};

const DISQUALIFIED: Verdict = {
  score: 15,
  tier: "disqualified",
  headline:
    "Pre-revenue founders offering 3% equity instead of fees, for a product they won't describe without an NDA.",
  criteria: [
    {
      name: "Problem fit",
      verdict: "weak",
      reason: "\"Help build out our platform\" names no process and no problem — there is nothing here to automate.",
    },
    {
      name: "Volume and frequency",
      verdict: "unknown",
      reason: "No product and no users, so no volume exists yet.",
    },
    {
      name: "Budget signal",
      verdict: "weak",
      reason:
        "A stated absence of money with equity offered in its place. This is the disqualifier itself, not a gap in the inquiry.",
    },
    {
      name: "Decision authority",
      verdict: "strong",
      reason: "A co-founder can decide — it just doesn't help when there is nothing to decide about.",
    },
    {
      name: "Timeline and urgency",
      verdict: "weak",
      reason: "\"ASAP, want to move fast\" with no launch date is pressure without a deadline.",
    },
    {
      name: "Scope realism for one person",
      verdict: "weak",
      reason: "Building a fintech platform from nothing is not a one-person engagement at any price.",
    },
    {
      name: "Can the process be written down?",
      verdict: "weak",
      reason: "They won't say what the platform does, so nothing can be written down.",
    },
    {
      name: "What happens when the AI is wrong?",
      verdict: "unknown",
      reason: "Unanswerable without knowing what it does.",
    },
    {
      name: "Systems and data readiness",
      verdict: "weak",
      reason: "No product, no users, no data.",
    },
  ],
  biggestRisk:
    "Months of open-ended build paid in equity in a pre-revenue fintech that may never launch, with no specification to say when it's finished.",
  missingInfo: [],
  protectYourself: [
    "If you reply at all, reply with fees. Equity in lieu of payment is the one line to hold — an exception here becomes the precedent for the next one.",
  ],
  nextAction:
    "Decline briefly and keep it warm: you work on fees, and you're happy to talk again once they're funded.",
};

/** Same lead as NURTURE, with nothing left to ask — checks the empty-list layout. */
const NOTHING_MISSING: Verdict = {
  ...NURTURE,
  score: 61,
  headline: "A well-described inquiry with every question already answered — checks the empty-state layout.",
  missingInfo: [],
  protectYourself: [],
  biggestRisk: "Nothing outstanding; this fixture exists to check that empty lists collapse cleanly.",
};

export const PREVIEW_VERDICTS = {
  qualified: QUALIFIED,
  nurture: NURTURE,
  disqualified: DISQUALIFIED,
  empty: NOTHING_MISSING,
} as const;

export type PreviewKey = keyof typeof PREVIEW_VERDICTS;

export const PREVIEW_KEYS = Object.keys(PREVIEW_VERDICTS) as PreviewKey[];

export function isPreviewKey(value: string | undefined): value is PreviewKey {
  return value !== undefined && (PREVIEW_KEYS as string[]).includes(value);
}

/** Submitting the form in stage 03 walks through these in order. */
export const FAKE_RUN_ORDER: PreviewKey[] = ["qualified", "nurture", "disqualified"];
