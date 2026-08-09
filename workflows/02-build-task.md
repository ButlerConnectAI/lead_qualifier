# 02 — Build the scoring logic

## Goal

A real verdict for a real lead, produced by the task running on Jake's machine via
`trigger.dev dev`, with no deploy and no frontend.

## Steps

1. **Write `src/lib/env.ts`** — up-front validation of every required key with one aggregated
   error naming all the missing ones, plus per-key accessors. Follow
   `C:\trigger-builds\src\env.ts`, including the reason in a comment: lazy checks fire *after*
   money has already been spent on earlier steps.

   Required for the task: `ANTHROPIC_API_KEY`, which comes from the Trigger.dev dashboard's DEV
   or PROD environment — never from a local file. Required for the frontend:
   `TRIGGER_SECRET_KEY`. Validate each side's own keys — the task must not demand
   `TRIGGER_SECRET_KEY`.

2. **Write `src/lib/qualify.ts`** — the scoring call. **This file must not import anything from
   `@trigger.dev/*`.** Keeping the scoring separable from the task means retry behaviour,
   logging, and metadata never tangle with the prompt, and the rubric can be reasoned about on
   its own.

   - Model `claude-sonnet-5`, per the convention in [`CLAUDE.md`](../CLAUDE.md).
   - System prompt: the qualifier's role plus the ICP prose from `src/lib/icp.ts`.
   - User message: the lead, with absent fields rendered explicitly as "not provided" rather
     than omitted — the model should see the gap, not infer it.
   - Constrain the response to the verdict schema from `src/lib/types.ts` and validate the
     result before returning. A malformed verdict must throw here, not surface as a blank card
     in the UI.

3. **Write three example leads** into `tools/example-leads/`: one obvious fit, one obvious waste
   of time, one genuinely ambiguous with half the fields blank. Fictional companies only — these
   are committed to git.

4. **Write `src/trigger/qualify-lead.ts`** — a thin Trigger.dev task wrapping `qualify()`:
   validate env first, log the start, call `qualify()`, return the verdict. Set `metadata` at
   each phase (`RUN_PHASES` in `src/lib/types.ts`) so the frontend has something specific to
   display while it waits.

5. **Confirm Jake has set `ANTHROPIC_API_KEY` in the Trigger.dev dashboard** for both the DEV and
   PROD environments. DEV is what makes the loop below work; without it the task fails on the
   first run. He does this in the browser — never ask for the key in chat.

6. **Iterate.** Two terminals: `npm run dev:task` running, then `npm run smoke -- <lead>` per
   change. Editing `src/lib/icp.ts` hot-reloads. Expect the first rubric to be too generous;
   that's the normal first failure.

7. **Delete `src/trigger/ping.ts`.**

## Done-test

With `npm run dev:task` running:

```
npm run smoke -- strong-fit
npm run smoke -- poor-fit
```

The strong fit must come back `qualified` and the poor fit must come back `disqualified`. **A
rubric that qualifies both is the expected first result, not a pass** — go back to
`src/lib/icp.ts` and sharpen the disqualifiers.

Also run the ambiguous lead and read the whole verdict, not just the tier. The `missingInfo`
list is the part most likely to be useless on the first attempt.

## Notes

- Every `smoke` run costs real Anthropic money. It's cents, but don't loop it.
- If the model returns prose where structured output was expected, fix the schema constraint —
  don't add a parser. A parser is a permanent tax for a fixable prompt problem.
- The `.describe()` text in `src/lib/types.ts` reaches the model as part of the tool definition.
  It's prompt text, so treat a bad field as a prompt bug before assuming the rubric is at fault.
