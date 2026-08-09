# 01 — Define the ideal customer

## Goal

Two files: the shapes that both halves of the app agree on, and the rubric Jake edits when he
changes his mind about who's worth talking to.

## Steps

1. **Write `src/lib/types.ts`** — the lead and the verdict, defined once, imported by the form,
   the task, and the tools. This file is the reason the repo isn't split in two.

   **Lead** — company name and "what they asked for" are the only required fields. Everything
   else is optional on purpose: a lead with three blank fields is a real signal about lead
   quality, and the rubric should be allowed to say so.

   | Field | Notes |
   |---|---|
   | `company` | required |
   | `ask` | required — what they want / their pain point |
   | `website`, `industry`, `companySize` | optional |
   | `contactName`, `contactRole` | optional |
   | `budgetSignal`, `timeline` | optional, free text — don't force a dropdown of bands |
   | `source` | how the lead arrived |
   | `notes` | free text |

   **Verdict** — structured so the UI renders fields, not a paragraph:

   | Field | Notes |
   |---|---|
   | `score` | 0–100 |
   | `tier` | `qualified` \| `nurture` \| `disqualified` |
   | `headline` | one sentence Jake could read out loud |
   | `criteria[]` | per criterion: name, verdict, one-line reason |
   | `biggestRisk` | the thing most likely to make this a waste of time |
   | `missingInfo[]` | what to ask before committing |
   | `nextAction` | the single recommended next step |

   Define these with `zod` schemas and infer the TypeScript types from them, so the same
   definition validates the form input and constrains Claude's output. One definition, three uses.

2. **Write `src/lib/icp.ts`** — a single exported string of plain English describing the ideal
   ButlerConnectAI customer. Prose, not data structures. It should cover:
   - who Jake actually helps and what outcome they buy
   - company size and maturity that fits a solo operator
   - what a real budget signal looks like versus a tyre-kicker
   - hard disqualifiers that should cap the score regardless of everything else
   - how to weigh a lead that's a good fit but vague, versus a poor fit that's very specific
   - explicit instruction that missing information is a signal, not a neutral

   Write a solid first draft. Say clearly in the file's comment that it's a starting point meant
   to be rewritten once Jake has seen real output — a rubric written before seeing any verdicts
   is a guess.

3. **Include the tier boundaries in the prose**, not in code. Whether 68 is "nurture" or
   "qualified" is a business judgement Jake should be able to change by editing a sentence.

## Done-test

Jake reads `src/lib/icp.ts` top to bottom and can say, for each paragraph, whether he agrees.
If any part of it requires understanding TypeScript to evaluate, it's written wrong — rewrite it
as prose.

## Notes

- Resist the urge to add weights, point values, or a scoring formula. The model reads prose well;
  a numeric formula in prose is a formula Jake now has to maintain in his head.
- Don't put company-identifying examples of real leads in this file. It's committed to git.
